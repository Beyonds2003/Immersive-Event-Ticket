import * as THREE from "three";

function hashString(str: string) {
  let hash = 2166136261;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function random(seed: number) {
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);

    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * More natural material colors.
 * Avoids pure neon colors.
 */
const COLOR_ANCHORS = [
  0, // red
  25, // orange
  45, // yellow
  90, // green
  150, // turquoise
  190, // cyan
  220, // blue
  260, // violet
  300, // purple
  330, // pink
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Similar idea to previous code:
 * create a second color by shifting hue.
 */
function createHarmony(hue: number, rand: () => number) {
  const shift = (rand() < 0.5 ? -1 : 1) * (30 + rand() * 70);

  return (hue + shift + 360) % 360;
}

/**
 * Generates random material pair.
 *
 * Example:
 *
 * purple ---> mint
 * orange ---> pink
 * blue ---> violet
 *
 */
export function generateColorPair(text: string, vibrant = 0.8, seed = 0) {
  const rand = random(hashString(text) ^ Math.imul(seed + 1, 2654435761));

  // Base hue
  const base = COLOR_ANCHORS[Math.floor(rand() * COLOR_ANCHORS.length)];

  // Add organic variation
  const hue1 = (base + (rand() - 0.5) * 40 + 360) % 360;

  // Harmonized second color
  const hue2 = createHarmony(hue1, rand);

  /**
   * Saturation
   *
   * low:
   * pastel plastic
   *
   * high:
   * candy color
   */
  const saturation1 = clamp(35 + vibrant * 45 + rand() * 15, 25, 90);

  const saturation2 = clamp(saturation1 + (rand() - 0.5) * 20, 25, 90);

  /**
   * Lightness
   *
   * Keep material bright.
   */
  const lightness1 = clamp(65 - vibrant * 10 + (rand() - 0.5) * 8, 50, 75);

  const lightness2 = clamp(lightness1 + (rand() - 0.5) * 12, 50, 75);

  const colorA = new THREE.Color().setHSL(
    hue1 / 360,
    saturation1 / 100,
    lightness1 / 100,
  );

  const colorB = new THREE.Color().setHSL(
    hue2 / 360,
    saturation2 / 100,
    lightness2 / 100,
  );

  return [colorA, colorB] as const;
}
