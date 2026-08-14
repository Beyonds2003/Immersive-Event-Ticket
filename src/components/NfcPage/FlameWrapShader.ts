import * as THREE from "three";

export interface FlameWrapOptions {
  /** Flame color as [r, g, b] in 0-1 range. */
  color?: [number, number, number];
  /** Overall brightness of the fire (0 to 3). */
  intensity?: number;
  /** Reach of the flames above the top edge in CSS pixels. */
  height?: number;
  /** Reach of the glow on the sides and bottom in CSS pixels. */
  spread?: number;
  /** Corner radius of the burning outline in CSS pixels. Match your content. */
  radius?: number;
  /** Animation speed multiplier for the whole effect. */
  speed?: number;
  /** Flame detail from 0 (broad licks) to 1 (fine licks). */
  scale?: number;
  /** Amplitude of the turbulence waves shaping the flames (0 to 1). */
  turbulence?: number;
  /** Frequency multiplier of the turbulence waves (0.2 to 3). */
  turbulenceScale?: number;
  /** How far from the edges the heat warps the content, in CSS pixels. */
  turbulenceReach?: number;
  /** Brightness of the spark highlights (0 to 3). 0 disables them. */
  sparks?: number;
  /** Size multiplier for individual sparks (0.2 to 3). */
  sparkSize?: number;
  /** How many sparks fly at once (0.3 to 2.5). */
  sparkDensity?: number;
  /** How fast sparks rise and flicker (0.1 to 3). */
  sparkSpeed?: number;
  /** Strength of the molten glow hugging the edges (0 to 3). */
  rim?: number;
  /** How far the flames eat into the content silhouette in CSS pixels. */
  melt?: number;
  /** Heat shimmer displacement of the content near the edges in CSS pixels. */
  distortion?: number;
  /** Amount of smoke drifting off the flames (0 to 2). */
  smoke?: number;
  /** Brightness of the glowing ember line on the burnt edges (0 to 2). */
  ember?: number;
  /** Darkness of the charred band on the content edges (0 to 2). */
  scorch?: number;
}

export interface FlameWrapElements {
  /** Canvas with layoutsubtree that hosts the HTML content. */
  source: HTMLCanvasElement;
  /** The element inside the source canvas that gets captured. */
  content: HTMLElement;
  /** Canvas the WebGL effect renders to. */
  output: HTMLCanvasElement;
}

export interface FlameWrapInstance {
  /** Update effect options live. */
  setOptions: (options: FlameWrapOptions) => void;
  /** Re-read canvas size. Call when the element is resized. */
  resize: () => void;
  /** Stop the loop and release all GPU resources. */
  destroy: () => void;
}

export const DEFAULTS: Required<FlameWrapOptions> = {
  color: [0.31, 0.54, 1],
  intensity: 1.5,
  height: 170,
  spread: 8,
  radius: 40,
  speed: 0.25,
  scale: 0.75,
  turbulence: 0.5,
  turbulenceScale: 0.5,
  turbulenceReach: 25,
  sparks: 1.5,
  sparkSize: 0.5,
  sparkDensity: 1,
  sparkSpeed: 1,
  rim: 2.5,
  melt: 4.5,
  distortion: 4,
  smoke: 1.5,
  ember: 2,
  scorch: 0,
};

export type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

export type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

export const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uRectCenter;
uniform vec2 uRectHalf;
uniform float uCorner;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uHeight;
uniform float uSpread;
uniform float uScale;
uniform float uTurbulence;
uniform float uTurbScale;
uniform float uTurbReach;
uniform float uSparks;
uniform float uSparkSize;
uniform float uSparkDensity;
uniform float uSparkSpeed;
uniform float uRim;
uniform float uMelt;
uniform float uDistortion;
uniform float uSmoke;
uniform float uEmber;
uniform float uScorch;
uniform float uHasContent;
uniform float uOpacity;

#define S(a, b, t) smoothstep(a, b, t)

vec3 permute (vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise (vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
    0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
    0.0
  );
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm (vec2 p) {
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  float v = 0.5 * snoise(p);
  p = m * p * 2.03 + vec2(11.3, 7.1);
  v += 0.27 * snoise(p);
  p = m * p * 1.97 + vec2(3.7, 19.1);
  v += 0.15 * snoise(p);
  p = m * p * 2.01 + vec2(8.3, 2.9);
  v += 0.08 * snoise(p);
  return v * 0.5 + 0.5;
}

float fbm2 (vec2 p) {
  float v = 0.62 * snoise(p);
  v += 0.31 * snoise(mat2(0.8, -0.6, 0.6, 0.8) * p * 2.13 + vec2(5.2, 1.3));
  return v * 0.54 + 0.5;
}

vec2 turbulence (vec2 p) {
  float freq = 12.0 * clamp(uScale, 0.05, 1.0) * clamp(uTurbScale, 0.2, 3.0);
  mat2 rot = mat2(0.6, -0.8, 0.8, 0.6);
  for (float i = 0.0; i < 7.0; i++) {
    float phase = freq * (p * rot).y + 6.0 * uTime + i;
    p += uTurbulence * rot[0] * sin(phase) / freq;
    rot *= mat2(0.6, -0.8, 0.8, 0.6);
    freq *= 1.2;
  }
  return p;
}

vec3 hash3 (vec2 p) {
  vec3 q = vec3(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3)),
    dot(p, vec2(419.2, 371.9))
  );
  return fract(sin(q) * 43758.5453);
}

