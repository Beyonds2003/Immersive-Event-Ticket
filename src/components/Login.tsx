import { useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

const Login = () => {
  return (
    <div className="h-screen login-container bg-black">
      <Scene />
    </div>
  );
};

const Scene = () => {
  return (
    <Canvas>
      <Model />
    </Canvas>
  );
};

const Model = () => {
  const posterImage = useTexture("/poster.png");
  posterImage.minFilter = posterImage.magFilter = THREE.LinearFilter;
  posterImage.colorSpace = THREE.SRGBColorSpace;

  const uniforms = useRef({
    uTexture: { value: posterImage },
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />{" "}
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

    void main() {

       gl_Position = vec4(position, 1.0); 

       // Varying Uv
       vUv = uv;
    
    }

`;

const fragmentShader = `

    varying vec2 vUv;

    uniform sampler2D uTexture;

    void main() {

        vec2 uv = vUv;

        vec4 tex = texture2D(uTexture, uv);

        gl_FragColor = vec4(vec3(tex), tex.a);
    
    }

`;

export default Login;
