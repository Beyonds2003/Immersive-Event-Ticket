import React from "react";
import WobbleButton from ".";

const Example = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        background: "#0f0f13",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <WobbleButton
        text="Wobble"
        hoverText="Click me!"
        fillColor="#FF5379"
        width={180}
        height={60}
        fontSize={1.15}
        emitHearts
      />
      <WobbleButton
        text="Physics Bowl"
        hoverText="Click me"
        fillColor="#6C4EF5"
        width={200}
        height={60}
        fontSize={1.15}
        bulgeAmount={6}
        stiffness={0.04}
        damping={0.96}
        proximityThreshold={70}
      />
      <WobbleButton
        fillColor="#1CBFB0"
        width={60}
        height={60}
        bulgeAmount={3}
        stiffness={0.04}
        damping={0.9}
        clickShockWave={1}
        proximityThreshold={70}
      />
      {/* <WobbleButton
        text="Spring ✦"
        fillColor="#1CBFB0"
        width={200}
        height={60}
        fontSize={1.1}
        influenceRadius={5}
        wobbleChars
      /> */}
    </div>
  );
};

export default Example;
