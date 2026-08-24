import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls, folder } from "leva";
import * as THREE from "three";
import gsap from "gsap";

export interface GodRaysProps {
  position?: [number, number, number];
  size?: [number, number];
  rotation?: [number, number, number];
  rayColor?: string;
  glowColor?: string;
  coreColor?: string;
  intensity?: number;
  speed?: number;
  rayCount?: number;
  decay?: number;
  density?: number;
  noiseScale?: number;
  noiseStrength?: number;
  originX?: number;
  originY?: number;
  coneAngle?: number;
  coneWidth?: number;
  opacity?: number;
  blendMode?: "Additive" | "Normal";
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uOrigin;
  uniform vec3 uRayColor;
  uniform vec3 uGlowColor;
  uniform vec3 uCoreColor;
  uniform float uIntensity;
  uniform float uSpeed;
  uniform float uRayCount;
  uniform float uDecay;
  uniform float uDensity;
  uniform float uNoiseScale;
  uniform float uNoiseStrength;
  uniform float uConeAngle;
  uniform float uConeWidth;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vPosition;

  // 2D Simplex Noise
  vec3 permute(vec3 x) { 
    return mod(((x * 34.0) + 1.0) * x, 289.0); 
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Vector from light origin in UV space
    vec2 delta = vUv - uOrigin;
    float dist = length(delta);
    float angle = atan(delta.y, delta.x); // [-PI, PI]

    // Convert cone angle from degrees to radians
    float targetAngle = radians(uConeAngle);
    float halfWidth = radians(uConeWidth * 0.5);

    // Angular distance with circular wrap-around
    float angleDiff = mod(angle - targetAngle + 3.14159265359, 6.28318530718) - 3.14159265359;
    float coneMask = smoothstep(halfWidth, halfWidth * 0.15, abs(angleDiff));

    // Time-based motion
    float t = uTime * uSpeed;

    // Multi-frequency noise modulation along rays
    float n1 = snoise(vec2(angle * uNoiseScale, t * 0.3));
    float n2 = snoise(vec2(angle * uNoiseScale * 2.3 + 5.2, -t * 0.4 + dist * 1.2));
    float n3 = snoise(vec2(angle * uNoiseScale * 4.7 + 12.8, t * 0.7));
    
    float noiseCombined = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15) * uNoiseStrength;

    // Ray harmonic streaks
    float rayPattern1 = sin((angle + noiseCombined * 0.4) * uRayCount + t * 0.3);
    float rayPattern2 = sin((angle - noiseCombined * 0.25) * (uRayCount * 1.618) - t * 0.2 + 2.1);
    float rayPattern3 = cos((angle + noiseCombined * 0.6) * (uRayCount * 2.618) + t * 0.5 + 4.5);

    // Combine ray harmonics into soft/sharp light shafts
    float rays = (rayPattern1 * 0.5 + 0.5) * 0.5
               + (rayPattern2 * 0.5 + 0.5) * 0.3
               + (rayPattern3 * 0.5 + 0.5) * 0.2;

    // Power curve for beam contrast
    rays = pow(rays, 1.7) * uDensity;

    // Subtle shimmering dust motes along the beam
    float motes = snoise(vec2(dist * 7.0 - t * 0.8, angle * 12.0));
    motes = smoothstep(0.45, 0.9, motes) * 0.3;
    rays += motes * smoothstep(0.0, 0.4, rays);

    // Exponential distance decay (bright at source, fading outwards)
    float decayFactor = exp(-dist * uDecay);
    
    // Vignette mask to softly fade at plane boundaries
    float edgeVignette = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x)
                       * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);

    // Total intensity
    float rayIntensity = rays * decayFactor * coneMask * edgeVignette * uIntensity;
    
    // Ambient radial glow from the light source
    float coreGlow = exp(-dist * (uDecay * 1.6)) * 0.6 * coneMask * edgeVignette * uIntensity;

    // Color composition: Atmospheric glow -> Ray Color -> Brilliant Core
    vec3 col = mix(uGlowColor, uRayColor, clamp(rayIntensity * 0.85, 0.0, 1.0));
    col = mix(col, uCoreColor, clamp(pow(rayIntensity, 2.2) * 0.7 + coreGlow * 0.55, 0.0, 1.0));

    float finalAlpha = clamp((rayIntensity + coreGlow) * uOpacity, 0.0, 1.0);

    if (finalAlpha < 0.001) discard;

    gl_FragColor = vec4(col * (rayIntensity + coreGlow * 0.8), finalAlpha);
  }
