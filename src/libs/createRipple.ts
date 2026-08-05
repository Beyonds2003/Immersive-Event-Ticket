export type Params = {
  coord: { x: number; y: number };
  isPageTransition: boolean;
  colorA: string;
  colorB: string;
  addDistord?: boolean;
};

export const createRipple = ({
  coord,
  isPageTransition,
  colorA,
  colorB,
  addDistord = true,
}: Params) => {
  window.dispatchEvent(
    new CustomEvent("ripple-click", {
      detail: {
        x: coord.x,
        y: coord.y,
        isPageTransition,
        colorA,
        colorB,
        addDistord,
      },
    }),
  );
};
