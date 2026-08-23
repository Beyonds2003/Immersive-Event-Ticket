import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ScenePlaneProps {
  texture?: THREE.Texture | null;
  position?: [number, number, number];
  size?: [number, number];
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Convert Linear RGB from FBO to sRGB for display
    vec3 sRGB = pow(texColor.rgb, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(texColor.rgb, texColor.a);
    // gl_FragColor = vec4(vec3(1.), 1.);
  }
`;

const ScenePlane: React.FC<ScenePlaneProps> = ({
  texture = null,
  position = [0, 0, 0],
  size = [5.8 * 1.3, 4 * 1.3],
}) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
    }),
    [],
  );

  useFrame(() => {
    if (matRef.current && texture) {
      matRef.current.uniforms.uTexture.value = texture;
    }
  });

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export default ScenePlane;
