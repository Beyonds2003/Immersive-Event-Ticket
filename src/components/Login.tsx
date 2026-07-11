import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMouse } from "../libs/useMouse";
import { remapClamp } from "../libs/remapClamp";
import { useEmailInput } from "../libs/useEmailInput";
import gsap from "gsap";

const Login = () => {
  return (
    <div className="h-screen login-container">
      <Scene />
    </div>
  );
};

const Scene = () => {
  const [showOtp, setShowOtp] = React.useState(false);

  return (
    <Canvas>
      <Poster />
      <LoginInput onSubmitted={() => setShowOtp(true)} />
      <OtpInput show={showOtp} />
      <directionalLight position={[3, 1, 5]} intensity={8.7} color="#3457e5" />
      <ambientLight intensity={0.4} color="#504ed8" />
    </Canvas>
  );
};

const LoginInput = ({ onSubmitted }: { onSubmitted: () => void }) => {
  const { nodes, materials } = useGLTF("models/login-input.glb") as any;

  const ref = useRef<THREE.Group>(null);

  const { coords, updateMouse } = useMouse();

  useFrame(() => {
    if (!ref.current) return;

    updateMouse();

    ref.current.rotation.y = remapClamp(coords.x, -1, 1, -0.2, 0.1);
    ref.current.rotation.x = remapClamp(-coords.y, -1, 1, -0.2, 0.2);
  });

  const scaleDownTheEmailInput = () => {
    if (!ref.current) return;

    // Compute world-space bounding box to find the exact left edge
    const box = new THREE.Box3().setFromObject(ref.current);
    const currentPosX = ref.current.position.x;
    const currentScale = ref.current.scale.x;

    // Derive the local-space min-x of the pivot (works even if GLB pivot isn't centered)
    const localMinX = (box.min.x - currentPosX) / currentScale;

    // At scale 1 the left edge should still equal box.min.x:
    //   targetX + localMinX * 1 = box.min.x  →  targetX = box.min.x - localMinX
    const targetX = box.min.x - localMinX;

    const scale = 0;
    const dur = 0.6;
    const ease = "power4.out";

    gsap.to(ref.current.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration: dur,
      ease: ease,
    });

    // changing the origin
    gsap.to(ref.current.position, {
      x: targetX - 1,
      duration: dur,
      ease: ease,
    });
  };

  const { texture, focus, blur } = useEmailInput((email) => {
    scaleDownTheEmailInput();
    onSubmitted();
  });
  texture.flipY = false;

  return (
    <group ref={ref} scale={2} position={[2, -0.2, 1]}>
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

      <mesh geometry={nodes.Mesh_1.geometry} material={materials.Material_1} />
      <mesh
        geometry={nodes.Mesh_1_1.geometry}
        material={materials.Material_0}
      />
    </group>
  );
};

const OTP_COUNT = 4;
const OTP_BASE_X = 1.6; // Base starting X position

// Define the gaps between adjacent boxes (length matches OTP_COUNT)
const OTP_GAPS = [1.15, 1.25, 1.45, 0];

// Precalculate X positions of the boxes based on the gap array
const OTP_X_POSITIONS = (() => {
  const positions: number[] = [];
  let currentX = OTP_BASE_X;
  for (let i = 0; i < OTP_COUNT; i++) {
    if (i > 0) {
      // Add the gap between Box i-1 and Box i
      const gap = OTP_GAPS[i - 1] !== undefined ? OTP_GAPS[i - 1] : 1.2;
      currentX += gap;
    }
    positions.push(currentX);
  }
  return positions;
})();

const getOtpBoxX = (i: number) => {
  return OTP_X_POSITIONS[i] ?? 0;
};

// Scratch variables to avoid GC allocations in the render loop
const _ndcNear = new THREE.Vector3();
const _ndcFar = new THREE.Vector3();
const _cursorWorld = new THREE.Vector3();
const _worldPos = new THREE.Vector3();

