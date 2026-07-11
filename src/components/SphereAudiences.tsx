import { useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useMouse } from "../libs/useMouse";

// ─────────────────────────────────────────────
//  Constants  ← tweak these
// ─────────────────────────────────────────────
const SPHERE_COUNT = 8;
const RADIUS = 0.9;
const DIAMETER = RADIUS * 2;
const FIXED_Z = 0;

// ── Randomness ──────────────────────────────
/** Max Z offset in either direction (e.g. 0.5 → spheres sit -0.5 to +0.5 in Z) */
const Z_RANDOM_RANGE = 0.6;
/** Scale multiplier range: 1 ± SCALE_RANDOM_RANGE  (e.g. 0.25 → 0.75× to 1.25×) */
const SCALE_RANDOM_RANGE = 0.2;

// ── Spring / physics ────────────────────────
const SPRING_STIFFNESS = 45; // lower = less fighting with PBD constraint
const DAMPING = 0.92; // high damping kills residual velocity fast
const BOUNCE = 0.0; // 0 = fully inelastic at contact (no bounce)
const PUSH_STRENGTH = 10; // impulse scale when mouse repels
/** Velocity below this magnitude is zeroed out (sleep) to stop micro-jitter */
const SLEEP_SPEED = 0.004;
/** Target Y spacing between sphere centres as a fraction of DIAMETER.
 *  < 1.0  → spring pulls spheres INTO each other → they pile up pressing.
 *  Use ~0.5 for a tight touching stack like the reference picture. */
const TARGET_SPACING = RADIUS * 0.6; // tweak this ↑↓ to control tightness

// ── Mouse AABB half-extents (world units) ───
const MOUSE_AABB_HX = 0.35;
const MOUSE_AABB_HY = 0.35;

// ── Solver ──────────────────────────────────
const PBD_ITERATIONS = 6;

// Spatial-hash cell size = diameter
const CELL_SIZE = DIAMETER * 1.05;

// ─────────────────────────────────────────────
//  Seeded per-sphere random values (stable, no re-roll on re-render)
//  Using a simple deterministic hash so values never change.
// ─────────────────────────────────────────────
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x); // 0..1
}

/** Random Z offset per sphere: range [-Z_RANDOM_RANGE, +Z_RANDOM_RANGE] */
const SPHERE_Z = Array.from(
  { length: SPHERE_COUNT },
  (_, i) => (seededRandom(i * 7.3) * 2 - 1) * Z_RANDOM_RANGE,
);

/** Scale multiplier per sphere: range [1 - SCALE_RANDOM_RANGE, 1 + SCALE_RANDOM_RANGE] */
const SPHERE_SCALE = Array.from(
  { length: SPHERE_COUNT },
  (_, i) => 1 + (seededRandom(i * 3.7 + 99) * 2 - 1) * SCALE_RANDOM_RANGE,
);

// ─────────────────────────────────────────────
//  Box Obstacle Config
// ─────────────────────────────────────────────
export interface BoxObstacleConfig {
  /** World-space X centre of the box */
  x: number;
  /** World-space Y centre of the box */
  y: number;
  /** Half-width of the box (world units) */
  halfW: number;
  /** Half-height of the box (world units) */
  halfH: number;
  /** Whether the box is active and visible */
  visible: boolean;
}

// ─────────────────────────────────────────────
//  Spatial Hash (2-D, X/Y only)
// ─────────────────────────────────────────────
class SpatialHash {
  private cells: Map<number, number[]> = new Map();
  private w: number;

  constructor(cellSize: number) {
    this.w = cellSize;
  }

  private key(cx: number, cy: number) {
    const x = cx + 1024;
    const y = cy + 1024;
    return x * 4096 + y;
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
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) for (const idx of bucket) result.push(idx);
      }
    }
    return result;
  }
}

// ─────────────────────────────────────────────
//  Per-sphere state (plain arrays, no GC)
// ─────────────────────────────────────────────
interface SphereState {
  px: Float32Array;
  py: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  tx: Float32Array;
  ty: Float32Array;
}

// ─────────────────────────────────────────────
//  Helper: Unproject NDC mouse → world XY at fixed Z
// ─────────────────────────────────────────────
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
  const t = (targetZ - _near.z) / dir.z;
  out.copy(_near).addScaledVector(dir, t);
}

