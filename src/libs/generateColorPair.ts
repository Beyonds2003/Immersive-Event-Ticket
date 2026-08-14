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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Hand-curated analogous pairs that blend beautifully through a texture.
 *
 * Rules:
 * - Hues are close (20-50 apart) so the mid-mix never goes muddy
 * - No dark anchors: no deep green (90-150), no dark blue (210-260),
 *   no dark violet (260-290)
 * - All pairs feel watery / stylized / light
 *
 * Format: [hueA, hueB] in degrees
 */
const COLOR_PAIRS: [number, number][] = [
  [355, 20], // blush -> peach
  [20, 45], // peach -> warm yellow
  [330, 355], // bubblegum pink -> blush
  [300, 330], // soft lilac -> bubblegum pink
  [170, 195], // mint -> sky cyan
  [185, 210], // sky cyan -> ice blue
  [210, 240], // ice blue -> periwinkle (both stay light)
  [0, 330], // coral -> pink
  [45, 20], // yellow -> peach
  [195, 170], // sky -> mint
  [240, 270], // periwinkle -> soft violet (light versions)
  [270, 300], // soft violet -> lilac
  [10, 340], // warm coral -> rose
  [340, 310], // rose -> orchid
];

/**
 * Generates a harmonious, watery-stylized color pair for sphere materials.
 *
 * Both colors are analogous (close hues) so mixing them through a
 * diffuse texture always produces a smooth, natural blend — never muddy.
 *
 * Palette feel: candy mint, soft coral, icy periwinkle, blush pink,
 * warm peach, dreamy lilac — bright and airy, never dark.
 */
export function generateColorPair(text: string, vibrant = 0.8, seed = 0) {
  const rand = random(hashString(text) ^ Math.imul(seed + 1, 2654435761));

  // Pick a curated pair
  const pair = COLOR_PAIRS[Math.floor(rand() * COLOR_PAIRS.length)];

  // Small organic variation (+-12 deg) so same-pair spheres still differ
  const hue1 = (pair[0] + (rand() - 0.5) * 24 + 360) % 360;
  const hue2 = (pair[1] + (rand() - 0.5) * 24 + 360) % 360;

  /**
   * Saturation: 75-90 %
   *
   * High enough to look vivid and stylized.
   * Not at 100 % to keep it feeling soft/watery rather than neon.
   */
  const saturation1 = clamp(75 + vibrant * 15 + rand() * 5, 75, 90);
  const saturation2 = clamp(saturation1 + (rand() - 0.5) * 10, 72, 90);

  /**
   * Lightness: 60-70 %
   *
   * Bright and airy without washing out.
   * The shader saturateColor() pushes it the rest of the way.
   */
  const lightness1 = clamp(63 + vibrant * 5 + (rand() - 0.5) * 6, 60, 70);
  const lightness2 = clamp(lightness1 + (rand() - 0.5) * 6, 60, 70);

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
