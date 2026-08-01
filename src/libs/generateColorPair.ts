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
 * Dreamy iridescent palette hues — biased toward pinks, mints, lilacs, lavenders.
 * These 8 anchor hues match the soft pearlescent tones seen in the reference image.
 */
const DREAMY_HUES = [
  310, // hot pink / magenta
  330, // rose pink
  280, // soft violet
  260, // lavender / purple
  240, // periwinkle blue
  170, // mint / seafoam green
  150, // soft green
  195, // teal
];

/**
 * Calculates lightness driven by `vibrant`:
 *   vibrant=0 → ~70% (soft pastel)
 *   vibrant=1 → ~55% (rich, punchy)
 * Perceptual hue luminance and a slight A/B contrast are applied on top.
 */
function getDreamyLightness(
  hueDeg: number,
  isSecondary: boolean,
  randVal: number,
  vibrant: number,
): number {
  const rad = (hueDeg * Math.PI) / 180;
  // Perceptual innate luminance — yellows sit higher, blues lower
  const innateLuminance = Math.cos(rad - (60 * Math.PI) / 180);

  // Slide from 70% (pastel) down to 55% (vivid) as vibrant goes 0→1
  let lightness = 70 - vibrant * 15 - innateLuminance * 4;

  // Slight contrast between Color A and Color B
  if (isSecondary) {
    lightness += 2 + (randVal - 0.5) * 5;
  } else {
    lightness -= 2 + (randVal - 0.5) * 5;
  }

  return Math.min(74, Math.max(52, lightness));
}

/**
 * Generates two soft, dreamy, iridescent color pairs — pinks, mints, lilacs, lavenders.
 *
 * Algorithm:
 * 1. Base hue is picked from a curated dreamy palette (pinks/purples/mints/teals)
 *    with slight procedural jitter for variety.
 * 2. Second hue uses an analogous / split-complementary offset (30°–90°) so the
 *    pair feels harmonious and pearlescent rather than starkly contrasted.
 * 3. Saturation is moderate (55%–85%) — vivid but soft, never neon.
 * 4. Lightness is raised to 60%–76% for a luminous, iridescent, pastel-vivid feel.
 *
 * @param text Hash input text
 * @param vibrant Saturation & vividness multiplier (0 = very soft pastel, 1 = full dreamy vivid)
 * @param seed Seed offset for procedural variation
 */
export function generateColorPair(text: string, vibrant = 1.0, seed = 0) {
  const rand = random(hashString(text) ^ Math.imul(seed + 1, 2654435761));

  // 1. Pick a base hue from the dreamy palette with slight jitter (±15°)
  const anchorIndex = Math.floor(rand() * DREAMY_HUES.length);
  const hue1 = (DREAMY_HUES[anchorIndex] + (rand() - 0.5) * 30 + 360) % 360;

  // 2. Second hue: analogous offset (30°–90°) — same colour family, harmonious pairing
  const offsetSign = rand() < 0.5 ? 1 : -1;
  const offsetMagnitude = 30 + rand() * 60;
  const hue2 = (hue1 + offsetSign * offsetMagnitude + 360) % 360;

  // 3. Saturation fully driven by vibrant: 0 → ~35% (soft pastel), 1 → ~95% (vivid pop)
  const sat1 = Math.min(100, Math.max(20, 35 + vibrant * 60 + (rand() - 0.5) * 10));
  const sat2 = Math.min(100, Math.max(20, 35 + vibrant * 60 + (rand() - 0.5) * 10));

  // 4. Lightness also driven by vibrant (70% pastel → 55% vivid)
  const lightness1 = getDreamyLightness(hue1, false, rand(), vibrant);
  const lightness2 = getDreamyLightness(hue2, true, rand(), vibrant);

  const colorA = new THREE.Color().setHSL(
    hue1 / 360,
    sat1 / 100,
    lightness1 / 100,
  );

  const colorB = new THREE.Color().setHSL(
    hue2 / 360,
    sat2 / 100,
    lightness2 / 100,
  );

  return [colorA, colorB] as const;
}
