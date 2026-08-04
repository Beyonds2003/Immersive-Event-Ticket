import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useControls, Leva, folder, button } from "leva";
import * as THREE from "three";
import Model from "./CustomSphere";
import { PhysicsWorld } from "../../libs/PhysicsWorld";
import gsap from "gsap";
import { SPHERE_CONFIGS } from "./SPHERE_CONFIG";
import { alea } from "seedrandom";

// ── Init Sphere Positions (Stacking Layout) ──────────────────────────────────
function initSpherePositions(
  ballState: Float32Array,
  count: number,
  radius: number = 0.65,
  posX: number = 0,
  posY: number = -3.5,
  posZ: number = 0,
  spreadX: number = 1.0,
  spreadY: number = 1.0,
  spreadZ: number = 1.0,
  scaleOffsets?: number[],
) {
  for (let i = 0; i < count; i++) {
    const n = i * 128;
    const rOffset =
      scaleOffsets && scaleOffsets[i] !== undefined ? scaleOffsets[i] : 0;
    const r = radius + rOffset;

    // Stack in an organic alternating staggered column
    const col = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);

    const baseTargetX =
      (col * (radius * 0.25) + Math.sin(i * 1.7) * 0.25) * spreadX;
    const baseTargetY = row * (radius * 1.5) * spreadY;
    const baseTargetZ = Math.cos(i * 2.3) * 0.15 * spreadZ;

    const targetX = posX + baseTargetX;
    const targetY = posY + baseTargetY;
    const targetZ = posZ + baseTargetZ;

    const startX = targetX + (Math.random() - 0.5) * 0.2;
    const startY = targetY + (Math.random() - 0.5) * 0.2;
    const startZ = targetZ;

    ballState[n + 0] = startX;
    ballState[n + 1] = startY;
    ballState[n + 2] = startZ;

    ballState[n + 3] = 0;
    ballState[n + 4] = 0;
    ballState[n + 5] = 0;

    ballState[n + 6] = targetX;
    ballState[n + 7] = targetY;
    ballState[n + 8] = targetZ;

    ballState[n + 9] = r;
    ballState[n + 10] = 1.0;
    ballState[n + 11] = 1.0;

    ballState[n + 12] = startX;
    ballState[n + 13] = startY;
    ballState[n + 14] = startZ;
    ballState[n + 15] = 0;
    ballState[n + 16] = 0;
    ballState[n + 17] = 0;
    ballState[n + 18] = 0;
    ballState[n + 19] = 0;
    ballState[n + 20] = 0;

    ballState[n + 21] = -999;

    ballState[n + 22] = 70.0; // stiffness
    ballState[n + 23] = 0.82; // damping

    ballState[n + 24] = 0;
    ballState[n + 25] = i;

    ballState[n + 26] = 0;
    ballState[n + 27] = 0;
    ballState[n + 28] = 0;
    ballState[n + 29] = 5.0;

    ballState[n + 30] = 0.1;
    ballState[n + 31] = 0.4;
    ballState[n + 32] = 0;
    ballState[n + 33] = 0;
    ballState[n + 34] = 0;
    ballState[n + 35] = 1;

    ballState[n + 36] = 0.0;
    ballState[n + 37] = 1.0;
    ballState[n + 38] = 0.6; // squeeze factor
    ballState[n + 39] = 0.03;
    ballState[n + 40] = 3.0 + Math.random() * 1.5;
    ballState[n + 41] = Math.random() * Math.PI * 2;
    ballState[n + 42] = 0;
    ballState[n + 43] = 1.0;
    ballState[n + 44] = 0;
    ballState[n + 45] = 0;
    ballState[n + 46] = 0;
    ballState[n + 47] = 0;

    const m = n + 48;
    for (let k = 0; k < 16; k++) ballState[m + k] = 0;
    ballState[m + 0] = r;
    ballState[m + 5] = r;
    ballState[m + 10] = r;
    ballState[m + 12] = startX;
    ballState[m + 13] = startY;
    ballState[m + 14] = startZ;
    ballState[m + 15] = 1.0;

    ballState[n + 113] = 1;
  }
}

