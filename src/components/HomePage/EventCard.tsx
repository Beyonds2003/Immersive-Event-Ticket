import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useControls, folder, Leva } from "leva";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import VirtualScroll from "virtual-scroll";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useMouse } from "../../libs/useMouse";
import { remapClamp } from "../../libs/remapClamp";
import { remap } from "../../libs/remap";
import { useSpringValue } from "../../libs/useSpringValue";

const EventCard = () => {
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isSnapped, setIsSnapped] = useState<boolean>(true);
  const setTargetScrollRef = useRef<
    ((val: number | ((prev: number) => number)) => void) | null
  >(null);

  // Leva Controls with working Card Width, Height, Gap, and Infinite Loop Guard
  const levaControls = useControls("Spiral & Frame Controls", {
    "1. Helical Spiral Path": folder({
      totalCards: {
        value: 16,
        min: 4,
        max: 40,
        step: 1,
        label: "Total Cards (u2)",
      },
      radius: {
        value: 4.5,
        min: 1.0,
        max: 12.0,
        step: 0.1,
        label: "Spiral Radius (u3)",
      },
      pitch: {
        value: 10.0,
        min: 0.0,
        max: 30.0,
        step: 0.1,
        label: "Pitch Drop (u4)",
      },
    }),
    "Mouse Interaction": folder({
      mouseRadius: {
        value: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Mouse Radius (u8)",
      },
      mouseStrength: {
        value: 0.5,
        min: 0,
        max: 4,
        step: 0.01,
        label: "Mouse Strength (u5)",
      },
    }),
    "Card Dimensions & Spacing": folder({
      cardGap: {
        value: 1.7,
        min: 0.1,
        max: 5.0,
        step: 0.05,
        label: "Card Gap / Spacing",
      },
      cardWidth: {
        value: 2.4,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Card Width",
      },
      cardHeight: {
        value: 2,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Card Height",
      },
      cardScale: {
        value: 0.9,
        min: 0.3,
        max: 3.0,
        step: 0.05,
        label: "Overall Scale (u9)",
      },
    }),
    "2. Local Coordinate Frame": folder({
      twist: {
        value: 0.4,
        min: 0.0,
        max: 3.0,
        step: 0.05,
        label: "Twist Angle (u7)",
      },
      tangentMixFactor: {
        value: 0.32,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Tangent Mix (u6)",
      },
      tangentMixX: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Tangent Mix X (u5.x)",
      },
      tangentMixY: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Tangent Mix Y (u5.y)",
      },
      tangentMixZ: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Tangent Mix Z (u5.z)",
      },
      upMixX: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Up Mix X (u8.x)",
      },
      upMixY: {
        value: 1.0,
        min: -1.0,
        max: 2.0,
        step: 0.1,
        label: "Up Mix Y (u8.y)",
      },
      upMixZ: {
        value: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.1,
        label: "Up Mix Z (u8.z)",
      },
    }),
    "Scroll & Snap Physics": folder({
      enableSnap: { value: true, label: "Enable Snap" },
      snapStiffness: {
        value: 0.12,
        min: 0.02,
        max: 0.4,
        step: 0.01,
        label: "Snap Stiffness",
      },
      scrollSensitivity: {
        value: 0.005,
        min: 0.001,
        max: 0.02,
        step: 0.001,
        label: "Scroll Speed",
      },
      infiniteLoop: { value: false, label: "Infinite Loop" },
    }),
    "Visual Styling": folder({
      cardColor: { value: "#6366f1", label: "Card Base Color" },
      activeColor: { value: "#ec4899", label: "Active Highlight" },
      wireframe: { value: false, label: "Wireframe Mode" },
    }),
  });

  return (
    <>
      <Scene
        controls={levaControls}
        onCardChange={setActiveCardIndex}
        onSnapChange={setIsSnapped}
        setTargetScrollRef={setTargetScrollRef}
      />
    </>
  );
};

// Scene Canvas Wrapper
const Scene = ({
  controls,
  onCardChange,
  onSnapChange,
  setTargetScrollRef,
}: {
  controls: any;
  onCardChange: (index: number) => void;
  onSnapChange: (snapped: boolean) => void;
  setTargetScrollRef: React.MutableRefObject<any>;
}) => {
  return (
    <>
      {/* <ambientLight intensity={1.5} />
      <directionalLight position={[5, 8, 5]} intensity={2.0} /> */}

      <SpiralModel
        controls={controls}
        onCardChange={onCardChange}
        onSnapChange={onSnapChange}
        setTargetScrollRef={setTargetScrollRef}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </>
  );
};

