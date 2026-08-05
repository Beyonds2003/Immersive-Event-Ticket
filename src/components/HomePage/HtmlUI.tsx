import { Html } from "@react-three/drei";
import React, { useRef, useState } from "react";
import { createRipple } from "../../libs/createRipple";

const HtmlUI = () => {
  return (
    <Html fullscreen>
      <Tab />
    </Html>
  );
};

const colorA = "#06ecff";
const colorB = "#00e1ff";
const colorC = "#fff170";
const colorD = "#efda21";

const Tab = () => {
  const [activeTab, setActiveTab] = useState(0);
  const prevIndexRef = useRef(0);

  const handleTabClick = (tabIndex: number) => {
    if (tabIndex === prevIndexRef.current) return;

    prevIndexRef.current = tabIndex;
    createRipple({
      coord: { x: 0, y: 0 },
      isPageTransition: false,
      colorA: activeTab === 0 ? colorC : colorA,
      colorB: activeTab === 0 ? colorD : colorB,
    });
    setTimeout(() => {
      setActiveTab(tabIndex);
    }, 1000);
  };

  return (
    <div className="tab-container">
      <div className="tab-btn">
        <span
          className="tab-background"
          aria-hidden
          style={{ "--active-day": activeTab } as React.CSSProperties}
        />
        <button onClick={() => handleTabClick(0)}>New</button>
        <button onClick={() => handleTabClick(1)}>Own</button>
      </div>
    </div>
  );
};

export default HtmlUI;
