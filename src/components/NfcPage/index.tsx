import React, { Suspense, useEffect, useRef, useState } from "react";
import GroupOfSphere from "../General/GroupOfSphere";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMouse } from "../../libs/useMouse";
import { remapClamp } from "../../libs/remapClamp";
import { lerp } from "../../libs/lerp";

const index = () => {
  const [show, setShow] = useState(false);
  const ref = useRef<THREE.Group>(null);

  const { coords, updateMouse } = useMouse();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShow(true);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useFrame(() => {
    if (ref.current) {
      //   ref.current.rotation.y += 0.01;

      updateMouse();

      const targetY = remapClamp(coords.x, -1, 1, -0.4, 0.1) * 0.4;

      ref.current.rotation.y = lerp(ref.current.rotation.y, targetY, 0.05);
    }
  });

  return (
    <Suspense fallback={<></>}>
      {show && (
        <group ref={ref}>
          <GroupOfSphere configKey="Nfc" configOffset={0} />
        </group>
      )}
    </Suspense>
  );
};

export default index;
