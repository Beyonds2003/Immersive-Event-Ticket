import { Html } from "@react-three/drei";
import React, { useRef, useState } from "react";
import { createRipple } from "../../libs/createRipple";
import Arrow from "../Icons/Arrow";

const HtmlUI = () => {
  return (
    <Html fullscreen>
      <Tab />
      <Navigation />
    </Html>
  );
};

const Navigation = () => {
  const handleClick = (direction: "left" | "right") => {
    window.dispatchEvent(
      new CustomEvent("navigation-click", {
        detail: { direction },
      }),
    );
  };

  return (
    <div className="navigation-container">
      <button
        onClick={() => handleClick("left")}
        className="navigation-item left"
        aria-label="Previous slide"
      >
        <Arrow
          direction="left"
          aria-hidden="true"
          focusable="false"
          size={30}
        />
      </button>

      <button
        onClick={() => handleClick("right")}
        className="navigation-item right"
        aria-label="Next slide"
      >
        <Arrow
          direction="right"
          aria-hidden="true"
          focusable="false"
          size={30}
        />
      </button>
    </div>
  );
};

const colorA = "#06ecff";
const colorB = "#00e1ff";
const colorC = "#fff170";
const colorD = "#efda21";

const Tab = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const prevIndexRef = useRef(0);

  const handleTabClick = (tabIndex: number) => {
    if (tabIndex === prevIndexRef.current) return;
    if (isDisabled) return;

    // 1.5s disable button for animation and prevent spam click
    setIsDisabled(true);

    prevIndexRef.current = tabIndex;
    createRipple({
      coord: { x: 0, y: 0 },
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
    <div className="tab-container">
      <div className="tab-btn">
        <span
          className="tab-background"
          aria-hidden
          style={{ "--active-day": activeTab } as React.CSSProperties}
        />
        <button disabled={isDisabled} onClick={() => handleTabClick(0)}>
          New
        </button>
        <button disabled={isDisabled} onClick={() => handleTabClick(1)}>
          Own
        </button>
      </div>
    </div>
  );
};

export default HtmlUI;