`;

const GodRays: React.FC<GodRaysProps> = (props) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Leva controls
  const controls = useControls("God Rays", {
    Transform: folder({
      positionX: {
        value: props.position?.[0] ?? 0.8,
        min: -10,
        max: 10,
        step: 0.1,
      },
      positionY: {
        value: props.position?.[1] ?? 0.6,
        min: -10,
        max: 10,
        step: 0.1,
      },
      positionZ: {
        value: props.position?.[2] ?? -2.2,
        min: -10,
        max: 10,
        step: 0.1,
      },
      sizeWidth: { value: props.size?.[0] ?? 9, min: 1, max: 25, step: 0.5 },
      sizeHeight: { value: props.size?.[1] ?? 6.5, min: 1, max: 25, step: 0.5 },
      rotationZ: {
        value: props.rotation?.[2] ?? 0,
        min: -180,
        max: 180,
        step: 1,
      },
    }),
    Colors: folder({
      rayColor: { value: props.rayColor ?? "#bf82fd" },
      glowColor: { value: props.glowColor ?? "#cf95ff" },
      coreColor: { value: props.coreColor ?? "#ecc3ff" },
      opacity: { value: props.opacity ?? 0.95, min: 0, max: 1, step: 0.01 },
      blendMode: {
        value: props.blendMode ?? "Additive",
        options: ["Additive", "Normal"],
      },
    }),
    Rays: folder({
      intensity: { value: props.intensity ?? 4.2, min: 0, max: 10, step: 0.1 },
      speed: { value: props.speed ?? 0.83, min: 0, max: 3, step: 0.01 },
      rayCount: { value: props.rayCount ?? 5, min: 2, max: 40, step: 1 },
      decay: { value: props.decay ?? 1.95, min: 0.1, max: 5, step: 0.05 },
      density: { value: props.density ?? 0.05, min: 0.1, max: 4, step: 0.1 },
      originX: { value: props.originX ?? 1.0, min: 0, max: 1.5, step: 0.01 },
      originY: { value: props.originY ?? 1.08, min: 0, max: 1.5, step: 0.01 },
      coneAngle: { value: props.coneAngle ?? 228, min: 0, max: 360, step: 1 },
      coneWidth: { value: props.coneWidth ?? 145, min: 10, max: 180, step: 1 },
      noiseScale: {
        value: props.noiseScale ?? 6.2,
        min: 0.5,
        max: 15,
        step: 0.1,
      },
      noiseStrength: {
        value: props.noiseStrength ?? 0.85,
        min: 0,
        max: 2,
        step: 0.05,
      },
    }),
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOrigin: { value: new THREE.Vector2(controls.originX, controls.originY) },
      uRayColor: { value: new THREE.Color(controls.rayColor) },
      uGlowColor: { value: new THREE.Color(controls.glowColor) },
      uCoreColor: { value: new THREE.Color(controls.coreColor) },
      uIntensity: { value: 0 },
      uSpeed: { value: controls.speed },
      uRayCount: { value: controls.rayCount },
      uDecay: { value: controls.decay },
      uDensity: { value: controls.density },
      uNoiseScale: { value: controls.noiseScale },
      uNoiseStrength: { value: controls.noiseStrength },
      uConeAngle: { value: controls.coneAngle },
      uConeWidth: { value: controls.coneWidth },
      uOpacity: { value: controls.opacity },
    }),
    [],
  );

  // GSAP animation: animate intensity from 0 to target intensity (default 4.2)
  useEffect(() => {
    if (!matRef.current) return;
    const tween = gsap.fromTo(
      matRef.current.uniforms.uIntensity,
      { value: 0 },
      {
        value: controls.intensity,
        duration: 2,
        delay: 0.8,
        ease: "power2.out",
      },
    );
    return () => {
      tween.kill();
    };
  }, []);

  // Update intensity dynamically if adjusted via Leva controls after mount
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (matRef.current) {
      matRef.current.uniforms.uIntensity.value = controls.intensity;
    }
  }, [controls.intensity]);

  useFrame((state) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value = state.clock.getElapsedTime();
    u.uOrigin.value.set(controls.originX, controls.originY);
    u.uRayColor.value.set(controls.rayColor);
    u.uGlowColor.value.set(controls.glowColor);
    u.uCoreColor.value.set(controls.coreColor);
    u.uSpeed.value = controls.speed;
    u.uRayCount.value = controls.rayCount;
    u.uDecay.value = controls.decay;
    u.uDensity.value = controls.density;
    u.uNoiseScale.value = controls.noiseScale;
    u.uNoiseStrength.value = controls.noiseStrength;
    u.uConeAngle.value = controls.coneAngle;
    u.uConeWidth.value = controls.coneWidth;
    u.uOpacity.value = controls.opacity;
  });

  const blendingMode =
    controls.blendMode === "Additive"
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;

  return (
    <mesh
      ref={meshRef}
      position={[controls.positionX, controls.positionY, controls.positionZ]}
      rotation={[0, 0, THREE.MathUtils.degToRad(controls.rotationZ)]}
    >
      <planeGeometry args={[controls.sizeWidth, controls.sizeHeight]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={blendingMode}
      />
    </mesh>
  );
};

export default GodRays;
