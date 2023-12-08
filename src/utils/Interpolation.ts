// Linear interpolation
export const lerp1d = (min: number, max: number, t: number) => {
  return min + t * (max - min);
};
