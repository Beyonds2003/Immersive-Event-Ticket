import { Html } from "@react-three/drei";
import React, { useState } from "react";

const HtmlUI = () => {
  return (
    <Html fullscreen>
      <Tab />
    </Html>
  );
};

const Tab = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
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
