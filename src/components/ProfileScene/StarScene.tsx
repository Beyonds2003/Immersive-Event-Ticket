import React, { Suspense, useEffect, useRef, useState } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import GroupOfSphere from "../General/GroupOfSphere";

const StarScene: React.FC = () => {
  // const spotLightRef = useRef<THREE.SpotLight>(null);

  // const controls = useControls("StarScene Spotlight", {
  //   enabled: { value: true },
  //   color: { value: "#d8b4fe" },
  //   intensity: { value: 18, min: 0, max: 100, step: 0.5 },
  //   position: {
  //     value: [5.5, 7.5, 3.5],
  //     step: 0.1,
  //   },
  //   angle: { value: 0.65, min: 0.1, max: Math.PI / 2, step: 0.01 },
  //   penumbra: { value: 0.85, min: 0, max: 1, step: 0.05 },
  //   decay: { value: 1.5, min: 0, max: 4, step: 0.1 },
  //   distance: { value: 25, min: 0, max: 50, step: 1 },
  //   castShadow: { value: true },
  // });

  return (
    <>
      <ambientLight intensity={2.4} color="#504ed8" />
      <ambientLight intensity={2.8} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={3}
        castShadow
        shadow-normalBias={0.008}
      />

      {/* {controls.enabled && (
        <spotLight
          ref={spotLightRef}
          position={controls.position as [number, number, number]}
          color={controls.color}
          intensity={controls.intensity}
          angle={controls.angle}
          penumbra={controls.penumbra}
          decay={controls.decay}
          distance={controls.distance}
          castShadow={controls.castShadow}
          shadow-normalBias={0.008}
        />
      )} */}
      <Star />
    </>
  );
};

const Star = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShow(true);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Suspense fallback={null}>
      {show && <GroupOfSphere configKey="Profile" configOffset={6} />}
    </Suspense>
  );
};

export default StarScene;
