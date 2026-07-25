import { useEffect, useRef } from "react";
import { useMouse } from "../../libs/useMouse";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { remapClamp } from "../../libs/remapClamp";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

const Poster = () => {
  const { coords, updateMouse } = useMouse();

  const tex1 = useTexture("/poster.png") as any;
  const tex2 = useTexture("/home.png") as any;

  tex1.minFilter = tex1.magFilter = THREE.LinearFilter;
  tex2.minFilter = tex2.magFilter = THREE.LinearFilter;
  tex1.colorSpace = THREE.SRGBColorSpace;
  tex2.colorSpace = THREE.SRGBColorSpace;

  const material = useRef<THREE.ShaderMaterial>(null);

  const { radius, strength, progress } = useControls("Poster", {
    radius: { value: 0.4, min: 0, max: 1, step: 0.01 },
    strength: { value: 0.005, min: 0, max: 0.1, step: 0.001 },
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
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRadius: { value: radius },
    uStrength: { value: strength },
    uProgress: { value: 0 },
  });

  // Sync Leva slider to uniform when manually scrubbing, without overwriting GSAP in useFrame
  // useEffect(() => {
  //   if (material.current) {
  //     material.current.uniforms.uProgress.value = progress;
  //   }
  // }, [progress]);

  useEffect(() => {
    const handleRippleClick = () => {
      if (!material.current) return;
      gsap.fromTo(
        material.current.uniforms.uProgress,
        { value: 0 },
        {
          value: 1,
          duration: 2.4,
          // ease: "power2.inOut",
          ease: CustomEase.create("custom", "M0,0 C0.2,0 0.15,1 1,1"),
        },
      );
    };

    window.addEventListener("ripple-click", handleRippleClick);
    return () => {
      window.removeEventListener("ripple-click", handleRippleClick);
    };
  }, []);

  useFrame((_state, delta) => {
    if (!material.current) return;

    updateMouse();

    material.current.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );

    const mouseX = remapClamp(coords.x, -1, 1, 0, 1);
    const mouseY = remapClamp(coords.y, -1, 1, 0, 1);

    material.current.uniforms.uMouse.value.set(mouseX, mouseY);
    material.current.uniforms.uRadius.value = radius;
    material.current.uniforms.uStrength.value = strength;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2, 256, 256]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent
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

      vUv = uv;
      vDistord = direction * influence * uStrength;
      vInfluence = influence;

      gl_Position = vec4(pos.xy, 0.9, 1.0);
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

    void main() {

        vec2 uv = vUv;

        // Texture 1 (white text) moves up along Y axis as uProgress increases (0 -> 1)
        vec2 uv1 = vec2(uv.x, uv.y - uProgress);

        vec4 tex1 = vec4(0.0);
        if (uv1.y >= 0.0 && uv1.y <= 1.0) {
            tex1 = texture2D(uTexture1, uv1);
        }

        // Texture 2 (black text)
        vec4 tex2 = texture2D(uTexture2, uv);

        // Alpha for Texture 1
        float a1 = (uv1.y >= 0.0 && uv1.y <= 1.0) ? tex1.a : 0.0;

        // Effective animated alpha for Texture 2
        float opacity2 = smoothstep(0.4, 1.0, uProgress);
        float a2 = tex2.a * opacity2;

        // Discard if neither texture is visible at this pixel
        if (a1 < 0.6 && a2 < 0.6) {
            discard;
        }

        // Blend Texture 1 (white) on top of Texture 2 (black)
        vec3 color = mix(tex2.rgb, tex1.rgb, a1);
        float alpha = max(a1, a2);

        gl_FragColor = vec4(color, alpha);

    }

`;

export default Poster;
