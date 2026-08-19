/**
 * ringDistordRenderTarget.tsx
 *
 * Shared full-screen WebGLRenderTarget that renders a ring-distortion effect
 * into an offscreen texture every frame, before the main scene renders.
 *
 * Uses Jotai atoms for global state — no Provider needed, no parent wrapping.
 * <RingDistordRenderTarget /> and its consumers can be any siblings inside <Canvas>.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Texture channel layout                                                 │
 * │  R  =  UV displacement X   (encoded 0..1,  0.5 = no displacement)      │
 * │  G  =  UV displacement Y   (encoded 0..1,  0.5 = no displacement)      │
 * │  B  =  Grayscale ring mask (0 = no ring,   1   = ring peak)            │
 * │  A  =  1.0  (always opaque)                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Decoding in a consumer GLSL shader:
 *   uniform sampler2D uRingDistord;
 *   // ...
 *   vec4  d      = texture2D(uRingDistord, vUv);
 *   vec2  uvOff  = (d.rg * 2.0 - 1.0) * uDistordStrength; // UV warp
 *   float mask   = d.b;                                    // ring glow / mask
 *   vec2  warped = vUv + uvOff;                            // distorted UVs
 *
 * Usage — Main.tsx  (no wrapping required):
 *   <Canvas>
 *     <RingDistordRenderTarget />   ← place anywhere inside Canvas
 *     <Poster />
 *     <Gradient />
 *   </Canvas>
 *
 * Usage — any component inside <Canvas>:
 *   const texture = useRingDistordTexture();
 *   // → THREE.Texture | null (null before first frame, handle gracefully)
 */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import gsap from "gsap";
import { atom, useAtomValue, useSetAtom } from "jotai";

// ---------------------------------------------------------------------------
// Jotai atom  — global, no Provider needed
// ---------------------------------------------------------------------------

/**
 * Holds the shared ring-distortion texture.
 * null until <RingDistordRenderTarget /> mounts and renders its first frame.
 */
export const ringDistordTextureAtom = atom<THREE.Texture | null>(null);

/**
 * Convenience hook — returns the shared ring-distortion texture.
 * Returns null before <RingDistordRenderTarget /> has mounted.
 * Handle null in your component (e.g. skip setting the uniform until ready).
 */
export const useRingDistordTexture = () => useAtomValue(ringDistordTextureAtom);

// ---------------------------------------------------------------------------
// Shaders — Offscreen ring distortion pass
// ---------------------------------------------------------------------------

const rtVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    gl_Position = vec4(position.xy, 1.0, 1.0);

    vUv         = uv;
  }
`;

const rtFragmentShader = /* glsl */ `
  uniform vec2  uResolution;
  uniform float uProgress;       
  uniform vec2  uClickPos;          // NDC −1..1  (matches useMouse convention)
  uniform float uRingWidth;
  uniform float uRingBlur;
  uniform float uRingOffset;
  uniform float uRingOffset2;
  uniform float uDistordStrength;  
  uniform float uDirection;

  varying vec2 vUv;

  // Soft concentric ring at a given radius
  float ring(float dist, float radius, float width, float blur) {
    float inner = smoothstep(radius - width - blur, radius - width, dist);
    float outer = smoothstep(radius, radius + blur, dist);
    return inner * (1.0 - outer);
  }

  float remap(float value, float from1, float to1, float from2, float to2) {
    return (value - from1) / (to1 - from1) * (to2 - from2) + from2;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;

    // Convert NDC click position to UV space (0..1)
    vec2 mouse = uClickPos * 0.5 + 0.5;

    // ── Expanding radius that always covers the full screen ────────────────
    // Compute aspect-corrected distance from click to every corner and take
    // the maximum — this ensures the ring front reaches the farthest pixel
    // exactly when uProgress reaches 1.
    vec2  mA   = vec2(mouse.x * aspect, mouse.y);
    float d00  = length(mA - vec2(0.0,    0.0));
    float d10  = length(mA - vec2(aspect, 0.0));
    float d01  = length(mA - vec2(0.0,    1.0));
    float d11  = length(mA - vec2(aspect, 1.0));
    float maxD = max(max(d00, d10), max(d01, d11));

    // Current ring-front radius
    float p    = (uProgress * maxD * 1.5) - 0.35;

    // ── Aspect-corrected pixel distance from click ─────────────────────────
    vec2  diff = vUv - mouse;
    diff.x    *= aspect;
    float dist = length(diff);

    // ── Three overlapping ring bands ───────────────────────────────────────
    float r1   = ring(dist, p,                uRingWidth,       uRingBlur);
    float mask = r1;

    // ── Displacement direction (mirrors Poster.tsx vertex shader logic) ────
    // direction = (pixel → outward from click), aspect-corrected, normalized
    // max(|d|, epsilon) avoids division by zero exactly at the click origin
    vec2 rawDiff   = vUv - mouse;
    rawDiff.x     *= aspect;
    vec2 direction = rawDiff / max(length(rawDiff), 0.001);

    // Secrect Sauce
    direction *= uDirection;

    // UV-space displacement = outward direction × ring intensity × strength
    vec2 displacement = direction * mask * uDistordStrength;

    float displacementStrength = remap(
        uProgress,
        0.0,
        1.0,
        1.0,
        0.0
    );

    displacement *= 1. - pow(1. - displacementStrength, 2.5);

    // ── Encode into RGBA ───────────────────────────────────────────────────
    //  R  = displace X  mapped 0..1  (0.5 = zero displacement)
    //  G  = displace Y  mapped 0..1
    //  B  = grayscale ring mask   (0 = dark, 1 = bright ring)
    //  A  = 1.0  (always opaque RT)
    gl_FragColor = vec4(
      displacement.x * 0.5 + 0.5,
      displacement.y * 0.5 + 0.5,
      mask,
      1.0
    );
  }