// Instanced Mesh running GLSL Steps 1 & 2
const SpiralModel = ({
  controls,
  onCardChange,
  onSnapChange,
  setTargetScrollRef,
}: {
  controls: any;
  onCardChange: (index: number) => void;
  onSnapChange: (snapped: boolean) => void;
  setTargetScrollRef: React.MutableRefObject<any>;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const scrollProgress = useRef<number>(0);
  const targetScroll = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const isInteracting = useRef<boolean>(false);
  const dragStartY = useRef<number>(0);
  const dragStartScroll = useRef<number>(0);

  const prevCardIndex = useRef<number>(-1);
  const prevSnapped = useRef<boolean>(true);

  const { gl } = useThree();
  const { coords, updateMouse } = useMouse();

  // Spring physics for uScrollSpeed uniform
  const { tick: springTick } = useSpringValue("Spring Physics");

  const clampTarget = useCallback(
    (val: number) => {
      if (!controls.infiniteLoop) {
        const maxIndex = Math.max(0, controls.totalCards - 1);
        return Math.max(0, Math.min(maxIndex, val));
      }
      return val;
    },
    [controls.infiniteLoop, controls.totalCards],
  );

  // Handle external button updates
  useEffect(() => {
    setTargetScrollRef.current = (val: number | ((prev: number) => number)) => {
      const nextVal =
        typeof val === "function" ? val(targetScroll.current) : val;
      targetScroll.current = clampTarget(nextVal);
      isInteracting.current = true;
      lastScrollTime.current = performance.now();
    };
  }, [clampTarget, setTargetScrollRef]);

  // Virtual Scroll + Drag + Keyboard Handlers
  useEffect(() => {
    const scroller = new VirtualScroll({
      mouseMultiplier: 0.45,
      touchMultiplier: 1.5,
      firefoxMultiplier: 15,
    });

    scroller.on((event: any) => {
      const nextVal =
        targetScroll.current + event.deltaY * controls.scrollSensitivity * -0.5;
      targetScroll.current = clampTarget(nextVal);
      isInteracting.current = true;
      lastScrollTime.current = performance.now();
    });

    const domElement = gl.domElement;

    // Drag Interaction
    const handlePointerDown = (e: PointerEvent) => {
      dragStartY.current = e.clientY;
      dragStartScroll.current = targetScroll.current;
      domElement.style.cursor = "grabbing";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta =
          (moveEvent.clientY - dragStartY.current) *
          (controls.scrollSensitivity * 2.5);
        targetScroll.current = clampTarget(dragStartScroll.current - delta);
        isInteracting.current = true;
        lastScrollTime.current = performance.now();
      };

      const handlePointerUp = () => {
        domElement.style.cursor = "grab";
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    };

    domElement.style.cursor = "grab";
    domElement.addEventListener("pointerdown", handlePointerDown);

    // Keyboard Arrow Keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        targetScroll.current = clampTarget(
          Math.round(targetScroll.current - 1),
        );
        isInteracting.current = true;
        lastScrollTime.current = performance.now();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        targetScroll.current = clampTarget(
          Math.round(targetScroll.current + 1),
        );
        isInteracting.current = true;
        lastScrollTime.current = performance.now();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      scroller.destroy();
      domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clampTarget, controls.scrollSensitivity, gl]);

  // Shader Uniforms setup
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTotalCards: { value: controls.totalCards },
      uRadius: { value: controls.radius },
      uPitch: { value: controls.pitch },
      uCardWidth: { value: controls.cardWidth },
      uCardHeight: { value: controls.cardHeight },
      uCardGap: { value: controls.cardGap },
      uTangentMix: {
        value: new THREE.Vector3(
          controls.tangentMixX,
          controls.tangentMixY,
          controls.tangentMixZ,
        ),
      },
      uTangentMixFactor: { value: controls.tangentMixFactor },
      uTwist: { value: controls.twist },
      uUpMix: {
        value: new THREE.Vector3(
          controls.upMixX,
          controls.upMixY,
          controls.upMixZ,
        ),
      },
      uCardScale: { value: controls.cardScale },
      uInfinite: { value: controls.infiniteLoop ? 1.0 : 0.0 },
      uCardColor: { value: new THREE.Color(controls.cardColor) },
      uActiveColor: { value: new THREE.Color(controls.activeColor) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseRadius: { value: controls.mouseRadius },
      uMouseStrength: { value: controls.mouseStrength },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uScrollSpeed: { value: 0 },
    }),
    [],
  );

  // Synchronize uniforms on Leva GUI tweak
  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uTotalCards.value = controls.totalCards;
    u.uRadius.value = controls.radius;
    u.uPitch.value = controls.pitch;
    u.uCardWidth.value = controls.cardWidth;
    u.uCardHeight.value = controls.cardHeight;
    u.uCardGap.value = controls.cardGap;
    u.uTangentMix.value.set(
      controls.tangentMixX,
      controls.tangentMixY,
      controls.tangentMixZ,
    );
    u.uTangentMixFactor.value = controls.tangentMixFactor;
    u.uTwist.value = controls.twist;
    u.uUpMix.value.set(controls.upMixX, controls.upMixY, controls.upMixZ);
    u.uCardScale.value = controls.cardScale;
    u.uInfinite.value = controls.infiniteLoop ? 1.0 : 0.0;
    u.uCardColor.value.set(controls.cardColor);
    u.uActiveColor.value.set(controls.activeColor);
    materialRef.current.wireframe = controls.wireframe;
  }, [controls]);

  // Physics Loop & Snapping Logic
  useFrame(() => {
    updateMouse();

    const now = performance.now();

    // Enforce boundary guard on targetScroll when infiniteLoop is false
    if (!controls.infiniteLoop) {
      targetScroll.current = clampTarget(targetScroll.current);
    }

    // Snap to nearest integer index when scroll stops
    if (controls.enableSnap && now - lastScrollTime.current > 140) {
      const nearestInteger = clampTarget(Math.round(targetScroll.current));
      targetScroll.current += (nearestInteger - targetScroll.current) * 0.15;
    }

    // Lerp progress smoothly
    const delta =
      (targetScroll.current - scrollProgress.current) * controls.snapStiffness;
    const scrollSpeed = targetScroll.current - scrollProgress.current;
    scrollProgress.current += delta;

    if (!controls.infiniteLoop) {
      scrollProgress.current = clampTarget(scrollProgress.current);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = scrollProgress.current;
    }

    // Active Card Index calculation
    const total = Math.max(1, controls.totalCards);
    let cardIndex = Math.round(scrollProgress.current) % total;
    if (cardIndex < 0) cardIndex += total;

    // Only fire React state update when active card actually changes
    if (prevCardIndex.current !== cardIndex) {
      prevCardIndex.current = cardIndex;
      onCardChange(cardIndex);
    }

    // Only fire React state update when snap status actually changes
    const currentSnapped =
      Math.abs(targetScroll.current - Math.round(targetScroll.current)) < 0.05;
    if (prevSnapped.current !== currentSnapped) {
      prevSnapped.current = currentSnapped;
      onSnapChange(currentSnapped);
    }

    // Mouse Interaction
    const mouseX = coords.x;
    const mouseY = coords.y;
    materialRef.current.uniforms.uMouse.value.set(mouseX, mouseY);
    materialRef.current.uniforms.uMouseRadius.value = controls.mouseRadius;
    materialRef.current.uniforms.uMouseStrength.value = controls.mouseStrength;

    materialRef.current.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );

    // Drive uScrollSpeed through spring physics for a bounce effect:
    // positive scroll → value rises to peak → overshoots negative → rests at 0
    materialRef.current.uniforms.uScrollSpeed.value = springTick(
      scrollSpeed,
      1 / 60,
    );
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, controls.totalCards]}
      frustumCulled={false}
      position={[0, 0, -2.5]}
    >
      <planeGeometry args={[1.0, 1.0, 50, 50]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

// -----------------------------------------------------------
// Vertex Shader: Fixed Gap Spacing Math along Helical Path
// -----------------------------------------------------------
const vertexShader = `
uniform float uProgress;
uniform float uTotalCards;
uniform float uRadius;
uniform float uPitch;
uniform float uCardWidth;
uniform float uCardHeight;
uniform float uCardGap;
uniform vec3  uTangentMix;
uniform float uTangentMixFactor;
uniform float uTwist;
uniform vec3  uUpMix;
uniform float uCardScale;
uniform float uInfinite;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform vec2 uResolution;
uniform float uScrollSpeed;

varying vec2 vUv;
varying float vRelPos;
varying float vCardIndex;
varying vec3 vNormal;
varying float vInfluence;

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;

void main() {
    vUv = uv;
    float id = float(gl_InstanceID);
    vCardIndex = id;

    // Card offset along the spiral path (index delta * uCardGap)
    float cardOffset = (id - uProgress) * uCardGap;
    if (uInfinite > 0.5) {
        float halfExtent = uTotalCards * 0.5 * uCardGap;
        cardOffset = mod(cardOffset + halfExtent, uTotalCards * uCardGap) - halfExtent;
    }
    vRelPos = cardOffset;

    // ========================================================
    // STEP 1: Helical Spiral Path Mapping with Gap Spacing
    // ========================================================
    // Angle theta (spiralAngle) - cardOffset drives angular & vertical spacing
    float spiralAngle = HALF_PI - ((cardOffset * TWO_PI) / uTotalCards);
    float cosTheta = cos(spiralAngle);
    float sinTheta = sin(spiralAngle);

    // Base tangent direction
    vec3 baseTangent = vec3(sinTheta, 0.0, -cosTheta);
    vec3 mixedTangent = mix(baseTangent, uTangentMix, uTangentMixFactor);

    // Center position along spiral
    vec3 spiralCenter = vec3(cosTheta * uRadius, -(cardOffset * uPitch) / uTotalCards, sinTheta * uRadius);

    // ========================================================================
    // STEP 2: Local Coordinate Frame & Width / Height Scaling
    // ========================================================================
    float focusFactor = 1.0 - smoothstep(0.0, 1.8 * uCardGap, abs(cardOffset));
    float pitchTerm = -atan(uPitch / (uRadius * 6.283185307179586));
    float twistAngle = (pitchTerm * uTwist) * (1.0 - focusFactor);
    float cosTwist = cos(twistAngle);
    vec3 mixedUpDir = mix(vec3(0.0, 1.0, 0.0), uUpMix, cosTwist);
    float sinTwist = sin(twistAngle);

    // Orientation TBN Frame Vectors:
    vec3 localRight = (mixedTangent * vec3(cosTwist)) + (mixedUpDir * vec3(sinTwist));
    vec3 localUp    = (mixedUpDir * vec3(cosTwist)) - (mixedTangent * vec3(sinTwist));
    vec3 localNormal = cross(localRight, localUp);
    vNormal = normalize(localNormal);


    // Apply cardWidth, cardHeight, and uCardScale
    vec3 finalPosition = spiralCenter 
                       + localRight * (position.x * uCardWidth  * uCardScale)
                       + localUp    * (position.y * uCardHeight * uCardScale);
                       
    // Active Magnification (Scale)
    finalPosition *= 1. + (focusFactor * 0.05);


    vec4 worldPos = modelMatrix * vec4(finalPosition, 1.0);
    vec4 viewPos = viewMatrix * worldPos;
    vec4 clipPos = projectionMatrix * viewPos;

    // Mouse Interaction
    // NDC (-1..1)
    vec2 ndc = clipPos.xy / clipPos.w;

    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);

    vec2 delta = uMouse - ndc;

    float distanceToMouse = length(delta * aspect);
    vec2 direction = delta / max(length(delta), 0.025);
    float influence =  1. - smoothstep(uMouseRadius, -0., distanceToMouse);

    influence = influence * ((1. - influence) * uMouseStrength);
    influence = clamp(influence, 0.0, 1.0);

    worldPos.z += (1. - influence) * focusFactor * 1.;

    vInfluence = 1. - influence;

    // Scroll Wobble
    float focusFactor2 = 1.0 - smoothstep(0.0, 0.8 * uCardGap, abs(cardOffset));
    worldPos.x += sin(uv.y * PI) * 2. * uScrollSpeed * 0.25 * (focusFactor2 * 0.5);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

// ----------------------------------------------------
// Fragment Shader: Clean Card Visuals & Highlight
// ----------------------------------------------------
const fragmentShader = `
uniform vec3 uCardColor;
uniform vec3 uActiveColor;

varying vec2 vUv;
varying float vRelPos;
varying float vCardIndex;
varying vec3 vNormal;
varying float vInfluence;

void main() {
    vec2 uv = vUv;

    // Card edge border
    vec2 edge = abs(uv - 0.5) * 2.0;
    float border = step(0.92, edge.x) + step(0.94, edge.y);

    // Highlight active centered card
    float activeFactor = 1.0 - smoothstep(0.0, 1.5, abs(vRelPos));
    vec3 baseCol = mix(uCardColor, uActiveColor, activeFactor);

    // Lighting shading
    vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
    float diff = max(0.3, dot(vNormal, lightDir));
    vec3 finalColor = mix(baseCol * diff, vec3(1.0), border * 0.5);

    // Distance fade
    float fade = smoothstep(12.0, 1.5, abs(vRelPos));

    gl_FragColor = vec4(finalColor, fade);
    // gl_FragColor = vec4(vec3(vInfluence), fade);
}
`;

export default EventCard;
