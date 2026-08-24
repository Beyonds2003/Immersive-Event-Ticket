import React from "react";
import { Html, useProgress } from "@react-three/drei";

interface CanvasLoaderProps {
  text?: string;
}

const CanvasLoader: React.FC<CanvasLoaderProps> = ({ text }) => {
  const { progress, active } = useProgress();

  return (
    <Html center>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: "#f1e8dd",
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          userSelect: "none",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "2px solid rgba(241, 232, 221, 0.15)",
              borderTopColor: "#d974e8",
              borderRightColor: "#9d4edd",
              animation: "profile-canvas-spin 0.9s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite",
            }}
          />
        </div>
        <span style={{ opacity: 0.85, textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)" }}>
          {text || (active && progress > 0 ? `Loading ${Math.round(progress)}%` : "Loading...")}
        </span>
      </div>
    </Html>
  );
};

export default CanvasLoader;
