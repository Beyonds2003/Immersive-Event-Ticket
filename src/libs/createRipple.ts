export type Params = {
  coord: { x: number; y: number };
  isPageTransition: boolean;
  colorA: string;
  colorB: string;
  addDistord?: boolean;
  nextPathname?: string;
  rippleDirection?: "out" | "in";
  timeScale?: number;
};

export const createRipple = ({
  coord,
  isPageTransition,
  colorA,
  colorB,
  addDistord = true,
  nextPathname,
  rippleDirection = "out",
  timeScale = 1,
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
        nextPathname,
        rippleDirection,
        timeScale,
      },
    }),
  );
};
