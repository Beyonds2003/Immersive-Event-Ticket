import { alea } from "seedrandom";

export interface SphereRandomFactors {
  sphereScaleOffset: number;
  sphereScaleFactor: number;
  eyeScale: number;
  mouthScale: number;
  spacingVariation: number;
  eyeYOffset: number;
  mouthYOffset: number;
}

/**
 * Deterministically generates random sphere and face factors from a name & email seed.
 *
 * Rules:
 * 1. Sphere size is random based on name & email seed.
 * 2. If eyes and mouth are big, sphere is guaranteed to be big as well.
 * 3. Big spheres can have either small or big eyes and mouth.
 * 4. Small spheres will never have big eyes and mouth.
 */
export function getSphereRandomFactors(
  name: string = "",
  email: string = "",
): SphereRandomFactors {
  const rng = alea(`${name || ""} ${email || ""}`);

  // Sphere size factor: 0.0 (small) to 1.0 (big)
  const sphereScaleFactor = rng();
  const sphereScaleOffset = sphereScaleFactor * 0.35;

  // Eye & Mouth scaling:
  // - Minimum scale is always small (~0.70) so big spheres can have small faces
  // - Maximum scale depends on sphere size:
  //     sphereScaleFactor = 0 (small sphere) -> max scale = 0.82 (never big face)
  //     sphereScaleFactor = 1 (big sphere)   -> max scale = 1.35 (can be big face)
  const minEyeScale = 0.5;
  const maxEyeScale = 0.82 + sphereScaleFactor * 0.53;
  const eyeScale = minEyeScale + rng() * (maxEyeScale - minEyeScale);

  const minMouthScale = 0.58;
  const maxMouthScale = 0.8 + sphereScaleFactor * 0.55;
  const mouthScale = minMouthScale + rng() * (maxMouthScale - minMouthScale);

  const spacingVariation = (rng() - 0.5) * 0.25;
  const eyeYOffset = (rng() - 0.5) * 0.08;
  const mouthYOffset = rng() * 0.06;

  return {
    sphereScaleOffset,
    sphereScaleFactor,
    eyeScale,
    mouthScale,
    spacingVariation,
    eyeYOffset,
    mouthYOffset,
  };
}