// ─────────────────────────────────────────────
//  AABB sphere push helper
//  Pushes sphere i away from box defined by (bx,by,hw,hh).
//  Modifies vx[i] / vy[i] if overlapping.
// ─────────────────────────────────────────────
function resolveAABB(
  i: number,
  bx: number,
  by: number,
  hw: number,
  hh: number,
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
  const dist = Math.sqrt(edx * edx + edy * edy);

  if (dist < RADIUS && dist > 0.0001) {
    const nx = edx / dist;
    const ny = edy / dist;
    const pen = RADIUS - dist;
    // Position correction (push sphere outside immediately)
    px[i] += nx * pen;
    py[i] += ny * pen;
    // Velocity impulse — intentional repulsion (used for mouse cursor only)
    vx[i] += nx * pen * pushStrength;
    vy[i] += ny * pen * pushStrength;
  } else if (dist <= 0.0001) {
    // Centre is inside box → push upward as fallback
    py[i] += RADIUS;
    vy[i] += pushStrength * 0.5;
  }
}

// ─────────────────────────────────────────────
//  Static AABB collision (solid wall / obstacle)
//  Corrects position + cancels inward velocity.
//  NO extra impulse — this prevents the shaking
//  loop that occurs when a spring fights a wall.
// ─────────────────────────────────────────────
function resolveStaticAABB(
  i: number,
  bx: number,
  by: number,
  hw: number,
  hh: number,
  px: Float32Array,
  py: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
) {
  const cpx = Math.max(bx - hw, Math.min(bx + hw, px[i]));
  const cpy = Math.max(by - hh, Math.min(by + hh, py[i]));
  const edx = px[i] - cpx;
  const edy = py[i] - cpy;
  const dist = Math.sqrt(edx * edx + edy * edy);

  if (dist < RADIUS && dist > 0.0001) {
    const nx = edx / dist;
    const ny = edy / dist;
    const pen = RADIUS - dist;
    // 1. Push sphere cleanly outside the surface
    px[i] += nx * pen;
    py[i] += ny * pen;
    // 2. Cancel the velocity component going INTO the wall — no extra impulse.
    //    This is what stops the shaking: the spring can't re-drive the sphere
    //    into the box because the inward velocity is erased each frame.
    const vDotN = vx[i] * nx + vy[i] * ny;
    if (vDotN < 0) {
      vx[i] -= vDotN * nx;
      vy[i] -= vDotN * ny;
    }
  } else if (dist <= 0.0001) {
    // Centre fully inside box → eject upward
    py[i] += RADIUS;
    const vDotUp = vy[i];
    if (vDotUp < 0) vy[i] = 0;
  }
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
interface SphereAudiencesProps {
  /** Static box obstacle config. Pass undefined to disable. */
  obstacle?: BoxObstacleConfig;
  /** World-space position of the entire system [x, y, z] */
  position?: [number, number, number];
}

const SphereAudiences = ({
  obstacle,
  position = [0, 0, 0],
}: SphereAudiencesProps) => {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const boxRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { coords, updateMouse } = useMouse();

  // Build target positions: vertically stacked, targets spaced tightly
  // so springs pull spheres into each other and PBD settles them touching.
  const targets = useMemo(() => {
    const totalHeight = SPHERE_COUNT * TARGET_SPACING;
    const startY = totalHeight / 2 - TARGET_SPACING / 2;
    return Array.from({ length: SPHERE_COUNT }, (_, i) => ({
      x: 0,
      y: startY - i * TARGET_SPACING,
      z: SPHERE_Z[i],
      scale: SPHERE_SCALE[i],
    }));
  }, []);

  // Sphere physics state – initialised to rest positions
  const state = useMemo<SphereState>(() => {
    const n = SPHERE_COUNT;
    const s: SphereState = {
      px: new Float32Array(n),
      py: new Float32Array(n),
      vx: new Float32Array(n),
      vy: new Float32Array(n),
      tx: new Float32Array(n),
      ty: new Float32Array(n),
    };
    for (let i = 0; i < n; i++) {
      s.px[i] = targets[i].x;
      s.py[i] = targets[i].y;
      s.tx[i] = targets[i].x;
      s.ty[i] = targets[i].y;
    }
    return s;
  }, [targets]);

  const spatialHash = useMemo(() => new SpatialHash(CELL_SIZE), []);

  useFrame((_, dt) => {
    const clampedDt = Math.min(dt, 0.033);
    updateMouse();

    // ── 1. Unproject mouse to world XY, then convert to local space ──
    unprojectMouseToZ(
      coords.x,
      coords.y,
      camera,
      position[2] + FIXED_Z,
      _mouseWorld,
    );
    // Subtract the group's world offset so physics stays in local space
    const mx = _mouseWorld.x - position[0];
    const my = _mouseWorld.y - position[1];

    const { px, py, vx, vy, tx, ty } = state;

    // ── 2. Spring + damping + mouse AABB + box obstacle ─────────
    for (let i = 0; i < SPHERE_COUNT; i++) {
      // Spring acceleration toward rest target
      const ax = (tx[i] - px[i]) * SPRING_STIFFNESS;
      const ay = (ty[i] - py[i]) * SPRING_STIFFNESS;
      vx[i] = (vx[i] + ax * clampedDt) * DAMPING;
      vy[i] = (vy[i] + ay * clampedDt) * DAMPING;

      // Mouse AABB repulsion (keeps velocity impulse — intentional push)
      resolveAABB(
        i,
        mx,
        my,
        MOUSE_AABB_HX,
        MOUSE_AABB_HY,
        PUSH_STRENGTH,
        px,
        py,
        vx,
        vy,
      );

      // Integrate position
      px[i] += vx[i] * clampedDt;
      py[i] += vy[i] * clampedDt;

      // Velocity sleep — zero out micro-velocity to prevent residual shimmer
      const spd2 = vx[i] * vx[i] + vy[i] * vy[i];
      if (spd2 < SLEEP_SPEED * SLEEP_SPEED) {
        vx[i] = 0;
        vy[i] = 0;
      }
    }

    // ── 3. Rebuild spatial hash ──────────────────────────────────
    spatialHash.clear();
    for (let i = 0; i < SPHERE_COUNT; i++) {
      spatialHash.insert(i, px[i], py[i]);
    }

    // ── 4. PBD sphere–sphere collision resolution ────────────────
    for (let iter = 0; iter < PBD_ITERATIONS; iter++) {
      for (let i = 0; i < SPHERE_COUNT; i++) {
        const candidates = spatialHash.query(px[i], py[i], DIAMETER);
        for (const j of candidates) {
          if (j <= i) continue;
          const dx = px[j] - px[i];
          const dy = py[j] - py[i];
          const dist2 = dx * dx + dy * dy;
          const minD = DIAMETER;
          if (dist2 < minD * minD && dist2 > 0.00001) {
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
            // Only act when spheres are approaching each other
            if (vDotN < 0) {
              // Project out the full inward normal velocity (no bounce).
              // This is the key fix for jitter: instead of reflecting velocity
              // with a bounce factor, we simply cancel the component that
              // drives them back into overlap every frame.
              const cancel = vDotN * 0.5;
              vx[i] += cancel * nx;
              vy[i] += cancel * ny;
              vx[j] -= cancel * nx;
              vy[j] -= cancel * ny;
            }
          }
        }
      }

      // Static box obstacle — resolved here (after integration) as a
      // PBD constraint so it gets the same stable treatment as sphere-sphere.
      if (obstacle) {
        for (let i = 0; i < SPHERE_COUNT; i++) {
          resolveStaticAABB(
            i,
            obstacle.x,
            obstacle.y,
            obstacle.halfW,
            obstacle.halfH,
            px,
            py,
            vx,
            vy,
          );
        }
      }
    }

    // ── 5. Write positions to meshes ─────────────────────────────
    for (let i = 0; i < SPHERE_COUNT; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      mesh.position.set(px[i], py[i], targets[i].z);
    }

    // ── 6. Sync box mesh position ────────────────────────────────
    if (boxRef.current && obstacle) {
      boxRef.current.position.set(obstacle.x, obstacle.y, FIXED_Z);
      boxRef.current.visible = obstacle.visible;
    }
  });

  return (
    <group position={position}>
      {/* Sphere instances */}
      {Array.from({ length: SPHERE_COUNT }, (_, i) => (
        <SphereInstance
          key={i}
          index={i}
          meshRefs={meshRefs}
          initPos={targets[i]}
          scale={targets[i].scale}
        />
      ))}

      {/* Static box obstacle */}
      {obstacle && (
        <mesh
          ref={boxRef}
          visible={obstacle.visible}
          position={[obstacle.x, obstacle.y, FIXED_Z]}
        >
          <boxGeometry
            args={[obstacle.halfW * 2, obstacle.halfH * 2, DIAMETER]}
          />
          <meshStandardMaterial
            color="#4a4a6a"
            roughness={0.85}
            metalness={0.2}
            emissive="#1a1a2e"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

// ─────────────────────────────────────────────
//  Individual Sphere Mesh
// ─────────────────────────────────────────────
interface SphereInstanceProps {
  index: number;
  meshRefs: React.MutableRefObject<(THREE.Mesh | null)[]>;
  initPos: { x: number; y: number; z: number };
  scale: number;
}

const SphereInstance = ({
  index,
  meshRefs,
  initPos,
  scale,
}: SphereInstanceProps) => {
  const color = useMemo(() => {
    const hue = (index / SPHERE_COUNT) * 360;
    return new THREE.Color(`hsl(${hue}, 80%, 65%)`);
  }, [index]);

  return (
    <mesh
      ref={(el) => {
        meshRefs.current[index] = el;
      }}
      scale={scale}
      position={[initPos.x, initPos.y, initPos.z]}
    >
      <sphereGeometry args={[RADIUS, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.15}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={0.18}
      />
    </mesh>
  );
};

export default SphereAudiences;
