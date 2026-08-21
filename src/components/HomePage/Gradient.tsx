import { useEffect, useRef } from "react";
import { useMouse } from "../../libs/useMouse";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { remapClamp } from "../../libs/remapClamp";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { oklab } from "../../libs/glsl/oklab";
import gsap from "gsap";
import { pageColor } from "../../libs/config/pageColor";
import { useAtomValue } from "jotai";
import { pathnameAtom } from "../../libs/atoms";

const Gradient = () => {
  const pathname = useAtomValue(pathnameAtom);
  const { coords, updateMouse } = useMouse();

  const material = useRef<THREE.ShaderMaterial>(null);

  const {
    progress,
    colorA,
    colorB,
    colorC,
    colorD,
    ringWidth,
    ringBlur,
    ringOffset,
    ringOffset2,
  } = useControls("Gradient", {
    progress: { value: 0, min: 0, max: 1, step: 0.01 },

    // colorA: { value: "#06ecff" },
    // colorB: { value: "#00e1ff" },
    // colorC: { value: "#bcbcf8" },
    // colorD: { value: "#b7bbff" },

    colorA: { value: "#bcbcf8" },
    colorB: { value: "#b7bbff" },
    colorC: { value: "#06ecff" },
    colorD: { value: "#00e1ff" },

    ringWidth: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
    ringBlur: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
    ringOffset: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    ringOffset2: { value: 0.16, min: 0, max: 0.5, step: 0.01 },
  });

  const clickPos = useRef(new THREE.Vector2(0, 0));

  const routeColorMap: Record<string, keyof typeof pageColor> = {
    "/explore": "Explore",
    "/": "Home",
    "/detail": "Detail",
    "/nfc": "Nfc",
    "/faq": "Faq",
  };

  const pColor = pageColor[routeColorMap[pathname] ?? "Home"];

  const uniforms = useRef({
    time: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uProgress: { value: 1 },
    uClickPos: { value: new THREE.Vector2(0, 0) },
    uColorA: { value: new THREE.Color(pColor.colorA) },
    uColorB: { value: new THREE.Color(pColor.colorB) },
    uColorC: { value: new THREE.Color(colorC) },
    uColorD: { value: new THREE.Color(colorD) },
    uRingWidth: { value: ringWidth },
    uRingBlur: { value: ringBlur },
    uRingOffset: { value: ringOffset },
    uRingOffset2: { value: ringOffset2 },
    uRadialCoord: {
      value: new THREE.Vector2(pColor.coord[0], pColor.coord[1]),
    },
  });

  // Handle color besed on user route
  useEffect(() => {
    if (!material.current) return;

    const targetColor = pageColor[routeColorMap[pathname] ?? "Home"];

    material.current.uniforms.uColorA.value = new THREE.Color(
      targetColor.colorA,
    );
    material.current.uniforms.uColorB.value = new THREE.Color(
      targetColor.colorB,
    );

    material.current.uniforms.uRadialCoord.value.set(
      targetColor.coord[0],
      targetColor.coord[1],
    );
  }, [pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (!material.current) return;

      const {
        x,
        y,
        colorA,
        colorB,
        isPageTransition,
        timeScale,
        nextPathname,
        transitionFireAt = 1,
        delay,
      } = (e as CustomEvent).detail;
      clickPos.current.set(x, y);

      // Copy current visible colors (uColorA/uColorB) into background base (uColorC/uColorD)
      material.current.uniforms.uColorC.value.copy(
        material.current.uniforms.uColorA.value,
      );
      material.current.uniforms.uColorD.value.copy(
        material.current.uniforms.uColorB.value,
      );

      // Set new target colors to reveal in uColorA/uColorB
      material.current.uniforms.uColorA.value.set(colorA);
      material.current.uniforms.uColorB.value.set(colorB);

      // Reset progress to 0 so the ripple starts seamlessly from the click point
      material.current.uniforms.uProgress.value = 0;

      // Guard: ensures page-transition-end is dispatched only once per ripple.
      let transitionFired = false;

      const fireTransition = () => {
        if (!transitionFired && isPageTransition) {
          transitionFired = true;
          window.dispatchEvent(
            new CustomEvent("page-transition-end", {
              detail: { nextPathname },
            }),
          );
        }
      };

      // Ripple ring progress
      const tween = gsap.to(material.current.uniforms.uProgress, {
        value: 1,
        duration: isPageTransition ? 2.4 : 1.6,
        ease: "power1.out",
        delay,
        onUpdate() {
          // Fire early when the tween crosses the transitionFireAt threshold.
          if (transitionFireAt < 1 && this.progress() >= transitionFireAt) {
            fireTransition();
          }
        },
        onComplete: () => {
          // Fallback for default case (transitionFireAt === 1) or any missed early fire.
          // fireTransition();
        },
      });

      tween.timeScale(timeScale);
    };
    window.addEventListener("ripple-click", handler);
    return () => window.removeEventListener("ripple-click", handler);
  }, []);

  useFrame((_state, delta) => {
    if (!material.current) return;

    updateMouse();

    material.current.uniforms.time.value += delta;

    material.current.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );

    // material.current.uniforms.uProgress.value = progress;

    material.current.uniforms.uClickPos.value.copy(clickPos.current);

    // material.current.uniforms.uColorA.value.set(colorA);
    // material.current.uniforms.uColorB.value.set(colorB);
    // material.current.uniforms.uColorC.value.set(colorC);
    // material.current.uniforms.uColorD.value.set(colorD);

    material.current.uniforms.uRingWidth.value = ringWidth;
    material.current.uniforms.uRingBlur.value = ringBlur;
    material.current.uniforms.uRingOffset.value = ringOffset;
    material.current.uniforms.uRingOffset2.value = ringOffset2;
  });

  return (
    <mesh renderOrder={1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

const vertexShader = `

    varying vec2 vUv;

    void main() {

        gl_Position = vec4(position.xy, 1., 1.0);

        // Varyings
        vUv = uv;
    }

`;

const fragmentShader = `

    uniform float time;
    uniform vec2 uResolution;
    uniform float uProgress;
    uniform vec2 uRadialCoord;

    // -1 0 1
    uniform vec2 uClickPos;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform vec3 uColorD;

    uniform float uRingWidth;
    uniform float uRingBlur;
    uniform float uRingOffset;
    uniform float uRingOffset2;

    varying vec2 vUv;

    ${oklab}

    float circle(vec2 uv, float radius, float blur) {

      vec2 mouse = uClickPos * 0.5 + vec2(0.5);

      vec2 diff = uv - mouse;
      diff.x *= uResolution.x / uResolution.y; // aspect correction

      return smoothstep(radius - blur, radius + blur, length(diff));
    }

    float ring(
        float dist,
        float radius,
        float width,
        float blur
    ){
        float inner = smoothstep(
            radius-width-blur,
            radius-width,
            dist
        );

        float outer = smoothstep(
            radius,
            radius+blur,
            dist
        );

        return inner*(1.0-outer);
    }

    float remap(float value, float inMin, float inMax, float outMin, float outMax) {
       return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
    }

    float hash(vec2 p)
    {
        return fract(
            sin(dot(p, vec2(127.1,311.7)))
            *43758.5453123
        );
    }

    void main() {

        vec2 uv = vUv;
        uv.x *= uResolution.x / uResolution.y; // aspect correction

        // Gradient
        float radial = length(uv - uRadialCoord);
        radial = smoothstep(0., 0.8, radial);

        vec3 texA = mixOKLab(uColorA, uColorB, radial);
        vec3 texB = mixOKLab(uColorC, uColorD, radial);

        float screenAspect = uResolution.x / uResolution.y;

        // Compute the click origin in aspect-corrected UV space
        vec2 mouse = uClickPos * 0.5 + vec2(0.5);
        vec2 mouseAspect = vec2(mouse.x * screenAspect, mouse.y);

        // Distance from click to each corner in aspect-corrected UV space
        float d00 = length(mouseAspect - vec2(0.0,           0.0));
        float d10 = length(mouseAspect - vec2(screenAspect,  0.0));
        float d01 = length(mouseAspect - vec2(0.0,           1.0));
        float d11 = length(mouseAspect - vec2(screenAspect,  1.0));
        float maxDist = max(max(d00, d10), max(d01, d11));

        // Scale progress by maxDist so the circle always reaches the farthest corner at uProgress=1
        float p = (uProgress * maxDist * 1.8) - 0.35;
        float c = circle(vUv, p, 0.2);

        // Ring effect
        vec2 diff = vUv - mouse;
        diff.x *= uResolution.x / uResolution.y; // aspect correction

        float ringWidth = uRingWidth;
        float ringBlur = uRingBlur;
        float ringOffset = uRingOffset;

        float ring1 = ring(length(diff), p - 0., ringWidth, ringBlur);
        float ring2 = ring(length(diff), p + ringOffset, ringWidth, ringBlur);

        float ring3 = ring(length(diff), p + uRingOffset2,  ringWidth * 0.6, ringBlur * 0.8);

        float ring = ring1 + ring2;

        float effect = clamp((1.0 - c) + ring * 0.2, 0.0, 1.0);

        vec3 final = mix(texB, texA, 1. - c);

        // Colored rings
        final += texB * ring1 * 0.1;
        final += texA * ring2 * 0.12;
        final += texB * ring3 * 0.14;

        // Grain effect
        float grain = hash(gl_FragCoord.xy);

        grain = grain * 2.0 - 1.0;

        final += grain * 0.03;

        gl_FragColor = vec4(vec3(final), 1.);
      //  gl_FragColor = vec4(vec3(radial), 1.);
    }

`;

export default Gradient;
