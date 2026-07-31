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
 * Generates two visually harmonious, vibrant colors from a text string.
 *
 * The two colors are chosen using a split-analogous strategy:
 * - A base hue is derived from the text hash.
 * - The second hue is offset by 60–120° so the pair feels distinct but harmonious.
 * - `vibrant` (0–1) controls saturation and brightness:
 *     0 = muted/pastel, 1 = fully saturated & bright (like the balls in the image).
 */
export function generateColorPair(text: string, vibrant = 0.8, seed = 0) {
  // Mix the seed into the hash so each seed value yields a completely different palette.
  const rand = random(hashString(text) ^ Math.imul(seed + 1, 2654435761));

  // Base hue, fully random per text
  const hue1 = rand() * 360;

  // Second hue is offset 60–130°, direction randomly chosen.
  // This gives analogous-to-split-complementary feel — always harmonious but distinct.
  const offsetMagnitude = 60 + rand() * 70; // 60°–130°
  const offsetSign = rand() < 0.5 ? 1 : -1;
  const hue2 = (hue1 + offsetSign * offsetMagnitude + 360) % 360;

  // Saturation: vibrant=0 → ~55%, vibrant=1 → ~100%
  const saturation = 55 + vibrant * 45;

  // Lightness: vibrant=0 → pastel (65–75%), vibrant=1 → vivid (48–58%)
  // Higher vibrant = slightly darker so the hue pops more
  const baseLightness = 68 - vibrant * 20;
  const lightness1 = baseLightness + (rand() - 0.5) * 8;
  const lightness2 = baseLightness + (rand() - 0.5) * 8;

  const colorA = new THREE.Color().setHSL(
    hue1 / 360,
    saturation / 100,
    lightness1 / 100,
  );

  const colorB = new THREE.Color().setHSL(
    hue2 / 360,
    saturation / 100,
    lightness2 / 100,
  );

  return [colorA, colorB] as const;
}
