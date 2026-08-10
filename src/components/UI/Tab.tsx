import React, { useRef, useState } from "react";
import { createRipple } from "../../libs/createRipple";

type Props = {
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
  className?: string;
  textA: string;
  textB: string;
  rippleCoord?: [number, number];
  /** 0-based index of the initially active tab (default: 0) */
  initialTab?: number;
  isRippleFromClick?: boolean;
  rippleDirection?: "out" | "in";
  timeScale?: number;
};

const Tab = ({
  colorA,
  colorB,
  colorC,
  colorD,
  className,
  textA,
  textB,
  rippleCoord = [0, 0],
  initialTab = 0,
  isRippleFromClick = false,
  rippleDirection = "out",
  timeScale = 1,
}: Props) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDisabled, setIsDisabled] = useState(false);
  const prevIndexRef = useRef(initialTab);

  const handleTabClick = (
    tabIndex: number,
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (tabIndex === prevIndexRef.current) return;
    if (isDisabled) return;

    // 1.5s disable button for animation and prevent spam click
    setIsDisabled(true);

    let x = rippleCoord[0];
    let y = rippleCoord[1];

    if (e?.currentTarget && isRippleFromClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      x = (centerX / window.innerWidth) * 2 - 1;
      y = -(centerY / window.innerHeight) * 2 + 1;
    }

    prevIndexRef.current = tabIndex;
    createRipple({
      coord: { x, y },
      isPageTransition: false,
      colorA: activeTab === 0 ? colorC : colorA,
      colorB: activeTab === 0 ? colorD : colorB,
      rippleDirection,
      timeScale,
    });

    window.dispatchEvent(
      new CustomEvent("tab-click", {
        detail: {
          tabIndex,
        },
      }),
    );

    setActiveTab(tabIndex);

    setTimeout(() => {
      setIsDisabled(false);
    }, 1700);
  };

  return (
    <div className={`tab-container ${className}`}>
      <div className="tab-btn">
        <span
          className="tab-background"
          aria-hidden
          style={{ "--active-day": activeTab } as React.CSSProperties}
        />
        <button disabled={isDisabled} onClick={(e) => handleTabClick(0, e)}>
          {textA}
        </button>
        <button disabled={isDisabled} onClick={(e) => handleTabClick(1, e)}>
          {textB}
        </button>
      </div>
    </div>
  );
};

export default Tab;
