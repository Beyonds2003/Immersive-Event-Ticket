export const getRatioOverflow = () => {
  const ideaRatio = 16 / 9;
  const currentRatio = window.innerWidth / window.innerHeight;
  const ratioOverflow = Math.max(1, ideaRatio / currentRatio) - 1;

  return ratioOverflow;
};
