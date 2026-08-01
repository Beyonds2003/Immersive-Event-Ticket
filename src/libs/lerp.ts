/**
 * Linear interpolation between two values.
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0 = a, 1 = b)
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};
