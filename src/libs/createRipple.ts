type BaseParams = {
  coord: { x: number; y: number };
  colorA: string;
  colorB: string;
  addDistord?: boolean;
  rippleDirection?: "out" | "in";
  timeScale?: number;
  /**
   * Progress fraction (0–1) at which the "page-transition-end" event is fired.
   */
  transitionFireAt?: number;
  delay?: number;
};

export type Params =
  | (BaseParams & {
      isPageTransition: true;
      nextPathname: string;
    })
  | (BaseParams & {
      isPageTransition: false;
      nextPathname?: never;
    });

export const createRipple = ({
  coord,
  isPageTransition,
  colorA,
  colorB,
  addDistord = true,
  nextPathname,
  rippleDirection = "out",
  timeScale = 1,
  transitionFireAt = 1,
  delay = 0,
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
        transitionFireAt,
        delay,
      },
    }),
  );
};
