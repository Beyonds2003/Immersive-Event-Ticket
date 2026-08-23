import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { useGLTF, useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material";
import { generateColorPair } from "../../libs/generateColorPair";
import { useRingDistordTexture } from "../../libs/ringDistordRenderTarget";
import Message from "./Message";
import { useLocation } from "react-router";
import { globalWindowPointer } from "./GroupOfSphere";
import { pageColor } from "../../libs/config/pageColor";
import { routeSphereMap } from "../../libs/config/pageSphere";
import { getSphereRandomFactors } from "./sphereRandom";

// ── UV Region Type ────────────────────────────────────────────────────────────

export interface UVRegion {
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
}

// ── Custom Black-Ink Shader Material ──────────────────────────────────────────

const FaceSpriteMaterial = ({
  texture,
  uvRegion,
  color = "#111115",
}: {
  texture: THREE.Texture | null;
  uvRegion: UVRegion;
  color?: string;
}) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useRef({
    uMap: { value: texture },
    uUvRegion: {
      value: new THREE.Vector4(
        uvRegion.offsetX,
        uvRegion.offsetY,
        uvRegion.repeatX,
        uvRegion.repeatY,
      ),
    },
    uColor: { value: new THREE.Color(color) },
  });

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uMap.value = texture;
      matRef.current.uniforms.uUvRegion.value.set(
        uvRegion.offsetX,
        uvRegion.offsetY,
        uvRegion.repeatX,
        uvRegion.repeatY,
      );
      matRef.current.uniforms.uColor.value.set(color);
    }
  });

  return (
    <shaderMaterial
      ref={matRef}
      uniforms={uniforms.current}
      transparent={true}
      depthWrite={false}
      side={THREE.DoubleSide}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform sampler2D uMap;
        uniform vec4 uUvRegion;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          if (uUvRegion.z == 0.0 || uUvRegion.w == 0.0) {
            discard;
          }

          vec2 sampledUv = vUv * uUvRegion.zw + uUvRegion.xy;
          vec4 texColor = texture2D(uMap, sampledUv);

          // Original developer's forceBlackInk luminance-to-alpha threshold
          float luminance = dot(texColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          float alphaMask = 1.0 - smoothstep(0.35, 0.75, luminance);
          
          float finalAlpha = texColor.a * alphaMask;
          if (finalAlpha < 0.05) {
            discard;
          }

          gl_FragColor = vec4(vec3(uColor), finalAlpha);
        }
      `}
    />
  );
};

// ── Multi-Sprite Face System ──────────────────────────────────────────────────

interface MultiSpriteFaceProps {
  name?: string;
  email?: string;
  sphereRadius: number;
  autoBlink: boolean;
  allowAnim: boolean;
  mouseTracking: boolean;
  face: string;
  eyeSize: number;
  eyeDistance: number;
  breathing: boolean;
  inkColor: string;
}

const MultiSpriteFace: React.FC<MultiSpriteFaceProps> = ({
  name,
  email,
  sphereRadius,
  autoBlink,
  allowAnim,
  mouseTracking,
  face,
  eyeSize,
  eyeDistance,
  breathing,
  inkColor,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  const [faceTexture, setFaceTexture] = useState<THREE.Texture | null>(null);
  const [atlasData, setAtlasData] = useState<any>(null);

  // Animation states
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [mouthState, setMouthState] = useState<boolean>(false);

  const nextBlinkTimeRef = useRef<number>(Date.now() + 2500);
  const nextMouthTimeRef = useRef<number>(0);

  const sphereWorldPos = useRef(new THREE.Vector3());
  const mouseWorldPos = useRef(new THREE.Vector3());
  const raycasterRef = useRef(new THREE.Raycaster());
  const targetPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  // Personality noise state per sphere (tracks mouse vs wandering/distracted)
  const personalityRef = useRef<{
    tracksMouse: boolean;
    nextLookChangeTime: number;
    idleTargetX: number;
    idleTargetY: number;
    idleRotX: number;
    idleRotY: number;
  } | null>(null);

  if (!personalityRef.current) {
    const tracksMouse = Math.random() < 0.65;
    personalityRef.current = {
      tracksMouse,
      nextLookChangeTime: Date.now() + Math.random() * 3000,
      idleTargetX: (Math.random() - 0.5) * 0.5,
      idleTargetY: (Math.random() - 0.5) * 0.4,
      idleRotX: (Math.random() - 0.5) * 0.35,
      idleRotY: (Math.random() - 0.5) * 0.45,
    };
  }

  // 1. Load face-atlas.json
  useEffect(() => {
    fetch("/sphere/face-atlas.json")
      .then((res) => res.json())
      .then((data) => {
        setAtlasData(data);
      })
      .catch((err) => {
        console.error("Failed to load face atlas JSON:", err);
      });
  }, []);

  // 2. Load face.ktx2
  useEffect(() => {
    const loader = new KTX2Loader();
    loader.setTranscoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/basis/",
    );

    try {
      loader.detectSupport(gl);
      loader.load(
        "/sphere/face.ktx2",
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.needsUpdate = true;

          setFaceTexture(tex);
        },
        undefined,
        () => {
          createProceduralFallback();
        },
      );
    } catch (err) {
      console.warn("KTX2 loader fallback:", err);
      createProceduralFallback();
    }

    return () => {
      loader.dispose();
    };
  }, [gl]);

  const createProceduralFallback = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, 512, 512);

      // Eye Sprite (White circle on black background)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(128, 384, 60, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Closed Blink Sprite
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(384, 384, 50, 0, Math.PI * 2);
      ctx.fill();

      // Mouth Sprite
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(128, 128, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    setFaceTexture(tex);
  };

  // Helper function to convert JSON UV format to flipped KTX2 UV space
  const convertUV = (e: any): UVRegion => {
    if (!e) return { offsetX: 0, offsetY: 0, repeatX: 0, repeatY: 0 };
    return {
      offsetX: e.uvOffsetX,
      offsetY: 1 - e.uvOffsetY,
      repeatX: e.uvRepeatX,
      repeatY: -e.uvRepeatY,
    };
  };

  // 3. Resolve active eye & mouth UV configs
  const activeFace = atlasData?.faces.find((f: any) => f.family === face);

  // Resolve eye configuration (with L family override to B)
  let eyeConfig = activeFace?.eye;
  if (face === "L") {
    const familyB = atlasData?.faces.find((f: any) => f.family === "B");
    if (familyB?.eye) {
      eyeConfig = familyB.eye;
    }
  }

  // Handle blink transition
  if (isBlinking && activeFace?.eyeAnim && face !== "G") {
    eyeConfig = activeFace.eyeAnim;
  }

  // Resolve mouth configuration
  let mouthConfig = activeFace?.mouth;
  if (mouthState && activeFace?.mouthAnim && face !== "G") {
    mouthConfig = activeFace.mouthAnim;
  }

  // Map to final UVs and aspect ratios
  const eyeUV = convertUV(eyeConfig);
  const mouthUV = convertUV(mouthConfig);
  const eyeAspect = eyeConfig?.aspectRatio || 1.0;
  const mouthAspect = mouthConfig?.aspectRatio || 1.0;
  const hasMouth = !!mouthConfig;

  // Frame Loop: Blink, Breathing, Cursor Tracking, Mouth Talk Jitter
  useFrame(({ pointer, clock, camera }) => {
    const time = clock.getElapsedTime();
    const now = Date.now();

    // Auto-blink logic
    if (autoBlink) {
      if (!isBlinking && now > nextBlinkTimeRef.current) {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          nextBlinkTimeRef.current = Date.now() + 2500 + Math.random() * 3000;
        }, 130);
      }
    } else {
      if (isBlinking) setIsBlinking(false);
    }

    // Mouth animation jitter (looks like chattering / talking)
    if (allowAnim && activeFace?.mouthAnim && face !== "G") {
      if (time > nextMouthTimeRef.current) {
        setMouthState((prev) => !prev);
        nextMouthTimeRef.current = time + 0.15 + Math.random() * 0.35;
      }
    } else {
      if (mouthState) setMouthState(false);
    }

    // Breathing Animation
    if (breathing && groupRef.current) {
      const breathScale = 1.0 + Math.sin(time * 2.2) * 0.015;
      groupRef.current.scale.set(breathScale, breathScale, breathScale);
    } else if (groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);
    }

    // Organic Personality Noise & Look-Around Logic
    const personality = personalityRef.current;
    if (personality && now > personality.nextLookChangeTime) {
      personality.idleTargetX = (Math.random() - 0.5) * 0.5;
      personality.idleTargetY = (Math.random() - 0.5) * 0.4;
      personality.idleRotX = (Math.random() - 0.5) * 0.35;
      personality.idleRotY = (Math.random() - 0.5) * 0.45;

      // Occasionally switch attention mode
      if (Math.random() < 0.25) {
        personality.tracksMouse = !personality.tracksMouse;
      }

      personality.nextLookChangeTime = now + 2500 + Math.random() * 3500;
    }

    // Cursor Tracking & Face Turn Animation (X/Y Rotation Noise)
    if (groupRef.current) {
      let targetX = 0;
      let targetY = 0;
      let targetRotX = 0;
      let targetRotY = 0;

      const isCurrentlyTracking = mouseTracking && personality?.tracksMouse;

      if (isCurrentlyTracking) {
        groupRef.current.getWorldPosition(sphereWorldPos.current);

        targetPlane.current.set(
          new THREE.Vector3(0, 0, 1),
          -sphereWorldPos.current.z,
        );

        const activePointer =
          globalWindowPointer.x !== 999
            ? globalWindowPointer
            : pointer.x !== -1 || pointer.y !== -1
              ? pointer
              : null;

        let hit = false;
        if (activePointer) {
          raycasterRef.current.setFromCamera(activePointer, camera);
          hit = !!raycasterRef.current.ray.intersectPlane(
            targetPlane.current,
            mouseWorldPos.current,
          );
        }

        if (hit) {
          const dx = mouseWorldPos.current.x - sphereWorldPos.current.x;
          const dy = mouseWorldPos.current.y - sphereWorldPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxOffset = 0.15;
          const factor = Math.min(dist * 0.25, maxOffset) / (dist || 0.001);

          targetX = dx * factor;
          targetY = dy * factor;

          // Slight 3D face turn toward cursor
          targetRotY = Math.max(-0.4, Math.min(0.4, dx * 0.15));
          targetRotX = Math.max(-0.3, Math.min(0.3, -dy * 0.15));
        }
      } else {
        // Distracted / Wandering face rotation and position noise
        targetX = personality ? personality.idleTargetX : 0;
        targetY = personality ? personality.idleTargetY : 0;
        targetRotX = personality ? personality.idleRotX : 0;
        targetRotY = personality ? personality.idleRotY : 0;
      }

      groupRef.current.position.x +=
        (targetX - groupRef.current.position.x) * 0.08;
      groupRef.current.position.y +=
        (targetY - groupRef.current.position.y) * 0.08;

      groupRef.current.rotation.x +=
        (targetRotX - groupRef.current.rotation.x) * 0.06;
      groupRef.current.rotation.y +=
        (targetRotY - groupRef.current.rotation.y) * 0.06;
    }
  });

  // Deterministic personalized face proportions based on name and email (correlated with sphere scale)
  const faceProportions = React.useMemo(() => {
    const factors = getSphereRandomFactors(name, email);

    const finalEyeH = eyeSize * factors.eyeScale;
    const finalEyeW = finalEyeH * eyeAspect;

    // Minimum inner gap between eyes so they never collide or get too close when small
    const minInnerGap = 0.22;
    const finalEyeDistance = Math.max(
      eyeDistance + factors.spacingVariation,
      finalEyeW + minInnerGap,
    );

    // Subtle eye vertical level variation
    const eyeY = 0.15 + factors.eyeYOffset;

    const finalMouthH = eyeSize * 1.1 * factors.mouthScale;
    const finalMouthW = finalMouthH * mouthAspect;

    // Mouth vertical position stays comfortably spaced below the eyes
    const mouthY =
      eyeY -
      (finalEyeH * 0.5 + finalMouthH * 0.5 + 0.14 + factors.mouthYOffset);

    return {
      finalEyeW,
      finalEyeH,
      leftX: -finalEyeDistance / 2,
      rightX: finalEyeDistance / 2,
      eyeY,
      finalMouthW,
      finalMouthH,
      mouthY,
    };
  }, [name, email, eyeSize, eyeDistance, eyeAspect, mouthAspect]);

  const surfaceZ = sphereRadius + 0.025;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Left Eye */}
      <mesh position={[faceProportions.leftX, faceProportions.eyeY, surfaceZ]}>
        <planeGeometry
          args={[faceProportions.finalEyeW, faceProportions.finalEyeH]}
        />
        <FaceSpriteMaterial
          texture={faceTexture}
          uvRegion={eyeUV}
          color={inkColor}
        />
      </mesh>

      {/* Right Eye */}
      <mesh position={[faceProportions.rightX, faceProportions.eyeY, surfaceZ]}>
        <planeGeometry
          args={[faceProportions.finalEyeW, faceProportions.finalEyeH]}
        />
        <FaceSpriteMaterial
          texture={faceTexture}
          uvRegion={eyeUV}
          color={inkColor}
        />
      </mesh>

      {/* Mouth */}
      {hasMouth && (
        <mesh position={[0, faceProportions.mouthY, surfaceZ]}>
          <planeGeometry
            args={[faceProportions.finalMouthW, faceProportions.finalMouthH]}
          />
          <FaceSpriteMaterial
            texture={faceTexture}
            uvRegion={mouthUV}
            color={inkColor}
          />
        </mesh>
      )}
    </group>
  );
};

// ── Model Component ───────────────────────────────────────────────────────────

export interface ModelProps extends Omit<ThreeElements["group"], "ref"> {
  name: string;
  message: string;
  email: string;
  roughness: number;
  metalness: number;
  autoRotate: boolean;
  autoBlink: boolean;
  allowAnim: boolean;
  mouseTracking: boolean;
  face: string;
  eyeSize: number;
  eyeDistance: number;
  breathing: boolean;
  inkColor: string;
  baseRadius?: number;
  diffuseType: string;
  normalType: string;
  fresnelDark?: number;
  fresnelWhite?: number;
  sunX?: number;
  sunY?: number;
  sunZ?: number;
}

export const CustomSphere = React.forwardRef<THREE.Group, ModelProps>(
  (
    {
      name,
      message,
      email,
      roughness,
      metalness,
      autoRotate,
      autoBlink,
      allowAnim,
      mouseTracking,
      face,
      eyeSize,
      eyeDistance,
      breathing,
      inkColor,
      baseRadius = 1.8,
      diffuseType,
      normalType,
      fresnelDark = 0.0,
      fresnelWhite = 0.8,
      sunX = 1.0,
      sunY = 1.0,
      sunZ = 1.0,
      ...groupProps
    },
    ref,
  ) => {
    const localRef = useRef<THREE.Group>(null);
    const sphereRadius = baseRadius;

    useFrame((_, delta) => {
      if (autoRotate && localRef.current) {
        localRef.current.rotation.y += delta * 0.4;
      }
    });

    const setRef = (node: THREE.Group | null) => {
      (localRef as any).current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as any).current = node;
      }
    };

    return (
      <group ref={setRef} {...groupProps}>
        {/* 1. Base Sphere Mesh */}
        <SphereModel
          sphereRadius={sphereRadius}
          email={email}
          roughness={roughness}
          metalness={metalness}
          diffuseType={diffuseType}
          normalType={normalType}
          fresnelDark={fresnelDark}
          fresnelWhite={fresnelWhite}
          sunX={sunX}
          sunY={sunY}
          sunZ={sunZ}
        />

        {/* 2. Multi-Sprite Face System */}
        <MultiSpriteFace
          name={name}
          email={email}
          sphereRadius={sphereRadius}
          autoBlink={autoBlink}
          allowAnim={allowAnim}
          mouseTracking={mouseTracking}
          face={face}
          eyeSize={eyeSize}
          eyeDistance={eyeDistance}
          breathing={breathing}
          inkColor={inkColor}
        />

        {/* 3. Pop Up Message */}
        <Message
          align={Math.random() > 0.5 ? "left" : "right"}
          name={name}
          message={message}
        />
      </group>
    );
  },
);

type SphereModelProps = {
  sphereRadius: number;
  email: string;
  roughness: number;
  metalness: number;
  diffuseType: string;
  normalType: string;
  fresnelDark?: number;
  fresnelWhite?: number;
  sunX?: number;
  sunY?: number;
  sunZ?: number;
};

const SphereModel = ({
  sphereRadius,
  email,
  roughness,
  metalness,
  diffuseType: type,
  normalType,
  fresnelDark = 0.0,
  fresnelWhite = 0.8,
  sunX = 1.0,
  sunY = 1.0,
  sunZ = 1.0,
}: SphereModelProps) => {
  const sphereModel = useGLTF("/models/test-sphere.glb");
  const sphereGeo = (sphereModel.scene.children[0] as THREE.Mesh).geometry;

  const ringTex = useRingDistordTexture();
  const location = useLocation();

  const [diffuseTexture, normalTexture] = useTexture([
    "/sphere/diffuse.png",
    "/sphere/Normal.png",
  ]);
  diffuseTexture.colorSpace = THREE.SRGBColorSpace;
  diffuseTexture.wrapS = diffuseTexture.wrapT = THREE.RepeatWrapping;
  diffuseTexture.minFilter = diffuseTexture.magFilter = THREE.LinearFilter;

  normalTexture.colorSpace = THREE.NoColorSpace;
  normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.minFilter = normalTexture.magFilter = THREE.LinearFilter;

  const offsets: Record<string, THREE.Vector2> = {
    A: new THREE.Vector2(0.0, 0.5), // top-left
    B: new THREE.Vector2(0.5, 0.5), // top-right
    C: new THREE.Vector2(0.0, 0.0), // bottom-left
    D: new THREE.Vector2(0.5, 0.0), // bottom-right
  };

  let seed = 4; // change it to (3) only if and only if things turn out good

  if (location.pathname === "/nfc") {
    // seed = 230;
    // seed = 15;
    // seed = 15;
  } else if (location.pathname === "/faq") {
    seed = 121;
  }

  const [colorA, colorB] = generateColorPair(`${email} ${type}`, 1, seed);

  const pageKey = (routeSphereMap[location.pathname] ||
    "Home") as keyof typeof pageColor;
  const activePageColor = pageColor[pageKey] || pageColor.Home;
  const pageColorA = useRef(new THREE.Color(activePageColor.colorA));

  const uniforms = useRef({
    uDiffuseTexture: { value: diffuseTexture },
    uNormalTexture: { value: normalTexture },
    uDiffuseType: { value: offsets[type] || offsets.A },
    uNormalType: { value: offsets[normalType] || offsets.A },
    uColorA: { value: colorA },
    uColorB: { value: colorB },
    uRingTex: { value: ringTex },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uFresnelDark: { value: fresnelDark },
    uFresnelWhite: { value: fresnelWhite },
    uSunDirection: { value: new THREE.Vector3(sunX, sunY, sunZ) },
    uPageColorA: { value: pageColorA.current },
  });

  useFrame(() => {
    uniforms.current.uRingTex.value = ringTex;
    uniforms.current.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );
    uniforms.current.uFresnelDark.value = fresnelDark;
    uniforms.current.uFresnelWhite.value = fresnelWhite;
    uniforms.current.uSunDirection.value.set(sunX, sunY, sunZ);

    const currentKey = (routeSphereMap[location.pathname] ||
      "Home") as keyof typeof pageColor;
    const currentTheme = pageColor[currentKey] || pageColor.Home;
    pageColorA.current.set(currentTheme.colorA);
  });

  return (
    <mesh
      castShadow
      receiveShadow
      position-z={-0.1}
      geometry={sphereGeo}
      scale={sphereRadius}
      rotation={[0, 0, 0]}
    >
      <CustomShaderMaterial
        baseMaterial={THREE.MeshStandardMaterial}
        // color={sphereColor}
        // roughness={roughness}
        roughness={1}
        metalness={metalness}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
      />
    </mesh>
  );
};

const vertexShader = `
    varying vec2 vUv;
    varying float vRing;

    
    uniform sampler2D uRingTex;
    uniform vec2 uResolution;

    void main() {

      vec4 clipPos = projectionMatrix * modelViewMatrix * vec4( csm_Position, 1.0 );

      vec2 ndcPos = clipPos.xy / clipPos.w;
      vec2 screenUv = ndcPos * 0.5 + 0.5;

      vec4 ring = texture2D(uRingTex, screenUv);
      float ringMask    = ring.a > 0.5 ? ring.b : 0.0;
      vec2  ringDistord = ring.rg * 2.0 - 1.0;  // decode displacement

      // csm_Position.xyz *= (1. - ringMask * 0.1); // Scale
      csm_Position.xy += ringDistord * ringMask * 2.;

      vUv = uv;
      vRing = ringMask;
    }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vRing;

  uniform vec2 uDiffuseType;
  uniform vec2 uNormalType;

  uniform sampler2D uDiffuseTexture;
  uniform sampler2D uNormalTexture;
  uniform sampler2D uRingTex;
  uniform vec2 uResolution;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  uniform float uFresnelDark;
  uniform float uFresnelWhite;
  uniform vec3 uSunDirection;
  uniform vec3 uPageColorA;

  // Boosts colour saturation: factor > 1 = more vivid, 0 = grayscale
  vec3 saturateColor(vec3 c, float factor) {
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(lum), c, factor);
  }

  vec3 applyNormalMap(vec3 geomNormal, vec3 normColor, vec2 uv, vec3 viewPos) {
    vec3 mapN = normColor * 2.0 - 1.0;

    vec3 dp1 = dFdx(viewPos);
    vec3 dp2 = dFdy(viewPos);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);

    vec3 N = normalize(geomNormal);
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);

    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    float det = max(dot(T, T), dot(B, B));
    if (det == 0.0) return N;
    float scale = inversesqrt(det);

    mat3 tbn = mat3(T * scale, B * scale, N);
    return normalize(tbn * mapN);
  }

  void main() {
    // diffuse atlas UV (2x2 grid, scale by 0.5)
    vec2 diffuseUV = fract(vUv) * 0.5 + uDiffuseType;

    vec4 diffuseSample = texture2D(
      uDiffuseTexture,
      diffuseUV
    );
    diffuseSample.r = 1. - pow(1. - diffuseSample.r, 2.5);

    // vec3 color = diffuseSample.r < 0.5 ? uColorA : uColorB;
    vec3 color = mix(uColorA, uColorB, diffuseSample.r);

    // Boost saturation so the diffuse texture averaging
    // doesn't wash the hue out to gray.
    color = saturateColor(color, 2.5);

    vec3 sphereNormal = normalize(vNormal);
    vec3 viewDirection = normalize(vViewPosition);

    float sunOrientation = max(0.0, dot(normalize(uSunDirection), sphereNormal));

    // Edge Blur
    float fresnel = dot(sphereNormal, viewDirection);
    fresnel = smoothstep(uFresnelDark, uFresnelWhite, fresnel);
    fresnel = fresnel * sunOrientation;
    float edge = 1. - fresnel;

    // color = mix(color, uPageColorA, fresnel);

    float edgeBoost = 0.05 + (0.2 * pow(vRing, 1.));

    color += vec3(1., 1., 1.) * edge * edgeBoost;

    csm_DiffuseColor = vec4(vec3(color), 1.0);

    // normal atlas UV (2x2 grid, scale by 0.5)
    vec2 normalUV = fract(vUv) + uNormalType;

    vec3 normalColor = texture2D(
      uNormalTexture,
      normalUV
    ).rgb;

    csm_FragNormal = applyNormalMap(vNormal, normalColor, vUv, -vViewPosition);
  }
`;

useGLTF.preload("/models/test-sphere.glb");
useTexture.preload("/sphere/diffuse.png");
useTexture.preload("/sphere/Normal.png");

export default CustomSphere;
