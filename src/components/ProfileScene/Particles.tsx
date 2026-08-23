import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";

export interface ParticlesProps {
  count?: number;
  size?: number;
  speed?: number;
  minY?: number;
  maxY?: number;
  spreadBottom?: number;
  spreadTop?: number;
  spreadPower?: number;
  noiseStrength?: number;
  noiseFreq?: number;
  opacity?: number;
  baseRadius?: number;
}

// ── GLSL 3D Simplex Noise Definition ──────────────────────────────────────────
const noiseGLSL = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); // mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalize gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// ── Vertex Shader ────────────────────────────────────────────────────────────
const vertexShader = `
${noiseGLSL}

uniform float uTime;
uniform float uSpeed;
uniform float uSize;
uniform float uMinY;
uniform float uMaxY;
uniform float uSpreadBottom;
uniform float uSpreadTop;
uniform float uSpreadPower;
uniform float uNoiseStrength;
uniform float uNoiseFreq;
uniform float uPixelRatio;

attribute vec3 aBasePosition;
attribute float aOffset;
attribute float aSpeed;
attribute float aScale;
attribute vec3 aColor;
attribute float aNoiseOffset;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;

  // Normalized progress from 0.0 (bottom spawn) to 1.0 (top exit)
  float progress = mod(uTime * uSpeed * aSpeed * aNoiseOffset * 0.025  + aOffset, 0.8 + (0.2 * aNoiseOffset * 0.01));

  // Height interpolation from minY to maxY
  float currentY = mix(uMinY, uMaxY, progress);

  // Vertical progress uv.y for horizontal spread expansion
  // Spread scales from offset (0.3) at bottom to wide spread (1.0+) at top
  float uvY = progress;
  float spreadFactor = mix(uSpreadBottom, uSpreadTop, pow(uvY, uSpreadPower));

  // Base position with outward spreading
  vec3 pos = vec3(aBasePosition.x * spreadFactor, currentY, aBasePosition.z * spreadFactor);

  // 3D Simplex noise displacement for natural floating effect
  vec3 noiseCoord = vec3(
    pos.x * uNoiseFreq,
    (pos.y + uTime * 0.25) * uNoiseFreq,
    pos.z * uNoiseFreq + aNoiseOffset
  );

  float nX = snoise(noiseCoord);
  float nY = snoise(noiseCoord + vec3(31.41, 15.92, 65.35));
  float nZ = snoise(noiseCoord + vec3(89.79, 32.38, 46.26));

  pos.x += nX * uNoiseStrength * spreadFactor;
  pos.y += nY * (uNoiseStrength * 0.35);
  pos.z += nZ * uNoiseStrength * spreadFactor;

  // Smooth fade-in at bottom and fade-out at top
  float fadeIn = smoothstep(0.0, 0.18, progress);
  float fadeOut = 1.0 - smoothstep(0.55, 1.0, progress);
  vAlpha = fadeIn * fadeOut ;

  // View space transformation
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Point size with perspective depth attenuation and fade scaling
  float dynamicScale = aScale * (0.8 + 0.3 * vAlpha);
  gl_PointSize = (uSize * dynamicScale) * (300.0 / -mvPosition.z) * (uPixelRatio / 2.0);
}
`;

// ── Fragment Shader ──────────────────────────────────────────────────────────
const fragmentShader = `
uniform float uOpacity;
uniform float uGlow;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Center point coordinates (-0.5 to 0.5)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Circular shape with smooth anti-aliased edge
  float circleAlpha = smoothstep(0.5, 0.38, dist);
  if (circleAlpha <= 0.0) {
    discard;
  }

  // Inner core glow & vibrancy
  float coreGlow = exp(-dist * 3.2) * uGlow;
  vec3 finalColor = vColor + vec3(coreGlow * 0.5);

  gl_FragColor = vec4(finalColor, vAlpha * circleAlpha * uOpacity);
}
`;

// ── Colorful Palette Generator ───────────────────────────────────────────────
const COLOR_PALETTE = [
  new THREE.Color("#00f0ff"), // Bright Cyan
  new THREE.Color("#ff2a85"), // Electric Pink
  new THREE.Color("#7b2cbf"), // Deep Violet
  new THREE.Color("#9d4edd"), // Vibrant Purple
  new THREE.Color("#ff9e00"), // Warm Gold / Orange
  new THREE.Color("#06d6a0"), // Neon Emerald
  new THREE.Color("#4cc9f0"), // Sky Neon Blue
  new THREE.Color("#f72585"), // Magenta Red
  new THREE.Color("#fee440"), // Radiant Yellow
];

