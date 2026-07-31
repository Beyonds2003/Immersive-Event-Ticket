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
 * Calculates peak-chroma lightness (around 44%-54%) for maximum color vibrancy.
 * Avoids lightness > 56% (washed-out pastel) and lightness < 40% (muddy/dark).
 */
function getVibrantLightness(
  hueDeg: number,
  isSecondary: boolean,
  randVal: number,
): number {
  const rad = (hueDeg * Math.PI) / 180;
  // Perceptual innate luminance (yellow at 60° is naturally brighter than blue at 240°)
  const innateLuminance = Math.cos(rad - (60 * Math.PI) / 180);

  // Center around 48%-52% (the maximum saturation sweet-spot in HSL)
  let lightness = 50 - innateLuminance * 5;

  // Slight contrast shift between Color A and Color B
  if (isSecondary) {
    lightness += 3 + (randVal - 0.5) * 4;
  } else {
    lightness -= 3 + (randVal - 0.5) * 4;
  }

  return Math.min(56, Math.max(42, lightness));
}

/**
 * Generates two hyper-vibrant, neon-candy color pairs dynamically.
 *
 * Algorithm:
 * 1. Base hue is procedurally generated from string hash & seed.
 * 2. Second hue uses a complementary / split-complementary offset (130°–230°).
 * 3. Saturation is locked to peak levels (95%-100% at vibrant=1.0) for popping candy/neon tones.
 * 4. Lightness is tuned strictly around 44%-54% (the pure chroma zone) so colors never wash out.
 *
 * @param text Hash input text
 * @param vibrant Saturation & vividness multiplier (0 = soft, 1 = maximum neon pop)
 * @param seed Seed offset for procedural variation
 */
export function generateColorPair(text: string, vibrant = 1.0, seed = 0) {
  const rand = random(hashString(text) ^ Math.imul(seed + 1, 2654435761));

  // 1. Primary Hue (0° - 360°)
  const hue1 = rand() * 360;

  // 2. Secondary Hue: High-contrast complementary / split-complementary offset (130° to 230°)
  const offsetSign = rand() < 0.5 ? 1 : -1;
  const offsetMagnitude = 130 + rand() * 100;
  const hue2 = (hue1 + offsetSign * offsetMagnitude + 360) % 360;

  // 3. Peak Saturation (95% - 100% when vibrant=1.0) for ultra-popping candy/neon tones
  const sat1 = Math.min(
    100,
    Math.max(80, 80 + vibrant * 20 + (rand() - 0.5) * 5),
  );
  const sat2 = Math.min(
    100,
    Math.max(80, 80 + vibrant * 20 + (rand() - 0.5) * 5),
  );

  // 4. Peak Chroma Lightness (42% - 56%) so colors are 100% rich and never pale
  const lightness1 = getVibrantLightness(hue1, false, rand());
  const lightness2 = getVibrantLightness(hue2, true, rand());

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
