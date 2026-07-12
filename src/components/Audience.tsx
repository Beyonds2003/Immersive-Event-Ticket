/**
 * Audience.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * N physics spheres packed inside a configurable box.
 * Inspired by Makio64's ball-field simulation:
 *   "It started simple. Each ball attached to a target point in space,
 *    trying to reach it, pushing other balls out of the way iteratively."
 *
 * Features
 * ────────
 *  • Spring + damping per sphere (each sphere has a rest/target position)
 *  • Velocity + bounciness on wall collisions
 *  • AABB container walls (spheres can be pushed out but spring back)
 *  • Spatial hash for O(1) broad-phase neighbour lookup
 *  • PBD sphere–sphere collision resolution
 *  • Mouse AABB repulsion (unprojects NDC cursor → world space)
 *  • Leva panel: count, box position/scale, damping, stiffness, bounce,
 *                push strength, sleep threshold
 */

import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useControls, folder } from "leva";
import { useMouse } from "../libs/useMouse";

// ─────────────────────────────────────────────────────────────────────────────
//  Seeded deterministic random (stable across re-renders)
// ─────────────────────────────────────────────────────────────────────────────
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x); // [0, 1)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Spatial Hash  (XY only, Z ignored for 2-D physics)
// ─────────────────────────────────────────────────────────────────────────────
class SpatialHash {
  private cells: Map<number, number[]> = new Map();
  private w: number;

  constructor(cellSize: number) {
    this.w = cellSize;
  }

  resize(cellSize: number) {
    this.w = cellSize;
  }

  private key(cx: number, cy: number): number {
    return (cx + 2048) * 8192 + (cy + 2048);
  }

  clear() {
    this.cells.clear();
  }

  insert(i: number, px: number, py: number) {
    const cx = Math.floor(px / this.w);
    const cy = Math.floor(py / this.w);
    const k = this.key(cx, cy);
    if (!this.cells.has(k)) this.cells.set(k, []);
    this.cells.get(k)!.push(i);
  }

