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
}: Props) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDisabled, setIsDisabled] = useState(false);
  const prevIndexRef = useRef(0);

  const handleTabClick = (tabIndex: number) => {
    if (tabIndex === prevIndexRef.current) return;
    if (isDisabled) return;

    // 1.5s disable button for animation and prevent spam click
    setIsDisabled(true);

    prevIndexRef.current = tabIndex;
    createRipple({
      coord: { x: rippleCoord[0], y: rippleCoord[1] },
      isPageTransition: false,
      colorA: activeTab === 0 ? colorC : colorA,
      colorB: activeTab === 0 ? colorD : colorB,
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
        <button disabled={isDisabled} onClick={() => handleTabClick(0)}>
          {textA}
        </button>
        <button disabled={isDisabled} onClick={() => handleTabClick(1)}>
          {textB}
        </button>
      </div>
    </div>
  );
};

export default Tab;
