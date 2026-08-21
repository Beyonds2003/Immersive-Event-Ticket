import { useEffect, useRef, useState } from "react";
import { useMouse } from "../../libs/useMouse";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { remapClamp } from "../../libs/remapClamp";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useRingDistordTexture } from "../../libs/ringDistordRenderTarget";
import { useCanvasTextTexture } from "../../libs/useCanvasTextTexture";
import { useAtomValue } from "jotai";
import { pathnameAtom } from "../../libs/atoms";
import { posterConfigs } from "../../libs/config/posterConfig";

const Poster = () => {
  const pathname = useAtomValue(pathnameAtom);
  const pageZ = pathname === "/" ? 1 : 1;
  const { coords, updateMouse, mouseMoved } = useMouse();

  const currentConfig = posterConfigs[pathname] ?? posterConfigs["/"];

  // nextPathname drives tex2 preloading — kept as state so a re-render
  // is triggered as soon as the ripple-click animation starts in Gradient,
  // ensuring the destination texture is ready before PageNavigator navigates.
  const [nextPathname, setNextPathname] = useState<string>(pathname);
  const nextPathnameRef = useRef<string>(pathname);
  const nextConfig = posterConfigs[nextPathname] ?? posterConfigs["/"];

  const tex1 = useCanvasTextTexture(currentConfig);
  const tex2 = useCanvasTextTexture(nextConfig);

  const ringTex = useRingDistordTexture();

  const material = useRef<THREE.ShaderMaterial>(null);

  const { radius, strength, progress } = useControls("Poster", {
    radius: { value: 0.4, min: 0, max: 1, step: 0.01 },
    strength: { value: 0.01, min: 0, max: 0.1, step: 0.001 },
    progress: { value: 0, min: 0, max: 1, step: 0.01 },
  });

  const uniforms = useRef({
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTextureResolution: {
      value: new THREE.Vector2(tex2.image.width, tex2.image.height),
    },
    uTexture1: { value: tex1 },
    uTexture2: { value: tex2 },
    uMouse: { value: new THREE.Vector2(999, 999) },
    uRadius: { value: radius },
    uStrength: { value: strength },
    uProgress: { value: 0 },
    uRingDistordTexture: { value: ringTex },
    uPageZ: { value: pageZ },
  });

  // Kill any running GSAP tween on uProgress and reset when route changes
  useEffect(() => {
    if (material.current) {
      gsap.killTweensOf(material.current.uniforms.uProgress);
      material.current.uniforms.uProgress.value = 0;
    }
  }, [pathname]);

  useEffect(() => {
    const handleRippleClick = (e: Event) => {
      if (!material.current) return;

      const { isPageTransition, nextPathname } = (e as CustomEvent).detail;

      if (nextPathname) {
        nextPathnameRef.current = nextPathname;
        // Trigger re-render so useCanvasTextTexture picks up the new config
        // and starts building tex2 while the Gradient animation is running.
        setNextPathname(nextPathname);
      }

      if (isPageTransition) {
        gsap.fromTo(
          material.current.uniforms.uProgress,
          { value: 0 },
          {
            value: 1,
            duration: 2,
            ease: "power2.inOut",
            // ease: CustomEase.create("custom", "M0,0 C0.2,0 0.15,1 1,1"),
          },
        );
      }
    };

    window.addEventListener("ripple-click", handleRippleClick);
    return () => {
      window.removeEventListener("ripple-click", handleRippleClick);
    };
  }, []);

  const mouseInit = useRef(false);
  useFrame((_state, delta) => {
    if (!material.current) return;

    updateMouse();

    material.current.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );

    const mouseX = remapClamp(coords.x, -1, 1, 0, 1);
    const mouseY = remapClamp(coords.y, -1, 1, 0, 1);

    if (mouseInit.current) {
      material.current.uniforms.uMouse.value.set(mouseX, mouseY);
    } else {
      mouseInit.current = mouseMoved.current;
    }

    // material.current.uniforms.uProgress.value = progress;

    material.current.uniforms.uRadius.value = radius;
    material.current.uniforms.uStrength.value = strength;
    material.current.uniforms.uTexture1.value = tex1;
    material.current.uniforms.uTexture2.value = tex2;
    material.current.uniforms.uRingDistordTexture.value = ringTex;
    material.current.uniforms.uPageZ.value = pageZ;
  });

  return (
    <mesh renderOrder={1} frustumCulled={false}>
      <planeGeometry args={[2, 2, 20, 20]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent
        depthWrite={false}
        // wireframe
      />
    </mesh>
  );
};

const vertexShader = `


    uniform float uRadius;
    uniform float uStrength;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform float uPageZ;

    uniform sampler2D uRingDistordTexture;

    varying vec2 vUv;
    varying vec2 vDistord;
    varying float vInfluence;

    void main() {

      vec3 pos = position;

      vec2 vertexUV = pos.xy * 0.5 + 0.5;

      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

      vec2 delta = uMouse - vertexUV;

      float distanceToMouse = length(delta * aspect);

      vec2 direction = delta / max(length(delta), 0.025);

      float influence = smoothstep(uRadius, 0.0, distanceToMouse);

      pos.x += direction.x * influence * uStrength;
      pos.y += direction.y * influence * uStrength;

      // ── Per-pixel ring distortion (smooth, no vertex aliasing) ────────────
      vec4  ring        = texture2D(uRingDistordTexture, uv);
      vec2  ringDistord = ring.rg * 2.0 - 1.0;  // decode displacement
      float ringMask    = ring.b;                // grayscale ring intensity (0..1)
      pos.xy               += ringDistord * ringMask; 

      vUv = uv;
      vDistord = direction * influence * uStrength;
      vInfluence = influence;

      gl_Position = vec4(pos.xy, uPageZ, 1.0);
    }


`;

const fragmentShader = `

    varying vec2 vUv;
    varying vec2 vDistord;
    varying float vInfluence;

    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform float uProgress;
    uniform vec2 uMousePos;
    uniform vec2 uResolution;

    uniform sampler2D uRingDistordTexture;

    // Remap value from [inMin, inMax] to [0, 1], clamped
    float remap(float value, float inMin, float inMax) {
        return clamp((value - inMin) / (inMax - inMin), 0.0, 1.0);
    }

    void main() {

        vec2 uv = vUv;

        // --- tex1 slide-up: active during uProgress 0.0 -> 0.6 ---
        float slideProgress = remap(uProgress, 0.0, 0.6);
        vec2 uv1 = vec2(uv.x, uv.y - slideProgress);

        vec4 tex1 = texture2D(uTexture1, uv1);
        vec4 tex2 = texture2D(uTexture2, uv);

        // Alpha for Texture 1 (slides out as it moves up)
        float a1 = tex1.a;

        // --- tex2 fade-in: active during uProgress 0.6 -> 1.0 ---
        float fadeProgress = remap(uProgress, 0.4, 1.0);
        float opacity2 = fadeProgress;
        float a2 = tex2.a * opacity2;

        // Discard if neither texture is visible at this pixel
        if (a1 < 0.01 && a2 < 0.01) {
            discard;
        }

        // Blend Texture 1 (white) on top of Texture 2 (black)
        vec3 color = mix(tex2.rgb, tex1.rgb, a1);
        float alpha = max(a1, a2);

        gl_FragColor = vec4(color, alpha);

    }

`;

export default Poster;