  query(px: number, py: number, r: number): number[] {
    const result: number[] = [];
    const minCX = Math.floor((px - r) / this.w);
    const maxCX = Math.floor((px + r) / this.w);
    const minCY = Math.floor((py - r) / this.w);
    const maxCY = Math.floor((py + r) / this.w);
    for (let cx = minCX; cx <= maxCX; cx++)
      for (let cy = minCY; cy <= maxCY; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) for (const idx of bucket) result.push(idx);
      }
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Static helpers (scratch vectors, no per-frame alloc)
// ─────────────────────────────────────────────────────────────────────────────
const _near = new THREE.Vector3();
const _far = new THREE.Vector3();
const _mouseWorld = new THREE.Vector3();

function unprojectMouseToZ(
  ndcX: number,
  ndcY: number,
  camera: THREE.Camera,
  targetZ: number,
  out: THREE.Vector3,
) {
  _near.set(ndcX, ndcY, -1).unproject(camera);
  _far.set(ndcX, ndcY, 1).unproject(camera);
  const dir = _far.clone().sub(_near).normalize();
  const t = dir.z !== 0 ? (targetZ - _near.z) / dir.z : 0;
  out.copy(_near).addScaledVector(dir, t);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mouse AABB push (adds impulse, intentional repulsion)
// ─────────────────────────────────────────────────────────────────────────────
function resolveMouseAABB(
  i: number,
  bx: number,
  by: number,
  hw: number,
  hh: number,
  r: number,
  pushStrength: number,
  px: Float32Array,
  py: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
) {
  const cpx = Math.max(bx - hw, Math.min(bx + hw, px[i]));
  const cpy = Math.max(by - hh, Math.min(by + hh, py[i]));
  const edx = px[i] - cpx;
  const edy = py[i] - cpy;
  const dist2 = edx * edx + edy * edy;

  if (dist2 < r * r && dist2 > 0.0001) {
    const dist = Math.sqrt(dist2);
    const nx = edx / dist;
    const ny = edy / dist;
    const pen = r - dist;
    px[i] += nx * pen;
    py[i] += ny * pen;
    vx[i] += nx * pen * pushStrength;
    vy[i] += ny * pen * pushStrength;
  } else if (dist2 <= 0.0001) {
    py[i] += r;
    vy[i] += pushStrength * 0.5;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Box wall collision with bounce
//  Spheres pushed out by mouse CAN escape; spring pulls them back.
// ─────────────────────────────────────────────────────────────────────────────
function resolveBoxWalls(
  i: number,
  boxX: number,
  boxY: number,
  halfW: number,
  halfH: number,
  r: number,
  bounce: number,
  px: Float32Array,
  py: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
) {
  // Velocity threshold: below this speed treat as resting contact (no bounce).
  // Prevents low-energy spheres from jittering against walls at high bounce values.
  const REST_THRESHOLD = 0.08;

  if (px[i] - r < boxX - halfW) {
    px[i] = boxX - halfW + r;
    if (vx[i] < -REST_THRESHOLD) vx[i] = -vx[i] * bounce;
    else vx[i] = 0;
  }
  if (px[i] + r > boxX + halfW) {
    px[i] = boxX + halfW - r;
    if (vx[i] > REST_THRESHOLD) vx[i] = -vx[i] * bounce;
    else vx[i] = 0;
  }
  if (py[i] - r < boxY - halfH) {
    py[i] = boxY - halfH + r;
    if (vy[i] < -REST_THRESHOLD) vy[i] = -vy[i] * bounce;
    else vy[i] = 0;
  }
  if (py[i] + r > boxY + halfH) {
    py[i] = boxY + halfH - r;
    if (vy[i] > REST_THRESHOLD) vy[i] = -vy[i] * bounce;
    else vy[i] = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Static AABB obstacle (solid “stone” — no extra impulse, just position
//  correction + cancel inward velocity).  Prevents spring–wall oscillation.
// ─────────────────────────────────────────────────────────────────────────────
function resolveStaticAABB(
  i: number,
  bx: number,
  by: number,
  hw: number,
  hh: number,
  r: number,
  px: Float32Array,
  py: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
) {
  // Closest point on box surface to sphere centre
  const cpx = Math.max(bx - hw, Math.min(bx + hw, px[i]));
  const cpy = Math.max(by - hh, Math.min(by + hh, py[i]));
  const edx = px[i] - cpx;
  const edy = py[i] - cpy;
  const dist2 = edx * edx + edy * edy;

  if (dist2 < r * r && dist2 > 1e-8) {
    const dist = Math.sqrt(dist2);
    const nx = edx / dist;
    const ny = edy / dist;
    const pen = r - dist;
    // 1. Push sphere cleanly outside
    px[i] += nx * pen;
    py[i] += ny * pen;
    // 2. Cancel only the inward velocity component — no extra impulse.
    //    This prevents the spring from re-driving the sphere into the box.
    const vDotN = vx[i] * nx + vy[i] * ny;
    if (vDotN < 0) {
      vx[i] -= vDotN * nx;
      vy[i] -= vDotN * ny;
    }
  } else if (dist2 <= 1e-8) {
    // Sphere centre exactly inside box — eject upward
    py[i] += r;
    if (vy[i] < 0) vy[i] = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sphere colour palette
// ─────────────────────────────────────────────────────────────────────────────
const PALETTE = [
  new THREE.Color("#6C63FF"),
  new THREE.Color("#FF6584"),
  new THREE.Color("#43E97B"),
  new THREE.Color("#FA8231"),
  new THREE.Color("#A29BFE"),
  new THREE.Color("#FD79A8"),
  new THREE.Color("#00CEC9"),
  new THREE.Color("#FDCB6E"),
  new THREE.Color("#E17055"),
  new THREE.Color("#74B9FF"),
  new THREE.Color("#55EFC4"),
  new THREE.Color("#FF7675"),
];

// ─────────────────────────────────────────────────────────────────────────────
//  Main Audience Component
// ─────────────────────────────────────────────────────────────────────────────
const Audience = () => {
  // ── Leva controls ────────────────────────────────────────────────────────
  const {
    count,
    boxX,
    boxY,
    boxZ,
    boxW,
    boxH,
    radius,
    damping,
    stiffness,
    bounce,
    pbdIterations,
    sleepSpeed,
    pushStrength,
    mouseRadius,
    showBox,
    obstacleX,
    obstacleY,
    obstacleW,
    obstacleH,
    obstacleMode,
  } = useControls("Audience Spheres", {
    Simulation: folder({
      // 2-column hex pack. Radius ≈ colDx/2 = sqrt(3)*r/2 fills nicely.
      count: { value: 12, min: 1, max: 120, step: 1, label: "Sphere Count" },
      radius: {
        value: 0.7,
        min: 0.05,
        max: 2.0,
        step: 0.01,
        label: "Sphere Radius",
      },
    }),
    Box: folder({
      boxX: { value: 2, min: -10, max: 10, step: 0.1, label: "Position X" },
      boxY: { value: 0, min: -10, max: 10, step: 0.1, label: "Position Y" },
      boxZ: { value: 0.9, min: -10, max: 10, step: 0.1, label: "Position Z" },
      // hex-pack 2 cols: half-width = colDx/2 + r + margin ≈ r*(√3/2+1)+0.1
      boxW: {
        value: 3.25,
        min: 0.1,
        max: 10,
        step: 0.05,
        label: "Width (half)",
      },
      boxH: {
        value: 4.6,
        min: 0.5,
        max: 20,
        step: 0.1,
        label: "Height (half)",
      },
      showBox: { value: false, label: "Show Box" },
    }),
    Physics: folder({
      stiffness: { value: 60, min: 1, max: 200, step: 1, label: "Stiffness" },
      damping: {
        value: 0.96,
        min: 0.5,
        max: 0.999,
        step: 0.001,
        label: "Damping",
      },
      bounce: { value: 0.6, min: 0.0, max: 1.0, step: 0.01, label: "Bounce" },
      pbdIterations: {
        value: 8,
        min: 1,
        max: 20,
        step: 1,
        label: "PBD Iterations",
      },
      sleepSpeed: {
        value: 0.003,
        min: 0.0001,
        max: 0.05,
        step: 0.0001,
        label: "Sleep Speed",
      },
    }),
    Mouse: folder({
      pushStrength: {
        value: 12,
        min: 0,
        max: 80,
        step: 0.5,
        label: "Push Strength",
      },
      mouseRadius: {
        value: 0.6,
        min: 0.05,
        max: 2.0,
        step: 0.05,
        label: "Mouse Radius",
      },
    }),
    Obstacle: folder(
      {
        obstacleX: {
          value: 2.15,
          min: -10,
          max: 10,
          step: 0.05,
          label: "Pos X",
        },
        obstacleY: {
          value: -0.2,
          min: -10,
          max: 10,
          step: 0.05,
          label: "Pos Y",
        },
        obstacleW: {
          value: 2.1,
          min: 0.05,
          max: 8,
          step: 0.05,
          label: "Width (half)",
        },
        obstacleH: {
          value: 0.5,
          min: 0.05,
          max: 8,
          step: 0.05,
          label: "Height (half)",
        },
        // • Visible   → rendered + blocks spheres
        // • Invisible → hidden  + still blocks spheres
        // • Disabled  → hidden  + spheres pass through
        obstacleMode: {
          value: "Invisible" as "Visible" | "Invisible" | "Disabled",
          options: ["Visible", "Invisible", "Disabled"],
          label: "Mode",
        },
      },
      { collapsed: true },
    ),
  });

  const { camera } = useThree();
  const { coords, updateMouse } = useMouse();

  // ── Mesh refs (pre-allocated to max capacity) ─────────────────────────────
  const MAX_COUNT = 120;
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(MAX_COUNT).fill(null));
  const boxRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const obstacleRef = useRef<THREE.Mesh>(null);
  const obsEdgesRef = useRef<THREE.LineSegments>(null);

  // ── Physics state ─────────────────────────────────────────────────────────
  const physics = useRef({
    px: new Float32Array(MAX_COUNT),
    py: new Float32Array(MAX_COUNT),
    vx: new Float32Array(MAX_COUNT),
    vy: new Float32Array(MAX_COUNT),
    tx: new Float32Array(MAX_COUNT), // rest X
    ty: new Float32Array(MAX_COUNT), // rest Y
    // Per-sphere Z offset (seeded, stable). Physics is 2-D; Z is just visual depth.
    tz: new Float32Array(MAX_COUNT),
    initialised: false,
    prevCount: -1,
    prevRadius: -1,
    prevBoxW: -1,
    prevBoxH: -1,
    prevBoxX: 0,
    prevBoxY: 0,
  });

  const spatialHash = useRef(new SpatialHash(1.0));

  // ── Init / reinit physics ─────────────────────────────────────────────────
  // Hexagonal close-packing in 2 offset columns.
  //
  //  Col 0 (left)  : x = bx - colDx/2
  //  Col 1 (right) : x = bx + colDx/2,  shifted DOWN by r (half-diameter)
  //
  //  colDx = sqrt(3)*r  →  every cross-column neighbour is exactly 2r apart:
  //    sqrt((sqrt(3)*r)² + r²) = sqrt(3r²+r²) = sqrt(4r²) = 2r  ✓
  //
  //  Same-column vertical spacing = diameter  →  same-column neighbours touch ✓
  //
  //  Result: every sphere touches its immediate neighbours, no gaps.
  //  Large seeded Z offsets (±r) give the organic depth overlap in the image.
  const initPhysics = (
    n: number,
    r: number,
    bx: number,
    by: number,
    hw: number,
    hh: number,
  ) => {
    const diameter = r * 2;
    // Column X separation for hex touching: sqrt(3)*r
    const colDx = Math.sqrt(3) * r;
    // Z depth: ±1× radius so spheres visually overlap front-to-back like the ref
    const zRange = r * 1.0;

    const { px, py, vx, vy, tx, ty, tz } = physics.current;

    for (let i = 0; i < n; i++) {
      const col = i % 2; // 0 = left column, 1 = right column
      const row = Math.floor(i / 2); // which row within that column

      // X: left col at -colDx/2, right col at +colDx/2
      const targetX = bx + (col === 0 ? -colDx / 2 : colDx / 2);

      // Y: top-down, right column is offset down by r (gives hex stagger)
      const targetY =
        by +
        hh -
        r -
        row * diameter - // row index × full diameter
        (col === 1 ? r : 0); // right column shifted down by r

      // Tiny seeded positional jitter so PBD has something to separate at t=0
      const offX = (seededRand(i * 3.1 + 7) - 0.5) * r * 0.08;
      const offY = (seededRand(i * 5.7 + 13) - 0.5) * r * 0.08;

      // Seeded Z offset — big range for dramatic depth like the reference image
      tz[i] = (seededRand(i * 2.3 + 31) * 2 - 1) * zRange;

      tx[i] = targetX;
      ty[i] = targetY;
      px[i] = targetX + offX;
      py[i] = targetY + offY;
      vx[i] = 0;
      vy[i] = 0;
    }

    spatialHash.current.resize(diameter * 1.1);
    const p = physics.current;
    p.prevCount = n;
    p.prevRadius = r;
    p.prevBoxW = hw;
    p.prevBoxH = hh;
    p.prevBoxX = bx;
    p.prevBoxY = by;
    p.initialised = true;
  };

  // ── Per-frame simulation loop ─────────────────────────────────────────────
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.033);
    updateMouse();

    const p = physics.current;

    const needsReinit =
      !p.initialised ||
      p.prevCount !== count ||
      p.prevRadius !== radius ||
      p.prevBoxW !== boxW ||
      p.prevBoxH !== boxH ||
      p.prevBoxX !== boxX ||
      p.prevBoxY !== boxY;

    if (needsReinit) {
      initPhysics(count, radius, boxX, boxY, boxW, boxH);
    }

    unprojectMouseToZ(coords.x, coords.y, camera, boxZ, _mouseWorld);
    const mx = _mouseWorld.x;
    const my = _mouseWorld.y;
    const { px, py, vx, vy, tx, ty } = p;

    // Step 1 – spring force → integrate position → damp
    //  Order matches the reference engine:
    //   1. Accumulate spring force into velocity
    //   2. Integrate position
    //   3. Apply mouse push (positional + velocity impulse)
    //   4. Apply velocity damping AFTER integration (preserves bounce energy)
    for (let i = 0; i < count; i++) {
      // 1. Spring acceleration (F = k * displacement)
      vx[i] += (tx[i] - px[i]) * stiffness * dt;
      vy[i] += (ty[i] - py[i]) * stiffness * dt;

      // 2. Integrate position
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;

      // 3. Mouse push (after integrate so impulse affects next frame's spring)
      resolveMouseAABB(
        i,
        mx,
        my,
        mouseRadius * 0.5,
        mouseRadius * 0.5,
        radius,
        pushStrength,
        px,
        py,
        vx,
        vy,
      );

      // 4. Damping applied after position update — energy bleeds slowly
      vx[i] *= damping;
      vy[i] *= damping;

      const spd2 = vx[i] * vx[i] + vy[i] * vy[i];
      if (spd2 < sleepSpeed * sleepSpeed) {
        vx[i] = 0;
        vy[i] = 0;
      }
    }

    // Step 2 – rebuild spatial hash
    spatialHash.current.clear();
    for (let i = 0; i < count; i++) spatialHash.current.insert(i, px[i], py[i]);

    // Step 3 – PBD (sphere–sphere + walls)
    const diameter = radius * 2;
    for (let iter = 0; iter < pbdIterations; iter++) {
      for (let i = 0; i < count; i++) {
        const candidates = spatialHash.current.query(px[i], py[i], diameter);
        for (const j of candidates) {
          if (j <= i) continue;
          const dx = px[j] - px[i];
          const dy = py[j] - py[i];
          const dist2 = dx * dx + dy * dy;
          const minD = diameter;
          if (dist2 < minD * minD && dist2 > 1e-6) {
            const dist = Math.sqrt(dist2);
            const overlap = (minD - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            px[i] -= nx * overlap;
            py[i] -= ny * overlap;
            px[j] += nx * overlap;
            py[j] += ny * overlap;
            const relVx = vx[j] - vx[i];
            const relVy = vy[j] - vy[i];
            const vDotN = relVx * nx + relVy * ny;
            if (vDotN < 0) {
              const closingSpeed = -vDotN;
              // Ramp restitution from 0 → bounce over the first 0.3 units/s.
              // Resting contacts (closingSpeed ≈ 0) get no bounce — no jitter.
              // Fast collisions get full bounce — still snappy.
              const restScale = Math.min(closingSpeed / 0.3, 1.0);
              const impulse = -(1 + bounce * restScale) * vDotN * 0.5;
              vx[i] -= impulse * nx;
              vy[i] -= impulse * ny;
              vx[j] += impulse * nx;
              vy[j] += impulse * ny;
            }
          }
        }
      }

      // Wall constraint — soft (spheres CAN escape, spring returns them)
      for (let i = 0; i < count; i++) {
        resolveBoxWalls(
          i,
          boxX,
          boxY,
          boxW,
          boxH,
          radius,
          bounce,
          px,
          py,
          vx,
          vy,
        );
      }

      // Obstacle constraint — only active when mode ≠ "Disabled"
      if (obstacleMode !== "Disabled") {
        for (let i = 0; i < count; i++) {
          resolveStaticAABB(
            i,
            obstacleX,
            obstacleY,
            obstacleW,
            obstacleH,
            radius,
            px,
            py,
            vx,
            vy,
          );
        }
      }
    }

    // Step 4 – write to Three.js meshes (apply seeded Z offset for depth overlap)
    const { tz } = p;
    for (let i = 0; i < count; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      mesh.position.set(px[i], py[i], boxZ + tz[i]);
      mesh.visible = true;
    }
    for (let i = count; i < MAX_COUNT; i++) {
      const mesh = meshRefs.current[i];
      if (mesh) mesh.visible = false;
    }

    // Sync box wireframe
    if (boxRef.current) {
      boxRef.current.position.set(boxX, boxY, boxZ);
      boxRef.current.visible = showBox;
    }
    if (edgesRef.current) {
      edgesRef.current.position.set(boxX, boxY, boxZ);
      edgesRef.current.visible = showBox;
    }

    // Sync obstacle mesh — visible only in "Visible" mode
    const obsVisible = obstacleMode === "Visible";
    if (obstacleRef.current) {
      obstacleRef.current.position.set(obstacleX, obstacleY, boxZ + 0.02);
      obstacleRef.current.visible = obsVisible;
    }
    if (obsEdgesRef.current) {
      obsEdgesRef.current.position.set(obstacleX, obstacleY, boxZ + 0.02);
      obsEdgesRef.current.visible = obsVisible;
    }
  });

  // ── Update sphere geometry when radius changes ────────────────────────────
  useEffect(() => {
    meshRefs.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.SphereGeometry(radius, 28, 28);
    });
  }, [radius]);

  // ── Update box geometry when dimensions change ────────────────────────────
  useEffect(() => {
    if (!boxRef.current) return;
    boxRef.current.geometry.dispose();
    boxRef.current.geometry = new THREE.BoxGeometry(boxW * 2, boxH * 2, 0.01);
  }, [boxW, boxH]);

  useEffect(() => {
    if (!edgesRef.current) return;
    edgesRef.current.geometry.dispose();
    const box = new THREE.BoxGeometry(boxW * 2, boxH * 2, 0.01);
    edgesRef.current.geometry = new THREE.EdgesGeometry(box);
    box.dispose();
  }, [boxW, boxH]);

  // ── Update obstacle geometry when its size changes ────────────────────────
  useEffect(() => {
    if (!obstacleRef.current) return;
    obstacleRef.current.geometry.dispose();
    obstacleRef.current.geometry = new THREE.BoxGeometry(
      obstacleW * 2,
      obstacleH * 2,
      0.15,
    );
  }, [obstacleW, obstacleH]);

  useEffect(() => {
    if (!obsEdgesRef.current) return;
    obsEdgesRef.current.geometry.dispose();
    const g = new THREE.BoxGeometry(obstacleW * 2, obstacleH * 2, 0.15);
    obsEdgesRef.current.geometry = new THREE.EdgesGeometry(g);
    g.dispose();
  }, [obstacleW, obstacleH]);

  // ── Build MAX_COUNT sphere meshes once ───────────────────────────────────
  const sphereMeshes = useMemo(
    () =>
      Array.from({ length: MAX_COUNT }, (_, i) => {
        const color = PALETTE[i % PALETTE.length];
        return (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            visible={false}
          >
            <sphereGeometry args={[radius, 28, 28]} />
            <meshStandardMaterial
              color={color}
              roughness={0.12}
              metalness={0.55}
              emissive={color}
              emissiveIntensity={0.22}
            />
          </mesh>
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <group>
      {sphereMeshes}

      {/* Translucent container face */}
      <mesh ref={boxRef} position={[boxX, boxY, boxZ]} visible={showBox}>
        <boxGeometry args={[boxW * 2, boxH * 2, 0.01]} />
        <meshStandardMaterial
          color="#6C63FF"
          roughness={0.7}
          metalness={0.1}
          emissive="#6C63FF"
          emissiveIntensity={0.15}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Container glowing edges */}
      <lineSegments
        ref={edgesRef}
        position={[boxX, boxY, boxZ]}
        visible={showBox}
      >
        <edgesGeometry
          args={[new THREE.BoxGeometry(boxW * 2, boxH * 2, 0.01)]}
        />
        <lineBasicMaterial color="#8B84FF" transparent opacity={0.7} />
      </lineSegments>

      {/* ── Obstacle (stone) — rendered only in "Visible" mode ─────────── */}
      <mesh
        ref={obstacleRef}
        position={[obstacleX, obstacleY, boxZ + 0.02]}
        visible={obstacleMode === "Visible"}
      >
        <boxGeometry args={[obstacleW * 2, obstacleH * 2, 0.15]} />
        <meshStandardMaterial
          color="#2d2d3e"
          roughness={0.85}
          metalness={0.35}
          emissive="#4a4a7a"
          emissiveIntensity={0.25}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Obstacle glowing edges */}
      <lineSegments
        ref={obsEdgesRef}
        position={[obstacleX, obstacleY, boxZ + 0.02]}
        visible={obstacleMode === "Visible"}
      >
        <edgesGeometry
          args={[new THREE.BoxGeometry(obstacleW * 2, obstacleH * 2, 0.15)]}
        />
        <lineBasicMaterial color="#a78bfa" transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
};

export default Audience;