`;

// ---------------------------------------------------------------------------
// Shaders — Debug blit (simple texture preview)
// ---------------------------------------------------------------------------

const debugVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv         = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const debugFragmentShader = /* glsl */ `
  uniform sampler2D uTex;
  varying vec2 vUv;
  void main() {

    vec4 tex = texture2D(uTex, vUv);

    gl_FragColor = tex;
  }
`;

export const RingDistordRenderTarget = () => {
  const { gl } = useThree();
  const setTexture = useSetAtom(ringDistordTextureAtom);

  // ── Leva controls ─────────────────────────────────────────────────────────
  const {
    showDebug,
    ringWidth,
    ringBlur,
    ringOffset,
    distordStrength,
    progress,
  } = useControls("RingDistord RT", {
    showDebug: { value: false, label: "Show Debug" },
    progress: { value: 0, min: 0, max: 1, step: 0.01, label: "Progress" },
    ringWidth: {
      value: 0.02,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Ring Width",
    },
    ringBlur: { value: 0.3, min: 0, max: 0.5, step: 0.01, label: "Ring Blur" },
    ringOffset: {
      value: 0.1,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Ring Offset 1",
    },
    distordStrength: {
      value: 0.05,
      min: 0,
      max: 0.1,
      step: 0.001,
      label: "Distord Strength",
    },
  });

  // ── WebGLRenderTarget (created once, stable identity) ────────────────────
  const renderTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      }),
    [],
  );

  // ── Publish texture into Jotai atom & clean up on unmount ────────────────
  useEffect(() => {
    setTexture(renderTarget.texture);
    return () => {
      setTexture(null);
      renderTarget.dispose();
    };
  }, [renderTarget, setTexture]);

  // ── Dedicated offscreen scene + orthographic camera ───────────────────────
  const offscreenScene = useMemo(() => new THREE.Scene(), []);
  const offscreenCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  // ── Uniforms (stable ref, mutated each frame — no re-render cost) ─────────
  const uniforms = useRef<Record<string, THREE.IUniform>>({
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uProgress: { value: 0 },
    uClickPos: { value: new THREE.Vector2(0, 0) },
    uRingWidth: { value: ringWidth },
    uRingBlur: { value: ringBlur },
    uRingOffset: { value: ringOffset },
    uDistordStrength: { value: distordStrength },
    uDirection: { value: -1 },
  });

  // ── Build offscreen quad mesh once ───────────────────────────────────────
  useEffect(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: rtVertexShader,
      fragmentShader: rtFragmentShader,
      uniforms: uniforms.current,
    });
    const mesh = new THREE.Mesh(geo, mat);
    offscreenScene.add(mesh);

    return () => {
      offscreenScene.remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [offscreenScene]);

  // ── "ripple-click" → GSAP animates uProgress 0 → 1 ──────────────────────
  const clickPos = useRef(new THREE.Vector2(0, 0));
  const progressTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { x, y, isPageTransition, rippleDirection, timeScale, delay } = (
        e as CustomEvent
      ).detail;

      // Store NDC click position (−1..1)
      clickPos.current.set(x, y);

      // Kill running animation, reset to 0, then drive to 1
      progressTween.current?.kill();
      uniforms.current.uProgress.value = 0;
      uniforms.current.uDirection.value = rippleDirection === "in" ? -1 : 1;

      progressTween.current = gsap.to(uniforms.current.uProgress, {
        value: 1,
        duration: isPageTransition ? 1.8 : 1.6 - 0.3,
        ease: "power1.out",
        delay,
      });

      progressTween.current.timeScale(timeScale);
    };

    window.addEventListener("ripple-click", handler);
    return () => window.removeEventListener("ripple-click", handler);
  }, []);

  // ── Offscreen render at priority −1 (before the main scene) ──────────────
  useFrame(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Push live Leva values + click state to uniforms
    uniforms.current.uResolution.value.set(w, h);
    uniforms.current.uClickPos.value.copy(clickPos.current);
    uniforms.current.uRingWidth.value = ringWidth;
    uniforms.current.uRingBlur.value = ringBlur;
    uniforms.current.uRingOffset.value = ringOffset;
    uniforms.current.uDistordStrength.value = distordStrength;

    // uniforms.current.uProgress.value = progress;

    // Resize RT if viewport changed
    if (renderTarget.width !== w || renderTarget.height !== h) {
      renderTarget.setSize(w, h);
    }

    // Render into the off-screen target, then restore the previous target
    const prevRT = gl.getRenderTarget();
    gl.setRenderTarget(renderTarget);
    gl.clear();
    gl.render(offscreenScene, offscreenCamera);
    gl.setRenderTarget(prevRT);
  }, -1); // priority −1 = before everything else

  // ── Debug quad — bottom-right corner, draws on top of the scene ──────────
  const debugUniforms = useMemo(
    () => ({ uTex: { value: renderTarget.texture } }),
    [renderTarget],
  );

  const { viewport } = useThree();

  if (!showDebug) return null;

  return (
    <mesh renderOrder={999}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        vertexShader={debugVertexShader}
        fragmentShader={debugFragmentShader}
        uniforms={debugUniforms}
        // depthTest={false}
        // depthWrite={false}
      />
    </mesh>
  );
};
