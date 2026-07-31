import { useGLTF } from "@react-three/drei";
import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useMouse } from "../../libs/useMouse";
import { useFrame } from "@react-three/fiber";
import { remapClamp } from "../../libs/remapClamp";
import { useEmailInput } from "../../libs/useEmailInput";
import gsap from "gsap";

const Input = () => {
  const { nodes, materials } = useGLTF("models/login-input.glb") as any;

  const [visible, setVisible] = useState(true);
  const isSubmittedRef = useRef(false);

  const ref = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  const { coords, updateMouse } = useMouse();

  useFrame(() => {
    if (!ref.current || !visible) return;

    updateMouse();

    ref.current.rotation.y = remapClamp(coords.x, -1, 1, -0.4, 0.1) * 0.8;
    ref.current.rotation.x = remapClamp(-coords.y, -1, 1, -0.4, 0.2) * 0.8;
  });

  const handlePointerEnter = () => {
    if (isSubmittedRef.current) return;
    document.body.style.cursor = "pointer";
    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 0.8,
      ease: "back.out(1.7)",
      overwrite: "auto",
    });
  };

  const handlePointerLeave = () => {
    if (isSubmittedRef.current) return;
    document.body.style.cursor = "auto";
    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 0.9,
      y: 0.9,
      z: 0.9,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

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

  const cleanUp = () => {
    if (!ref.current) return;
    isSubmittedRef.current = true;
    gsap.to(ref.current.scale, {
      x: 0,
      y: 0,
      z: 0,
      delay: 0.2,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        document.body.style.cursor = "auto";
        setVisible(false);
      },
    });
  };

  const { texture, focus, blur } = useEmailInput((email) => {
    // rotateEmailInput();
    // onSubmitted();

    console.log(coords.x, coords.y);

    window.dispatchEvent(
      new CustomEvent("ripple-click", {
        detail: { x: 0.34, y: 0 },
      }),
    );

    cleanUp();
  });
  texture.flipY = false;

  if (!visible) return null;

  return (
    <>
      <group ref={ref} position={[2, -0.2, 0]} scale={0.9}>
        <group ref={spinGroupRef}>
          {/* Email input plane — canvas texture replaces the baked text mesh */}
          <mesh geometry={nodes.text.geometry}>
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

      {/* Invisible Hover Helper to prevent jitter at the edge  */}
      <mesh
        visible={false}
        position={[1.9, -0.2, 1.5]}
        onClick={() => focus()}
        onPointerMissed={() => blur()}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[3.8, 1]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
};

export default Input;
