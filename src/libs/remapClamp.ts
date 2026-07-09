import { remap } from "./remap";

export const remapClamp = (
  num: number,
  in_min: number,
  in_max: number,
  out_min: number,
  out_max: number,
) => {
  return Math.min(
    out_max,
    Math.max(out_min, remap(num, in_min, in_max, out_min, out_max)),
  );
};