// ── Physics Scene (lives inside Canvas) ──────────────────────────────────────
interface PhysicsSceneProps {
  sphereCount: number;
  sphereRadius: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
  springForce: number;
  maxDistanceThreshold: number;
  tetherStiffness: number;
  damping: number;
  restitution: number;
  stiffness: number;
  squishDamping: number;
  squeezeFactor: number;
  mouseRadius: number;
  mouseForce: number;
  substeps: number;
  autoBlink: boolean;
  allowAnim: boolean;
  mouseTracking: boolean;
  breathing: boolean;
  eyeSize: number;
  eyeDistance: number;
  inkColor: string;
  obstacleState: "visible" | "invisible" | "remove";
  obstacleWidth: number;
  obstacleHeight: number;
  obstacleDepth: number;
  obstacleX: number;
  obstacleY: number;
  obstacleZ: number;
  endAnimProgress: number;
  pushForce: number;
  delayFactor: number;
  onProgressUpdate: (progress: number) => void;
}

interface EndAnimSphereState {
  scale: number;
  pushDist: number;
  dirX: number;
  dirY: number;
  dirZ: number;
}

const PhysicsScene: React.FC<PhysicsSceneProps> = ({
  sphereCount,
  sphereRadius,
  positionX,
  positionY,
  positionZ,
  spreadX,
  spreadY,
  spreadZ,
  springForce,
  maxDistanceThreshold,
  tetherStiffness,
  damping,
  restitution,
  stiffness,
  squishDamping,
  squeezeFactor,
  mouseRadius,
  mouseForce,
  substeps,
  autoBlink,
  allowAnim,
  mouseTracking,
  breathing,
  eyeSize,
  eyeDistance,
  inkColor,
  obstacleState,
  obstacleWidth,
  obstacleHeight,
  obstacleDepth,
  obstacleX,
  obstacleY,
  obstacleZ,
  endAnimProgress,
  pushForce,
  delayFactor,
  onProgressUpdate,
}) => {
  const { camera } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const physicsWorld = useRef<PhysicsWorld | null>(null);
  const ballState = useRef<Float32Array | null>(null);
  const input = useRef<Float32Array | null>(null);

  const raycaster = useRef(new THREE.Raycaster());
  const zeroPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const mouseWorld = useRef(new THREE.Vector3());

  // @ts-ignore
  const rng = new alea("addy");

  const scaleOffsets = useRef<number[]>(
    Array.from({ length: 100 }, () => rng() * 0.3),
  );

  const introScalesRef = useRef<{ scale: number }[]>([]);
  const endAnimStatesRef = useRef<EndAnimSphereState[]>([]);
  const endAnimTlRef = useRef<gsap.core.Timeline | null>(null);
  const isDisposedRef = useRef(false);
  const [isDisposedState, setIsDisposedState] = useState(false);
  const isInternalUpdateRef = useRef(false);
  const tempScale = useRef(new THREE.Vector3());

  // ── Intro Scale Pop Animation ───────────────────────────────────────────────
  const triggerIntroAnimation = (count: number) => {
    introScalesRef.current.forEach((obj) => gsap.killTweensOf(obj));
    const scales: { scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const obj = { scale: 0 };
      scales.push(obj);
      gsap.to(obj, {
        scale: 1,
        duration: 0.7,
        delay: Math.random() * 0.4,
        ease: "back.out(1.5)",
      });
    }
    introScalesRef.current = scales;
  };

  // ── Cleanup Physics and Geometries ──────────────────────────────────────────
  const cleanUpScene = () => {
    if (isDisposedRef.current) return;
    isDisposedRef.current = true;

    // Traverse and dispose THREE meshes, geometries, and materials
    groupRefs.current.forEach((group) => {
      if (group) {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    });

    groupRefs.current = [];
    if (physicsWorld.current) {
      physicsWorld.current.terminate();
      physicsWorld.current = null;
    }
    ballState.current = null;
    input.current = null;
    setIsDisposedState(true);
  };

  // ── Trigger End Animation from Click Coords ────────────────────────────────
  const triggerEndAnimation = (
    x: number,
    y: number,
    autoPlay: boolean = true,
  ) => {
    if (isDisposedRef.current) {
      isDisposedRef.current = false;
      setIsDisposedState(false);
    }

    const count = Math.min(
      sphereCount,
      ballState.current
        ? Math.floor(ballState.current.length / 128)
        : sphereCount,
    );
    if (count === 0) return null;

    // Unproject NDC click position onto Z=0 plane
    const clickNdc = new THREE.Vector2(x, y);
    raycaster.current.setFromCamera(clickNdc, camera);
    const clickWorld = new THREE.Vector3();
    const hit = raycaster.current.ray.intersectPlane(
      zeroPlane.current,
      clickWorld,
    );
    if (!hit) {
      clickWorld.set(x * 4, y * 4, 0);
    }

    if (endAnimTlRef.current) {
      endAnimTlRef.current.kill();
    }

    const states: EndAnimSphereState[] = [];
    const distances: number[] = [];

    for (let i = 0; i < count; i++) {
      let sx = positionX;
      let sy = positionY;
      let sz = positionZ;

      if (ballState.current) {
        const n = i * 128;
        sx = ballState.current[n + 0];
        sy = ballState.current[n + 1];
        sz = ballState.current[n + 2];
      }

      const dx = sx - clickWorld.x;
      const dy = sy - clickWorld.y;
      const dz = sz - clickWorld.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      distances.push(dist);

      let dirX = 0;
      let dirY = 1;
      let dirZ = 0;
      if (dist > 0.0001) {
        dirX = dx / dist;
        dirY = dy / dist;
        dirZ = dz / dist;
      }

      states.push({
        scale: 1,
        pushDist: 0,
        dirX,
        dirY,
        dirZ,
      });
    }

    endAnimStatesRef.current = states;

    const tl = gsap.timeline({
      paused: !autoPlay,
      onUpdate: () => {
        isInternalUpdateRef.current = true;
        onProgressUpdate(tl.progress());
        isInternalUpdateRef.current = false;
      },
      onComplete: () => {
        if (autoPlay) {
          cleanUpScene();
        }
      },
    });

    for (let i = 0; i < count; i++) {
      const animObj = states[i];
      const delay = distances[i] * delayFactor;

      tl.to(
        animObj,
        {
          scale: 0,
          pushDist: pushForce,
          duration: 0.7,
          ease: "power2.inOut",
        },
        delay,
      );
    }

    endAnimTlRef.current = tl;
    return tl;
  };

  // ── Listen to "ripple-click" CustomEvent ────────────────────────────────────
  useEffect(() => {
    const handleRippleClick = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const x = typeof detail?.x === "number" ? detail.x : 0;
      const y = typeof detail?.y === "number" ? detail.y : 0;
      triggerEndAnimation(x, y, true);
    };

    window.addEventListener("ripple-click", handleRippleClick);
    return () => {
      window.removeEventListener("ripple-click", handleRippleClick);
    };
  }, [
    sphereCount,
    pushForce,
    delayFactor,
    camera,
    positionX,
    positionY,
    positionZ,
  ]);

  // ── Sync Leva endAnimProgress Debug Slider ──────────────────────────────────
  // useEffect(() => {
  //   if (isInternalUpdateRef.current) return;

  //   let tl = triggerEndAnimation(0.34, 0, false);
  //   if (tl) {
  //     tl.pause();
  //     tl.progress(endAnimProgress);
  //   }
  // }, [endAnimProgress, pushForce, delayFactor]);

  useEffect(() => {
    const count = sphereCount;
    physicsWorld.current = new PhysicsWorld(count);

    const state = new Float32Array(count * 128);
    const inp = new Float32Array(256);

    initSpherePositions(
      state,
      count,
      sphereRadius,
      positionX,
      positionY,
      positionZ,
      spreadX,
      spreadY,
      spreadZ,
      scaleOffsets.current,
    );

    inp[0] = count;
    inp[1] = substeps;
    inp[4] = 1.0;
    inp[5] = 0.0;
    inp[6] = damping;
    inp[7] = restitution;
    inp[8] = mouseRadius;
    inp[9] = mouseForce;
    inp[11] = 0.3; // max speed per substep
    inp[12] = 0.0; // Gravity set to 0
    inp[13] = 0.0;
    inp[14] = 0.0;
    inp[15] = 30.0;
    inp[16] = springForce;
    inp[17] = 0.0;
    inp[18] = 0.75;
    inp[19] = 0.0;
    inp[20] = 8;
    inp[21] = 0.0005;
    inp[22] = 5.0;
    inp[28] = 0.0;
    inp[29] = 30.0;

    ballState.current = state;
    input.current = inp;

    physicsWorld.current.initialSeparation(state, inp, 60);

    triggerIntroAnimation(count);

    return () => {
      if (physicsWorld.current) {
        physicsWorld.current.terminate();
        physicsWorld.current = null;
      }
    };
  }, [
    sphereCount,
    sphereRadius,
    positionX,
    positionY,
    positionZ,
    spreadX,
    spreadY,
    spreadZ,
  ]);

  const initialPointer = useRef(new THREE.Vector2(999, 999));

  useFrame(({ pointer, clock, camera }) => {
    if (isDisposedRef.current) return;
    if (!physicsWorld.current || !ballState.current || !input.current) return;

    const mouse = initialPointer.current;

    if (pointer.x !== 0 || pointer.y !== 0) {
      mouse.copy(pointer);
    }

    const state = ballState.current;
    const inp = input.current;
    const count = Math.min(sphereCount, Math.floor(state.length / 128));
    if (count === 0) return;

    inp[0] = count;
    inp[6] = damping;
    inp[7] = restitution;
    inp[8] = mouseRadius;
    inp[9] = mouseForce;
    inp[12] = 0.0;
    inp[16] = springForce / substeps;
    inp[30] = maxDistanceThreshold;
    inp[31] = tetherStiffness / substeps;
    inp[13] = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const n = i * 128;
      const col = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);

      const baseTargetX =
        (col * (sphereRadius * 0.25) + Math.sin(i * 1.7) * 0.25) * spreadX;
      const baseTargetY = row * (sphereRadius * 1.5) * spreadY;
      const baseTargetZ = Math.cos(i * 2.3) * 0.15 * spreadZ;

      state[n + 6] = positionX + baseTargetX;
      state[n + 7] = positionY + baseTargetY;
      state[n + 8] = positionZ + baseTargetZ;

      const rOffset = scaleOffsets.current[i] || 0;
      state[n + 9] = sphereRadius + rOffset;
      state[n + 22] = stiffness;
      state[n + 23] = squishDamping;
      state[n + 38] = squeezeFactor;
    }

    // Configure Obstacle physics in input
    const physicsActive =
      obstacleState === "visible" || obstacleState === "invisible";

    if (physicsActive) {
      inp[17] = 1.0; // enable colliders check
      inp[32] = 1; // 1 box collider
      inp[33] = obstacleX;
      inp[34] = obstacleY;
      inp[35] = obstacleZ;
      inp[36] = obstacleWidth * 0.5;
      inp[37] = obstacleHeight * 0.5;
      inp[38] = obstacleDepth * 0.5;
      inp[39] = 1.0; // active
      inp[40] = 0.0;
    } else {
      inp[17] = 0.0;
      inp[32] = 0;
    }

    raycaster.current.setFromCamera(mouse, camera);
    const hit = raycaster.current.ray.intersectPlane(
      zeroPlane.current,
      mouseWorld.current,
    );
    if (hit) {
      inp[2] = mouseWorld.current.x;
      inp[3] = mouseWorld.current.y;
    }

    physicsWorld.current.step(state, inp);

    // Precise 3D AABB vs Sphere stone collision solver
    if (physicsActive) {
      const bx = obstacleX;
      const by = obstacleY;
      const bz = obstacleZ;
      const hw = obstacleWidth * 0.5;
      const hh = obstacleHeight * 0.5;
      const hd = obstacleDepth * 0.5;

      for (let i = 0; i < count; i++) {
        const n = i * 128;
        const R = state[n + 9];

        const sx = state[n + 0];
        const sy = state[n + 1];
        const sz = state[n + 2];

        // Find closest point on box AABB to sphere center
        const cx = Math.max(bx - hw, Math.min(sx, bx + hw));
        const cy = Math.max(by - hh, Math.min(sy, by + hh));
        const cz = Math.max(bz - hd, Math.min(sz, bz + hd));

        let dx = sx - cx;
        let dy = sy - cy;
        let dz = sz - cz;
        let distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < R * R) {
          let dist = Math.sqrt(distSq);

          if (dist < 1e-4) {
            // Center inside box: push out along closest face
            const ox = hw - Math.abs(sx - bx);
            const oy = hh - Math.abs(sy - by);
            const oz = hd - Math.abs(sz - bz);

            if (ox < oy && ox < oz) {
              const sign = sx >= bx ? 1 : -1;
              state[n + 0] = bx + sign * (hw + R);
              state[n + 3] *= -0.2;
            } else if (oy < ox && oy < oz) {
              const sign = sy >= by ? 1 : -1;
              state[n + 1] = by + sign * (hh + R);
              state[n + 4] *= -0.2;
            } else {
              const sign = sz >= bz ? 1 : -1;
              state[n + 2] = bz + sign * (hd + R);
              state[n + 5] *= -0.2;
            }
          } else {
            // Sphere surface intersects box: resolve collision normal and penetration
            const overlap = R - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            state[n + 0] += nx * overlap;
            state[n + 1] += ny * overlap;
            state[n + 2] += nz * overlap;

            // Reflect/damp velocity
            let vx = state[n + 3];
            let vy = state[n + 4];
            let vz = state[n + 5];
            let vdot = vx * nx + vy * ny + vz * nz;

            if (vdot < 0) {
              state[n + 3] -= nx * vdot * 1.4;
              state[n + 4] -= ny * vdot * 1.4;
              state[n + 5] -= nz * vdot * 1.4;
            }
          }

          // Sync softbody center
          state[n + 12] = state[n + 0];
          state[n + 13] = state[n + 1];
          state[n + 14] = state[n + 2];
        }
      }
    }

    // Sync Three.js groups from physics matrix + end animation push & scale
    for (let i = 0; i < count; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;

      const introObj = introScalesRef.current[i];
      const endObj = endAnimStatesRef.current[i];

      const introScale = introObj ? Math.max(0, introObj.scale) : 1;
      const endScale = endObj ? Math.max(0, endObj.scale) : 1;
      const finalScale = introScale * endScale;

      group.visible = finalScale > 0.0001;

      const offset = i * 128 + 48;
      const mat = state.subarray(offset, offset + 16);
      if (mat.length === 16) {
        group.matrix.fromArray(mat);

        if (endObj && endObj.pushDist > 0) {
          group.matrix.elements[12] += endObj.dirX * endObj.pushDist;
          group.matrix.elements[13] += endObj.dirY * endObj.pushDist;
          group.matrix.elements[14] += endObj.dirZ * endObj.pushDist;
        }

        if (finalScale < 0.999) {
          group.matrix.scale(
            tempScale.current.set(finalScale, finalScale, finalScale),
          );
        }
        group.matrixWorldNeedsUpdate = true;
      }
    }
  });

  if (isDisposedState) return null;

  return (
    <>
      {obstacleState === "visible" && (
        <mesh
          position={[obstacleX, obstacleY, obstacleZ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[obstacleWidth, obstacleHeight, obstacleDepth]} />
          <meshStandardMaterial
            color="#475569"
            roughness={0.35}
            metalness={0.65}
          />
        </mesh>
      )}
      {SPHERE_CONFIGS.slice(0, sphereCount).map((cfg, i) => (
        <Model
          key={i}
          ref={(el: any) => {
            groupRefs.current[i] = el;
          }}
          name={cfg.name}
          message={cfg.message}
          email={cfg.email}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
          face={cfg.face}
          baseRadius={1.0}
          autoRotate={false}
          autoBlink={autoBlink}
          allowAnim={allowAnim}
          mouseTracking={mouseTracking}
          breathing={breathing}
          eyeSize={eyeSize}
          eyeDistance={eyeDistance}
          inkColor={inkColor}
          matrixAutoUpdate={false}
          diffuseType={cfg.diffuse}
          normalType={cfg.normal}
          renderOrder={2}
        />
      ))}
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const GroupOfSphere = () => {
  const [controls, setControls] = useControls("Physics Sphere", () => ({
    Physics: folder({
      sphereCount: {
        value: 10,
        min: 1,
        max: 20,
        step: 1,
        label: "Sphere Count",
      },
      sphereRadius: {
        value: 0.9,
        min: 0.3,
        max: 3.5,
        step: 0.05,
        label: "Sphere Radius",
      },
      positionX: {
        value: 2.2,
        min: -10.0,
        max: 10.0,
        step: 0.1,
        label: "Position X",
      },
      positionY: {
        value: -5.7,
        min: -10.0,
        max: 10.0,
        step: 0.1,
        label: "Position Y",
      },
      positionZ: {
        value: -1,
        min: -10.0,
        max: 10.0,
        step: 0.1,
        label: "Position Z",
      },
      spreadX: {
        value: 1.0,
        min: 0.0,
        max: 20.0,
        step: 0.05,
        label: "Spread X",
      },
      spreadY: {
        value: 1.95,
        min: 0.0,
        max: 5.0,
        step: 0.05,
        label: "Spread Y",
      },
      spreadZ: {
        value: 0.25,
        min: 0.0,
        max: 5.0,
        step: 0.05,
        label: "Spread Z",
      },
      springForce: {
        value: 0.004,
        min: 0.0,
        max: 0.05,
        step: 0.001,
        label: "Spring (target pull)",
      },
      maxDistanceThreshold: {
        value: 3.5,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Max Offset Limit",
      },
      tetherStiffness: {
        value: 0.04,
        min: 0.0,
        max: 0.2,
        step: 0.005,
        label: "Tether Strength",
      },
      damping: {
        value: 0.98,
        min: 0.8,
        max: 0.999,
        step: 0.005,
        label: "Damping",
      },
      restitution: {
        value: 0.35,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Bounce",
      },
      substeps: { value: 6, min: 1, max: 16, step: 1, label: "Substeps" },
    }),
    Obstacle: folder({
      obstacleState: {
        options: {
          Visible: "visible",
          Invisible: "invisible",
          Remove: "remove",
        },
        value: "invisible",
        label: "Mode",
      },
      obstacleWidth: {
        value: 6.3,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Width",
      },
      obstacleHeight: {
        value: 1,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Height",
      },
      obstacleDepth: {
        value: 2.2,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: "Depth",
      },
      obstacleX: {
        value: 2,
        min: -10.0,
        max: 10.0,
        step: 0.1,
        label: "Pos X",
      },
      obstacleY: {
        value: -0.4,
        min: -10.0,
        max: 10.0,
        step: 0.1,
        label: "Pos Y",
      },
      obstacleZ: {
        value: -0.6,
        min: -10.0,
        max: 10.0,
        step: 0.1,
        label: "Pos Z",
      },
    }),
    "Squish/SoftBody": folder({
      stiffness: {
        value: 70.0,
        min: 1.0,
        max: 100.0,
        step: 1.0,
        label: "Squish Stiffness",
      },
      squishDamping: {
        value: 0.82,
        min: 0.5,
        max: 0.99,
        step: 0.01,
        label: "Squish Damping",
      },
      squeezeFactor: {
        value: 0.6,
        min: 0.0,
        max: 1.5,
        step: 0.05,
        label: "Squish Amount",
      },
    }),
    Mouse: folder({
      mouseRadius: {
        value: 1.6,
        min: 0.5,
        max: 6.0,
        step: 0.1,
        label: "Push Radius",
      },
      mouseForce: {
        value: 0.03,
        min: 0.0,
        max: 0.5,
        step: 0.01,
        label: "Push Force",
      },
    }),
    Faces: folder({
      autoBlink: { value: true, label: "Auto Blink" },
      allowAnim: { value: false, label: "Mouth Animation" },
      mouseTracking: { value: true, label: "Eyes Track Mouse" },
      breathing: { value: true, label: "Breathing" },
      eyeSize: {
        value: 0.36,
        min: 0.2,
        max: 1.0,
        step: 0.02,
        label: "Eye Size",
      },
      eyeDistance: {
        value: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.01,
        label: "Eye Spacing",
      },
      inkColor: { value: "#111115", label: "Ink Color" },
    }),
    "End Animation": folder({
      endAnimProgress: {
        value: 0,
        min: 0,
        max: 1,
        step: 0.001,
        label: "Progress (Debug)",
      },
      pushForce: {
        value: 4.0,
        min: 0.5,
        max: 15.0,
        step: 0.5,
        label: "Push Distance",
      },
      delayFactor: {
        value: 0.04,
        min: 0.01,
        max: 0.3,
        step: 0.01,
        label: "Delay Factor",
      },
      triggerEndAnim: button(() => {
        window.dispatchEvent(
          new CustomEvent("ripple-click", {
            detail: { x: -0.5, y: 0.5 },
          }),
        );
      }),
    }),
  }));

  const handleProgressUpdate = (progress: number) => {
    setControls({ endAnimProgress: progress });
  };

  return (
    <PhysicsScene
      sphereCount={controls.sphereCount}
      sphereRadius={controls.sphereRadius}
      positionX={controls.positionX}
      positionY={controls.positionY}
      positionZ={controls.positionZ}
      spreadX={controls.spreadX}
      spreadY={controls.spreadY}
      spreadZ={controls.spreadZ}
      springForce={controls.springForce}
      maxDistanceThreshold={controls.maxDistanceThreshold}
      tetherStiffness={controls.tetherStiffness}
      damping={controls.damping}
      restitution={controls.restitution}
      stiffness={controls.stiffness}
      squishDamping={controls.squishDamping}
      squeezeFactor={controls.squeezeFactor}
      mouseRadius={controls.mouseRadius}
      mouseForce={controls.mouseForce}
      substeps={controls.substeps}
      autoBlink={controls.autoBlink}
      allowAnim={controls.allowAnim}
      mouseTracking={controls.mouseTracking}
      breathing={controls.breathing}
      eyeSize={controls.eyeSize}
      eyeDistance={controls.eyeDistance}
      inkColor={controls.inkColor}
      obstacleState={
        controls.obstacleState as "visible" | "invisible" | "remove"
      }
      obstacleWidth={controls.obstacleWidth}
      obstacleHeight={controls.obstacleHeight}
      obstacleDepth={controls.obstacleDepth}
      obstacleX={controls.obstacleX}
      obstacleY={controls.obstacleY}
      obstacleZ={controls.obstacleZ}
      endAnimProgress={controls.endAnimProgress}
      pushForce={controls.pushForce}
      delayFactor={controls.delayFactor}
      onProgressUpdate={handleProgressUpdate}
    />
  );
};

export default GroupOfSphere;