const OtpInput = ({ show }: { show: boolean }) => {
  const { nodes, materials } = useGLTF("models/otp-input.glb") as any;
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const boxRefs = useRef<(THREE.Group | null)[]>([]);

  const { coords, updateMouse } = useMouse();

  const showOtpInput = () => {
    const finalXPositions = Array.from({ length: OTP_COUNT }, (_, i) =>
      getOtpBoxX(i),
    );
    // All boxes start at the first box's final X position, scale 0
    boxRefs.current.forEach((box) => {
      if (!box) return;
      box.position.x = finalXPositions[0];
      box.scale.setScalar(0);
    });

    // Animate: scale up + spread to final positions
    boxRefs.current.forEach((box, i) => {
      if (!box) return;
      gsap.to(box.scale, {
        x: 2,
        y: 2,
        z: 2,
        duration: 0.7,
        ease: "back.out(1.4)",
        delay: i * 0.06,
      });
      gsap.to(box.position, {
        x: finalXPositions[i],
        duration: 0.7,
        ease: "back.out(1.4)",
        delay: i * 0.06,
      });
    });
  };

  useEffect(() => {
    if (show) {
      showOtpInput();
    }
  }, [show]);

  useFrame(() => {
    if (!groupRef.current) return;
    updateMouse();

    // Unproject cursor NDC to world space ray, intersect at z = 1 (box plane)
    _ndcNear.set(coords.x, coords.y, -1).unproject(camera);
    _ndcFar.set(coords.x, coords.y, 1).unproject(camera);
    const dir = _ndcFar.clone().sub(_ndcNear).normalize();
    // Find where ray hits z = 1 plane
    const t = (1 - _ndcNear.z) / dir.z;
    _cursorWorld.copy(_ndcNear).addScaledVector(dir, t);

    // Each box independently rotates to look at the cursor depending on distance
    boxRefs.current.forEach((box, index) => {
      if (!box) return;

      // Get this box's world position
      box.getWorldPosition(_worldPos);

      // Calculate distance between box and cursor
      const distance = _worldPos.distanceTo(_cursorWorld);

      // Define thresholds: near (rotation -> 0) and far (rotation -> look at cursor)
      const minDistance = 0.1;
      const maxDistance = 2;

      // Calculate factor between 0 (near/no rotation) and 1 (far/look at cursor)
      let factor = (distance - minDistance) / (maxDistance - minDistance);
      factor = Math.max(0, Math.min(1, factor));

      // Vector from box to cursor
      const dx = _cursorWorld.x - _worldPos.x;
      const dy = _cursorWorld.y - _worldPos.y;
      const dz = _cursorWorld.z - _worldPos.z;

      // Horizontal (Y-axis) and vertical (X-axis) look angles, clamped
      const lookRotY = remapClamp(
        Math.atan2(dx, dz),
        -Math.PI,
        Math.PI,
        -0.5,
        0.5,
      );
      const lookRotX = remapClamp(
        Math.atan2(-dy, dz),
        -Math.PI,
        Math.PI,
        -0.5,
        0.5,
      );

      // Interpolate targets
      const targetRotY = lookRotY * factor;
      const targetRotX = lookRotX * factor * 0.5;

      // console.log(index, targetRotY);

      // Smooth lerp so eyes don't snap
      box.rotation.y += (targetRotY - box.rotation.y) * 0.1;
      box.rotation.x += (targetRotX - box.rotation.x) * 0.1;
    });
  });

  return (
    <group ref={groupRef} position={[-1.4, -0.2, 1]}>
      {Array.from({ length: OTP_COUNT }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            boxRefs.current[i] = el;
          }}
          scale={0}
          position={[getOtpBoxX(i), 0, 0]}
        >
          <group rotation={[Math.PI / 2, 0, i * 0.3]}>
            <mesh
              geometry={nodes.Circle004.geometry}
              material={materials.Material_0}
            />
            <mesh
              geometry={nodes.Circle004_1.geometry}
              material={materials.Material_1}
            />
          </group>
          <mesh
            geometry={nodes.number.geometry}
            // material={materials.Material_1}
            rotation={[Math.PI / 2, 0, i * 0.3]}
          >
            <meshStandardMaterial
              emissiveIntensity={0.8}
              roughness={0.3}
              metalness={1}
              // emissiveMap={texture}
              // map={texture}
              emissive={"white"}
            />
          </mesh>
        </group>
      ))}
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
