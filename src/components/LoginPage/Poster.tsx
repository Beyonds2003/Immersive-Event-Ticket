import { useRef } from "react";
import { useMouse } from "../../libs/useMouse";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { remapClamp } from "../../libs/remapClamp";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

const Poster = () => {
  const { coords, updateMouse } = useMouse();

  const tex1 = useTexture("/poster.png") as any;
  const tex2 = useTexture("/dashboard.png") as any;

  tex1.minFilter = tex1.magFilter = THREE.LinearFilter;
  tex2.minFilter = tex2.magFilter = THREE.LinearFilter;
  tex1.colorSpace = THREE.SRGBColorSpace;
  tex2.colorSpace = THREE.SRGBColorSpace;

  const material = useRef<THREE.ShaderMaterial>(null);

  const { radius, strength } = useControls("Poster", {
    radius: { value: 0.4, min: 0, max: 1, step: 0.01 },
    strength: { value: 0.005, min: 0, max: 0.1, step: 0.001 },
  });

  const uniforms = useRef({
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTextureResolution: {
      value: new THREE.Vector2(tex2.image.width, tex2.image.height),
    },
    uTexture1: { value: tex1 },
    uTexture2: { value: tex2 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRadius: { value: radius },
    uStrength: { value: strength },
  });

  useFrame((_state, delta) => {
    if (!material.current) return;

    updateMouse();

    material.current.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );

    const mouseX = remapClamp(coords.x, -1, 1, 0, 1);
    const mouseY = remapClamp(coords.y, -1, 1, 0, 1);

    material.current.uniforms.uMouse.value.set(mouseX, mouseY);
    material.current.uniforms.uRadius.value = radius;
    material.current.uniforms.uStrength.value = strength;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2, 256, 256]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent
        // wireframe
      />
    </mesh>
  );
};

const vertexShader = `


    uniform float uRadius;
    uniform float uStrength;
    uniform vec2 uMouse;
    uniform vec2 uResolution;

    varying vec2 vUv;
    varying vec2 vDistord;
    varying float vInfluence;

    void main() {

      vec3 pos = position;

      vec2 vertexUV = pos.xy * 0.5 + 0.5;

      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

      vec2 delta = uMouse - vertexUV;

      float distanceToMouse = length(delta * aspect);

      vec2 direction = delta / max(length(delta), 0.001);

      float influence = smoothstep(uRadius, 0.0, distanceToMouse);

      pos.x += direction.x * influence * uStrength;
      pos.y += direction.y * influence * uStrength;

      vUv = uv;
      vDistord = direction * influence * uStrength;
      vInfluence = influence;

      gl_Position = vec4(pos.xy, 0.9, 1.0);
    }


`;

const fragmentShader = `

    varying vec2 vUv;
    varying vec2 vDistord;
    varying float vInfluence;

    uniform sampler2D uTexture1;
    uniform vec2 uMousePos;
    uniform vec2 uResolution;

    void main() {

        vec2 uv = vUv;

        // Aspect correction
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

        vec2 uvAspect = (uv - 0.5) * aspect + 0.5;


        vec4 tex = texture2D(uTexture1, uv);

        float alpha = tex.a;

        if(alpha < 0.6) discard;

        gl_FragColor = vec4(vec3(alpha), 1.);
        // gl_FragColor = vec4(vec3(vDistord, 0.), 1.);

    }

`;

export default Poster;