float sdRoundRect (vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main () {
  vec2 frag = vUv * uResolution;
  vec2 rel = frag - uRectCenter;
  float unit = max(uHeight, 24.0);
  float corner = min(uCorner, min(uRectHalf.x, uRectHalf.y));
  float spreadPx = max(uSpread, 8.0);
  float t = uTime;
  float detail = clamp(uScale, 0.05, 1.0);

  float d0 = sdRoundRect(rel, uRectHalf, corner);
  float px = rel.x / unit;
  float py = rel.y / unit;

  float yA = max(rel.y - uRectHalf.y, 0.0) / unit;
  float sway = snoise(vec2(px * 1.1, t * 0.5)) * 0.55
    + snoise(vec2(px * 2.4, t * 0.9 + 41.0)) * 0.25;
  float sx = px + yA * sway;
  float env = fbm2(vec2(sx * 1.6 * detail + 3.7, t * 0.55 - yA * 0.4));
  float env2 = fbm2(vec2(sx * 3.6 * detail, t * 0.85 + 17.0 - yA * 0.6));
  float tongue = clamp(
    0.75 * S(0.3, 0.9, env) + 0.5 * S(0.4, 0.95, env2),
    0.0,
    1.0
  );

  float meltPx = max(uMelt, 1.0);
  float biteTop = (3.0 + meltPx * 1.4) * (0.35 + 0.65 * tongue)
    + 2.0 * snoise(vec2(px * 5.0 * detail, t * 1.1 + 5.0));
  float yF = uRectHalf.y - biteTop;
  float frontTop = rel.y - yF;

  float perim = fbm2(rel * (1.9 / unit) * detail + vec2(0.0, t * 0.4) + 31.0);
  float biteSB = 3.0 + meltPx * (0.25 + 0.75 * perim);
  float frontSB = d0 + biteSB;

  float wTop = S(-0.62 * unit, -0.1 * unit, rel.y - uRectHalf.y)
    * S(10.0, -30.0, abs(rel.x) - (uRectHalf.x - corner));
  float front = mix(frontSB, frontTop, wTop);

  float reach = mix(
    spreadPx * 0.9,
    unit * (0.2 + 0.45 * tongue),
    wTop
  );
  float q = front / reach;

  vec2 np = vec2(px * 2.3, py * 1.25 - t * 1.85) * detail;
  np = turbulence(np);
  float n = fbm(np);

  float win = S(-0.08, 0.02, q);
  float root = exp(-abs(q) * 5.0);
  float ridge = 1.0 - abs(2.0 * n - 1.0);
  float flameH = mix(1.0, 0.5 + 0.6 * tongue, wTop);
  float g = max(q, 0.0) / flameH;
  float shred = fbm2(np * 1.9 + 63.0);
  g *= 1.0 + 0.7 * (shred - 0.5) * S(0.2, 0.8, g);
  float dens = n * 0.95 + ridge * 0.45 - 0.18
    + (1.0 - min(g, 1.0)) * 0.3
    - g * (0.9 + 0.25 * n);
  dens = clamp(dens * 2.4, 0.0, 1.0) * win;
  dens *= mix(1.0 - S(0.32, 1.05, q), 1.0 - S(0.9, 1.2, g), wTop);
  float body = dens * dens * (3.0 - 2.0 * dens);
  float emis = clamp(uIntensity, 0.0, 2.0);
  float e = body * (0.55 + 0.75 * root) * (0.45 + 0.55 * n)
    + win * root * (0.1 + 0.4 * n);
  e *= mix(0.45, 1.0, wTop) * max(emis, 0.001);

  vec3 hot = mix(uColor, vec3(1.0), 0.35);
  vec3 deep = mix(uColor, uColor * uColor, 0.5) * 0.9;
  float ramp = 1.0 - exp(-e * 2.4);
  vec3 fireCol = mix(deep, uColor, S(0.0, 0.55, ramp));
  float core = ramp * (0.45 + 0.55 * exp(-g * 2.2)) * (0.5 + 0.5 * n);
  fireCol = mix(fireCol, hot, S(0.7, 1.05, core));
  fireCol *= 0.8 + 0.4 * ramp;
  float fireA = clamp(1.0 - exp(-e * 3.4), 0.0, 1.0);

  float halo = exp(-max(front, 0.0) / (spreadPx * 1.2)) * S(0.0, 3.0, front)
    * (0.5 + 0.5 * n) * 0.3 * clamp(uRim, 0.0, 2.0) * mix(1.0, 0.45, wTop);
  vec3 glow = uColor * halo * clamp(uIntensity, 0.0, 2.0);

  if (uSparks > 0.001) {
    float sSpeed = max(uSparkSpeed, 0.05);
    float sCells = 5.0 * clamp(uSparkDensity, 0.3, 2.5);
    float sSize = clamp(uSparkSize, 0.2, 3.0);
    float gate = S(-0.05, 0.1, q) * (1.0 - S(1.3, 2.2, q)) * wTop;
    float spark = 0.0;
    for (float L = 0.0; L < 2.0; L++) {
      float speed = 1.5 * sSpeed * (0.75 + 0.5 * L);
      vec2 ps = vec2(px, py - t * speed);
      ps.x += 0.08 * snoise(vec2(py * 0.9 + L * 5.0, t * 0.5));
      float cells = sCells * (1.0 + 0.6 * L);
      vec2 cl = floor(ps * cells) + L * 19.0;
      vec2 fr = fract(ps * cells);
      vec3 rnd = hash3(cl);
      vec3 rnd2 = hash3(cl + 7.3);
      float on = step(rnd2.x, 0.42);
      float life = fract(rnd.z + t * sSpeed * (0.3 + 0.5 * rnd2.x));
      vec2 ppos = vec2(0.5) + 0.56 * (rnd.xy - 0.5);
      ppos.x += 0.14 * sin(t * (0.7 + rnd.z * 2.8) + rnd.y * 6.2832)
        + 0.1 * snoise(vec2(t * 0.6 + rnd.x * 9.0, cl.y * 0.7))
        + (life - 0.5) * 0.5 * (rnd2.y - 0.5);
      ppos.y += (life - 0.5) * 0.3 * rnd2.y;
      float tw = S(0.02, 0.2, life) * S(1.0, 0.55, life);
      tw *= 0.75 + 0.25 * sin(t * (6.0 + rnd2.z * 9.0) + rnd.x * 6.2832);
      vec2 pd = (fr - ppos) / cells * unit;
      pd.y *= 0.55 + 0.3 * rnd2.z;
      float dp = length(pd);
      float r = (0.004 + 0.014 * rnd.y * rnd.y) * unit * sSize
        * mix(1.15, 0.55, life);
      float bmask = S(0.5, 0.32, max(abs(fr.x - 0.5), abs(fr.y - 0.5)));
      float sbody = exp(-dp * dp / (r * r));
      float sbloom = exp(-dp * dp / (r * r * 6.0)) * 0.3;
      spark += (sbody + sbloom) * tw * tw * on * bmask * (1.0 - 0.35 * L);
    }
    spark *= gate * uSparks;
    fireCol += mix(uColor, vec3(1.0), 0.55) * spark * 1.6;
    fireA = clamp(fireA + spark * 0.85, 0.0, 1.0);
  }

  vec2 edgePx = min(frag, uResolution - frag);
  float fadeW = max(24.0, spreadPx * 0.75);
  float fade = S(0.0, fadeW, edgePx.x) * S(0.0, fadeW, edgePx.y);
  fireA *= fade;
  glow *= fade;
  halo *= fade;

  float wisp = S(0.45, 0.9, fbm2(np * 0.55 + vec2(0.0, 17.0)));
  float smoke = S(1.55, 1.05, g) * S(0.85, 1.15, g)
    * (1.0 - body) * wTop
    * wisp * 0.055 * clamp(uSmoke, 0.0, 2.0) * fade;
  vec3 smokeCol = mix(vec3(0.5), uColor, 0.5);

  if (uHasContent < 0.5) {
    float sA = clamp(smoke, 0.0, 1.0);
    float a = clamp(fireA + sA * (1.0 - fireA), 0.0, 1.0);
    outColor = vec4(
      fireCol * fireA + glow + smokeCol * sA * (1.0 - fireA),
      clamp(a + halo * 0.6, 0.0, 1.0) * uOpacity
    );
    return;
  }

  vec2 cUv = (rel + uRectHalf) / (2.0 * uRectHalf);
  float inRect = step(abs(cUv.x - 0.5), 0.5) * step(abs(cUv.y - 0.5), 0.5);

  float heatBand = exp(-abs(front) / max(uTurbReach, 4.0));
  vec2 wob = vec2(
    snoise(np * 1.7 + 9.0),
    snoise(np * 1.7 + 27.0)
  );
  vec2 disp = wob * min(uDistortion, 32.0) * heatBand;
  vec2 cUvD = clamp(cUv + disp / (2.0 * uRectHalf), vec2(0.002), vec2(0.998));
  vec4 content = texture(uContent, vec2(cUvD.x, 1.0 - cUvD.y));

  float burn = clamp(uIntensity, 0.0, 1.0);
  float depth = max(-front, 0.0);
  float charPatch = 0.5 + 0.5 * fbm2(rel * (2.6 / unit) * detail + 57.0);
  float charW = mix(4.0, 6.0 + meltPx * 1.6, wTop) * charPatch;
  float charT = (1.0 - S(charW, charW * 2.4, depth));
  content.rgb = mix(
    content.rgb,
    content.rgb * vec3(0.22, 0.19, 0.17),
    clamp(charT * 0.85 * burn * clamp(uScorch, 0.0, 2.0), 0.0, 1.0)
  );

  float emberW = mix(2.5, 5.5, wTop);
  float emberN = 0.3 + 0.7 * fbm2(np * 2.2 + 73.0);
  float emberK = clamp(uEmber, 0.0, 2.0);
  float ember = exp(-depth / emberW) * emberN * emberK;
  float whiteHot = exp(-depth / (emberW * 0.4)) * emberN * emberN * emberK;
  content.rgb = mix(content.rgb, uColor * 1.2, clamp(ember, 0.0, 1.0) * burn);
  content.rgb = mix(
    content.rgb,
    mix(uColor, vec3(1.0), 0.3) * 1.2,
    clamp(whiteHot, 0.0, 1.0) * burn
  );

  float dn = fbm2(rel * (3.2 / unit) * detail + vec2(0.0, t * 0.5) + 91.0);
  float dw = mix(2.0, 5.0, wTop);
  float dissolve = S(-dw, dw, front + (dn - 0.5) * dw * 2.5);
  float cA = content.a * (1.0 - dissolve) * inRect;
  float smk = smoke * (1.0 - cA);
  float baseA = min(cA + smk, 1.0);
  vec3 base = content.rgb * cA + smokeCol * smk;
  vec3 col = fireCol * fireA + base * (1.0 - fireA) + glow;
  float alpha = clamp(fireA + baseA * (1.0 - fireA) + halo * 0.5, 0.0, 1.0);
  outColor = vec4(col, alpha * uOpacity);
}`;

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

/** Prepares Three.js compatible GLSL3 fragment code from raw FRAG string */
function getThreeFragmentShader(rawFrag: string): string {
  // Remove version/precision lines so Three.js GLSL3 header applies cleanly
  return rawFrag
    .replace("#version 300 es", "")
    .replace("precision highp float;", "");
}

/** Prepares Three.js compatible GLSL3 vertex code */
const THREE_VERT = `
out vec2 vUv;
void main () {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function createFlameWrapMaterial(
  texture?: THREE.Texture | null,
  options?: FlameWrapOptions,
): THREE.ShaderMaterial {
  const opts = { ...DEFAULTS, ...options };
  const initialColor = new THREE.Color(
    opts.color[0],
    opts.color[1],
    opts.color[2],
  );

  const uniforms = {
    uContent: { value: texture ?? null },
    uResolution: { value: new THREE.Vector2(1000, 700) },
    uTime: { value: 0 },
    uRectCenter: { value: new THREE.Vector2(500, 320) },
    uRectHalf: { value: new THREE.Vector2(360, 202.5) },
    uCorner: { value: opts.radius },
    uColor: { value: initialColor },
    uIntensity: { value: opts.intensity },
    uHeight: { value: opts.height },
    uSpread: { value: opts.spread },
    uScale: { value: opts.scale },
    uTurbulence: { value: opts.turbulence },
    uTurbScale: { value: opts.turbulenceScale },
    uTurbReach: { value: opts.turbulenceReach },
    uSparks: { value: opts.sparks },
    uSparkSize: { value: opts.sparkSize },
    uSparkDensity: { value: opts.sparkDensity },
    uSparkSpeed: { value: opts.sparkSpeed },
    uRim: { value: opts.rim },
    uMelt: { value: opts.melt },
    uDistortion: { value: opts.distortion },
    uSmoke: { value: opts.smoke },
    uEmber: { value: opts.ember },
    uScorch: { value: opts.scorch },
    uHasContent: { value: texture ? 1.0 : 0.0 },
    uOpacity: { value: 1.0 },
  };

  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: THREE_VERT,
    fragmentShader: getThreeFragmentShader(FRAG),
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
