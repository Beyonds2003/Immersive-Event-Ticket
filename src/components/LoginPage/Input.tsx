import { Html, useGLTF } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMouse } from "../../libs/useMouse";
import { useFrame } from "@react-three/fiber";
import { remapClamp } from "../../libs/remapClamp";
import { lerp } from "../../libs/lerp";
import { useEmailInput } from "../../libs/useEmailInput";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { useControls } from "leva";

gsap.registerPlugin(SplitText);

const Input = () => {
  const { nodes, materials } = useGLTF("models/login-input.glb") as any;

  const [visible, setVisible] = useState(true);
  const isSubmittedRef = useRef(false);

  const ref = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);

  const { coords, updateMouse } = useMouse();

  const { color } = useControls("Input", {
    color: "#3457e5",
  });

  useFrame(() => {
    if (!ref.current || !visible) return;

    updateMouse();

    const targetY = remapClamp(coords.x, -1, 1, -0.4, 0.1) * 0.4;
    const targetX = remapClamp(-coords.y, -1, 1, -0.4, 0.2) * 0.4;

    ref.current.rotation.y = lerp(ref.current.rotation.y, targetY, 0.05);
    ref.current.rotation.x = lerp(ref.current.rotation.x, targetX, 0.05);
  });

  const handlePointerEnter = () => {
    if (isSubmittedRef.current) return;
    document.body.style.cursor = "pointer";
    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 0.6,
      ease: "back.out(2)",
      overwrite: "auto",
    });
  };

  const handlePointerLeave = () => {
    if (isSubmittedRef.current) return;
    document.body.style.cursor = "auto";
    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.4,
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

    // console.log(coords.x, coords.y);

    window.dispatchEvent(
      new CustomEvent("ripple-click", {
        detail: { x: 0.24, y: 0 },
      }),
    );

    cleanUp();
  });
  texture.flipY = false;

  if (!visible) return null;

  return (
    <>
      <group ref={ref} position={[2, -0.2, -0.2]} scale={1}>
        <group ref={spinGroupRef}>
          {/* Email input plane — canvas texture replaces the baked text mesh */}
          <mesh geometry={nodes.text.geometry}>
            <meshStandardMaterial
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
              // emissiveMap={texture}
              // map={texture}
              emissive={"white"}
            />
          </mesh>

          <mesh
            geometry={nodes.Mesh_1.geometry}
            material={materials.Material_1}
          />
          <mesh
            geometry={nodes.Mesh_1_1.geometry}
            // material={materials.Material_0}
          >
            <meshStandardMaterial
              emissiveIntensity={2.5}
              roughness={0.1}
              metalness={0.9}
              emissive={color}
            />
          </mesh>

          <InputText />
        </group>
      </group>

      {/* Invisible Hover Helper to prevent jitter at the edge  */}
      <Html position={[0, 0.3, 0]}>
        <div
          className="input-hover-helper"
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
          onClick={() => focus()}
        />
      </Html>
      {/* <mesh
        visible={false}
        position={[1.9, -0.2, 0.5]}
        onClick={() => focus()}
        onPointerMissed={() => blur()}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[4, 1]} />
        <meshBasicMaterial />
      </mesh> */}
    </>
  );
};
const data = ["Hello", "How are you", "Enter Email"];
const InputText = () => {
  useEffect(() => {
    let index = 0;
    let delay = 3;

    const play = () => {
      const el = document.querySelector(".animate-input-text");

      if (!el) return;

      el.textContent = data[index];

      const split = new SplitText(".animate-input-text", {
        type: "chars",
        charsClass: "char",
      });

      gsap
        .timeline({
          onComplete: () => {
            split.revert();
            index = (index + 1) % data.length;
            play();
          },
          force3D: false,
        })
        .from(split.chars, {
          // y: 30,
          scale: 0,
          stagger: 0.04,
          duration: 0.4,
          ease: "back.out(1.7)",
          transformOrigin: "50% 80%",
        })
        .to(
          split.chars,
          {
            // y: -30,
            scale: 0,
            stagger: 0.03,
            duration: 0.2,
            ease: "power2.in",
            transformOrigin: "50% 80%",
          },
          `+=${delay}`,
        );
    };

    const timeout = setTimeout(() => {
      play();
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Html
      position={[0, 0, 0.2]}
      center
      transform
      // occlude
      style={{ pointerEvents: "none" }}
    >
      <h1 className="animate-input-text">{data[0]}</h1>
    </Html>
  );
};

export default Input;