export const Particles: React.FC<ParticlesProps> = (props) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Leva controls with fallback to props
  const controls = useControls("Profile Particles", {
    count: { value: props.count ?? 50, min: 50, max: 3000, step: 50 },
    size: { value: props.size ?? 0.5, min: 0, max: 120, step: 1 },
    speed: { value: props.speed ?? 0.1, min: 0.05, max: 1.5, step: 0.01 },
    spreadBottom: {
      value: props.spreadBottom ?? 0.75,
      min: 0.0,
      max: 2.0,
      step: 0.05,
    },
    spreadTop: {
      value: props.spreadTop ?? 2.85,
      min: 0.3,
      max: 4.0,
      step: 0.05,
    },
    spreadPower: {
      value: props.spreadPower ?? 0.5,
      min: 0.5,
      max: 3.0,
      step: 0.1,
    },
    noiseStrength: {
      value: props.noiseStrength ?? 0.6,
      min: 0.0,
      max: 2.0,
      step: 0.01,
    },
    noiseFreq: {
      value: props.noiseFreq ?? 0.25,
      min: 0.1,
      max: 3.0,
      step: 0.05,
    },
    minY: { value: props.minY ?? -2.1, min: -5.0, max: 2.0, step: 0.1 },
    maxY: { value: props.maxY ?? 2.1, min: 0.0, max: 8.0, step: 0.1 },
    opacity: { value: props.opacity ?? 0.9, min: 0.0, max: 1.0, step: 0.05 },
    glow: { value: 4, min: 0.0, max: 10.0, step: 0.05 },
    baseRadius: {
      value: props.baseRadius ?? 1.6,
      min: 0.2,
      max: 5.0,
      step: 0.1,
    },
  });

  // Generate buffer geometry attributes
  const { positions, offsets, speeds, scales, colors, noiseOffsets } =
    useMemo(() => {
      const count = controls.count;
      const posArr = new Float32Array(count * 3);
      const offsetArr = new Float32Array(count);
      const speedArr = new Float32Array(count);
      const scaleArr = new Float32Array(count);
      const colorArr = new Float32Array(count * 3);
      const noiseOffsetArr = new Float32Array(count);

      const tempColor = new THREE.Color();

      for (let i = 0; i < count; i++) {
        // Base horizontal distribution in a soft disk around the stage
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * controls.baseRadius;

        posArr[i * 3 + 0] = Math.cos(angle) * radius;
        posArr[i * 3 + 1] = 0; // vertical position is calculated dynamically in shader
        posArr[i * 3 + 2] = Math.sin(angle) * radius;

        // Random starting phase & individual speed variance
        offsetArr[i] = Math.random();
        speedArr[i] = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x variation
        scaleArr[i] = 0.5 + Math.random() * 0.9; // Scale variation

        // Pick vibrant colorful palette color with subtle random tint
        const baseCol =
          COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
        tempColor.copy(baseCol);
        tempColor.offsetHSL(
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
        );

        colorArr[i * 3 + 0] = tempColor.r;
        colorArr[i * 3 + 1] = tempColor.g;
        colorArr[i * 3 + 2] = tempColor.b;

        noiseOffsetArr[i] = Math.random() * 100.0;
      }

      return {
        positions: posArr,
        offsets: offsetArr,
        speeds: speedArr,
        scales: scaleArr,
        colors: colorArr,
        noiseOffsets: noiseOffsetArr,
      };
    }, [controls.count, controls.baseRadius]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: controls.speed },
      uSize: { value: controls.size },
      uMinY: { value: controls.minY },
      uMaxY: { value: controls.maxY },
      uSpreadBottom: { value: controls.spreadBottom },
      uSpreadTop: { value: controls.spreadTop },
      uSpreadPower: { value: controls.spreadPower },
      uNoiseStrength: { value: controls.noiseStrength },
      uNoiseFreq: { value: controls.noiseFreq },
      uOpacity: { value: controls.opacity },
      uGlow: { value: controls.glow },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1,
      },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
      matRef.current.uniforms.uSpeed.value = controls.speed;
      matRef.current.uniforms.uSize.value = controls.size;
      matRef.current.uniforms.uMinY.value = controls.minY;
      matRef.current.uniforms.uMaxY.value = controls.maxY;
      matRef.current.uniforms.uSpreadBottom.value = controls.spreadBottom;
      matRef.current.uniforms.uSpreadTop.value = controls.spreadTop;
      matRef.current.uniforms.uSpreadPower.value = controls.spreadPower;
      matRef.current.uniforms.uNoiseStrength.value = controls.noiseStrength;
      matRef.current.uniforms.uNoiseFreq.value = controls.noiseFreq;
      matRef.current.uniforms.uOpacity.value = controls.opacity;
      matRef.current.uniforms.uGlow.value = controls.glow;
    }
  });

  return (
    <points key={`particles-${controls.count}`} position-z={-4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute
          attach="attributes-aBasePosition"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute
          attach="attributes-aNoiseOffset"
          args={[noiseOffsets, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Particles;
