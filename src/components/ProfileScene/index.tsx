import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, useGLTF } from "@react-three/drei";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import StarScene from "./StarScene";
import ScenePlane from "./ScenePlane";
import Particles from "./Particles";
import GodRays from "./GodRays";
import BloomEffect from "./BloomEffect";
import CanvasLoader from "./CanvasLoader";
import gsap from "gsap";

const index = () => {
  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        marginTop: "50px",
      }}
      camera={{ position: [0, 1, 15], fov: 20 }}
      shadows
      resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <Scene />
      </Suspense>

      <ambientLight intensity={2.4} color="#504ed8" />
      <ambientLight intensity={2.8} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={10.8}
        castShadow
        shadow-normalBias={0.008}
      />
    </Canvas>
  );
};

const Scene = () => {
  const { camera } = useThree();
  const virtualScene = useMemo(() => new THREE.Scene(), []);
  const fbo = useFBO({ samples: 4 });

  const newCamera = new THREE.PerspectiveCamera(15);
  newCamera.position.set(0, 1, 15);

  // Render offscreen StarScene into the FBO
  useFrame((state) => {
    state.gl.setRenderTarget(fbo);
    state.gl.setClearColor(0x000000, 0);
    state.gl.clear();
    state.gl.render(virtualScene, newCamera);
    state.gl.setRenderTarget(null);
  });

  return (
    <>
      {/* Offscreen Scene via Portal */}
      {createPortal(<StarScene />, virtualScene)}

      {/* 2x2 Plane with custom ShaderMaterial showing the scene texture */}
      <ScenePlane texture={fbo.texture} />

      {/* Volumetric God Rays on Top Right */}
      <GodRays />

      {/* Main Scene Model */}
      <Stage />

      {/* Dynamic Rising Particles */}
      <Particles />

      {/* Bloom Postprocessing */}
      <BloomEffect />
    </>
  );
};

const Stage = () => {
  const { nodes, materials } = useGLTF("/models/stage.glb") as any;
  const ref = useRef<THREE.Group>(null);

  const lightControls = useControls("Stage Light Ring", {
    color: { value: "#d974e8" },
    emissiveIntensity: { value: 1.7, min: 0, max: 20, step: 0.1 },
    toneMapped: { value: false },
  });

  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.7,
      ease: "back.out(1.7)",
    });
  }, []);

  return (
    <group ref={ref} scale={0} dispose={null} position={[0, -1.501, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle.geometry}
        material={materials.black}
      >
        <meshStandardMaterial color={"#292D38"} roughness={0} metalness={0.4} />
      </mesh>
      <mesh castShadow receiveShadow geometry={nodes.Circle_1.geometry}>
        <meshStandardMaterial
          color={lightControls.color}
          emissive={lightControls.color}
          emissiveIntensity={lightControls.emissiveIntensity}
          toneMapped={lightControls.toneMapped}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

export default index;
