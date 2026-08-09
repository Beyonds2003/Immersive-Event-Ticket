import { OrbitControls } from "@react-three/drei";
import { useControls, folder } from "leva";
import { useRef, useState } from "react";
import { SpiralCards } from "./SpiralCards";
import { PostProcessingPass } from "./PostProcessingPass";
import EventCardUi from "./EventCardUi";

const EventCard = () => {
  const [, setActiveCardIndex] = useState<number>(0);
  const [, setIsSnapped] = useState<boolean>(true);
  const setTargetScrollRef = useRef<
    ((val: number | ((prev: number) => number)) => void) | null
  >(null);

  // Leva Controls with working Card Width, Height, Gap, Infinite Loop, and Post Processing
  const levaControls = useControls("Spiral & Frame Controls", {
    "1. Helical Spiral Path": folder({
      totalCards: {
        value: 16,
        min: 4,
        max: 40,
        step: 1,
        label: "Total Cards (u2)",
      },
      radius: {
        value: 4.5,
        min: 1.0,
        max: 12.0,
        step: 0.1,
        label: "Spiral Radius (u3)",
      },
      pitch: {
        value: 7.5,
        min: 0.0,
        max: 30.0,
        step: 0.1,
        label: "Pitch Drop (u4)",
      },
    }),
    "Mouse Interaction": folder({
      mouseRadius: {
        value: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Mouse Radius (u8)",
      },
      mouseStrength: {
        value: 0.5,
        min: 0,
        max: 4,
        step: 0.01,
        label: "Mouse Strength (u5)",
      },
    }),
    "Card Dimensions & Spacing": folder({
      cardGap: {
        value: 1.7,
        min: 0.01,
        max: 5.0,
        step: 0.05,
        label: "Card Gap / Spacing",
      },
      cardWidth: {
        value: 2.4,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Card Width",
      },
      cardHeight: {
        value: 2,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Card Height",
      },
      cardScale: {
        value: 0.8,
        min: 0.3,
        max: 3.0,
        step: 0.05,
        label: "Overall Scale (u9)",
      },
    }),
    "2. Local Coordinate Frame": folder({
      twist: {
        value: 0.4,
        min: 0.0,
        max: 3.0,
        step: 0.05,
        label: "Twist Angle (u7)",
      },
      tangentMixFactor: {
        value: 0.32,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Tangent Mix (u6)",
      },
      tangentMixX: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Tangent Mix X (u5.x)",
      },
      tangentMixY: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Tangent Mix Y (u5.y)",
      },
      tangentMixZ: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Tangent Mix Z (u5.z)",
      },
      upMixX: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Up Mix X (u8.x)",
      },
      upMixY: {
        value: 1.0,
        min: -1.0,
        max: 2.0,
        step: 0.1,
        label: "Up Mix Y (u8.y)",
      },
      upMixZ: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Up Mix Z (u8.z)",
      },
    }),
    "Scroll & Snap Physics": folder({
      enableSnap: { value: true, label: "Enable Snap" },
      snapStiffness: {
        value: 0.12,
        min: 0.02,
        max: 0.4,
        step: 0.01,
        label: "Snap Stiffness",
      },
      scrollSensitivity: {
        value: 0.005,
        min: 0.001,
        max: 0.02,
        step: 0.001,
        label: "Scroll Speed",
      },
      infiniteLoop: { value: false, label: "Infinite Loop" },
    }),
    "Visual Styling": folder({
      cardColor: { value: "#0aefe7", label: "Card Base Color" },
      activeColor: { value: "#ffe816", label: "Active Highlight" },
      wireframe: { value: false, label: "Wireframe Mode" },
    }),
    "3. Post Processing Pass (FBO + Depth)": folder({
      enablePostProcessing: { value: false, label: "Enable Post Processing" },
      showDepthOnly: { value: false, label: "Show Depth Buffer Only" },
      blurStrength: {
        value: 0.5,
        min: 0.0,
        max: 3.0,
        step: 0.05,
        label: "Depth Blur Strength",
      },
      chromaticAberration: {
        value: 0.005,
        min: 0.0,
        max: 0.03,
        step: 0.001,
        label: "Chromatic Aberration",
      },
      focusDepth: {
        value: 5.0,
        min: 1.0,
        max: 20.0,
        step: 0.2,
        label: "Focus Distance Z",
      },
      focusRange: {
        value: 4.0,
        min: 0.5,
        max: 10.0,
        step: 0.2,
        label: "Focus Blur Range",
      },
    }),
  });

  return (
    <Scene
      controls={levaControls}
      onCardChange={setActiveCardIndex}
      onSnapChange={setIsSnapped}
      setTargetScrollRef={setTargetScrollRef}
    />
  );
};

// Scene Canvas Wrapper
const Scene = ({
  controls,
  onCardChange,
  onSnapChange,
  setTargetScrollRef,
}: {
  controls: any;
  onCardChange: (index: number) => void;
  onSnapChange: (snapped: boolean) => void;
  setTargetScrollRef: React.MutableRefObject<any>;
}) => {
  return (
    <>
      <PostProcessingPass controls={controls}>
        <SpiralCards
          controls={controls}
          onCardChange={onCardChange}
          onSnapChange={onSnapChange}
          setTargetScrollRef={setTargetScrollRef}
        />
      </PostProcessingPass>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </>
  );
};

export default EventCard;
