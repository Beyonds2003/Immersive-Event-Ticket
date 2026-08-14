import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import "./index.css";
import App from "./App.tsx";

// Disable auto sRGB→linear conversion so hex colors from Figma
// are passed to shaders exactly as-is.
THREE.ColorManagement.enabled = false;

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>,
);
