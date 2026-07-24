import { useGLTF } from "@react-three/drei";
import React, { useRef } from "react";
import * as THREE from "three";
import { useMouse } from "../../libs/useMouse";
import { useFrame } from "@react-three/fiber";
import { remapClamp } from "../../libs/remapClamp";
import { useEmailInput } from "../../libs/useEmailInput";

const Input = () => {
  const { nodes, materials } = useGLTF("models/login-input.glb") as any;

  const ref = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  const { coords, updateMouse } = useMouse();

  useFrame(() => {
    if (!ref.current) return;

    updateMouse();

    ref.current.rotation.y = remapClamp(coords.x, -1, 1, -0.2, 0.1);
    ref.current.rotation.x = remapClamp(-coords.y, -1, 1, -0.2, 0.2);
  });

  const rotateEmailInput = () => {
    if (!spinGroupRef.current) return;

    const round = -1;

    gsap.fromTo(
      spinGroupRef.current.rotation,
      { x: 0 },
      {
        x: Math.PI * 2 * round,
        duration: 1.2 + Math.abs(round * 0.05),
        ease: "elastic.out(1, 1)",
      },
    );
  };

  const { texture, focus, blur } = useEmailInput((email) => {
    // rotateEmailInput();
    // onSubmitted();
    window.dispatchEvent(
      new CustomEvent("ripple-click", {
        detail: { x: coords.x, y: coords.y },
      })
    );
  });
  texture.flipY = false;

  return (
    <group ref={ref} position={[2, -0.2, 1]}>
      <group ref={spinGroupRef}>
        {/* Email input plane — canvas texture replaces the baked text mesh */}
        <mesh
          geometry={nodes.text.geometry}
          onClick={() => focus()}
          onPointerMissed={() => blur()}
        >
          <meshStandardMaterial
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={1}
            emissiveMap={texture}
            map={texture}
            emissive={"white"}
          />
        </mesh>

        <mesh
          geometry={nodes.Mesh_1.geometry}
          material={materials.Material_1}
        />
        <mesh
          geometry={nodes.Mesh_1_1.geometry}
          material={materials.Material_0}
        />
      </group>
    </group>
  );
};

export default Input;
