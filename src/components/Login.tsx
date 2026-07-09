import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMouse } from "../libs/useMouse";
import { remapClamp } from "../libs/remapClamp";

const Login = () => {
  return (
    <div className="h-screen login-container">
      <Scene />
    </div>
  );
};

const Scene = () => {
  return (
    <Canvas>
      <Poster />
      <LoginInput />
      <OrbitControls />
      <directionalLight position={[3, 1, 5]} intensity={1.7} color="white" />
      <ambientLight intensity={0.4} color="#504ed8" />
    </Canvas>
  );
};

const LoginInput = () => {
  const { nodes, materials } = useGLTF("models/login-input.glb") as any;

  const ref = useRef<THREE.Group>(null);

  const { coords, updateMouse } = useMouse();

  useFrame(() => {
    if (!ref.current) return;

    updateMouse();

    ref.current.rotation.y = remapClamp(coords.x, -1, 1, -0.2, 0.1);
    ref.current.rotation.x = remapClamp(-coords.y, -1, 1, -0.2, 0.2);
  });

  return (
    <group ref={ref} scale={2} position={[2, -0.2, 1]}>
      <mesh geometry={nodes.text.geometry} material={materials.Material_1} />
      <mesh geometry={nodes.Mesh_1.geometry} material={materials.Material_1} />
      <mesh
        geometry={nodes.Mesh_1_1.geometry}
        material={materials.Material_0}
      />
    </group>
  );
};

const Poster = () => {
  const { coords, updateMouse } = useMouse();

  const posterImage = useTexture("/poster.png");
  posterImage.minFilter = posterImage.magFilter = THREE.LinearFilter;
  posterImage.colorSpace = THREE.SRGBColorSpace;

  const uniforms = useRef({
    uTexture: { value: posterImage },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(0, 0) },
  });

  useFrame(() => {
    updateMouse();

    const mouseX = remapClamp(coords.x, -1, 1, 0, 1);
    const mouseY = remapClamp(coords.y, -1, 1, 0, 1);

    uniforms.current.uMouse.value.set(mouseX, mouseY);
    uniforms.current.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent={true}
      />
    </mesh>
  );
};

const vertexShader = `

    varying vec2 vUv;

    uniform vec2 uResolution;

    void main() {

       gl_Position = vec4(position, 1.0); 

       // Varying Uv
       vUv = uv;
    
    }

`;

const fragmentShader = `

    varying vec2 vUv;

    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform vec2 uResolution;

    void main() {

        vec2 uv = vUv;

        // Aspect correction
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

        vec2 uvAspect = (uv - 0.5) * aspect + 0.5;

        vec2 mouseAspect = (uMouse - 0.5) * aspect + 0.5;


        float circle = length(mouseAspect - uvAspect);
        float distord = smoothstep(0.3, -0.2, circle);

        vec4 tex = texture2D(uTexture, uv - distord * 0.01);


        gl_FragColor = vec4(vec3(tex), tex.a);
        // gl_FragColor = vec4(vec3(distord), 1.);
    
    }

`;

export default Login;
