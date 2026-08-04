import { useRef } from "react";
import { useControls } from "leva";

// ─────────────────────────────────────────────────────────────────────────────
// Spring Physics Config
// ─────────────────────────────────────────────────────────────────────────────
export interface SpringConfig {
  /** How strongly the spring pulls toward the target (stiffness) */
  stiffness: number;
  /** How much the spring resists motion (damping) */
  damping: number;
  /** Mass of the simulated object — higher = more inertia */
  mass: number;
  /** How fast the raw scroll input is folded into the spring target (0–1) */
  inputSensitivity: number;
  /** Multiplier on the raw scroll speed before it's fed to the spring */
  inputScale: number;
  /** When the absolute velocity is below this, the spring is considered at rest */
  restThreshold: number;
  /** Clamp the spring value to this absolute range, 0 = no clamp */
  clampAbs: number;
}

const DEFAULT_CONFIG: SpringConfig = {
  stiffness: 360,
  damping: 7.5,
  mass: 1.0,
  inputSensitivity: 0.35,
  inputScale: 6.0,
  restThreshold: 0.0001,
  clampAbs: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// Core spring step — call once per frame (dt in seconds)
//
// Physics model:
//   F  = -stiffness * (pos - target) - damping * velocity
//   a  = F / mass
//   v += a * dt
//   x += v * dt
//
// Result behaviour when a positive scroll impulse is received:
//   0 → peak (e.g. 0.5) → overshoot negative (e.g. -0.1) → settle to 0
// ─────────────────────────────────────────────────────────────────────────────
export function springStep(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  dt: number,
): { position: number; velocity: number } {
  const { stiffness, damping, mass, restThreshold, clampAbs } = config;

  const force = -stiffness * (position - target) - damping * velocity;
  const acceleration = force / mass;

  let newVelocity = velocity + acceleration * dt;
  let newPosition = position + newVelocity * dt;

  // Clamp if configured
  if (clampAbs > 0) {
    newPosition = Math.max(-clampAbs, Math.min(clampAbs, newPosition));
    if (Math.abs(newPosition) >= clampAbs) newVelocity = 0;
  }

  // Rest check — snap to target to kill micro-oscillations
  if (
    Math.abs(newVelocity) < restThreshold &&
    Math.abs(newPosition - target) < restThreshold
  ) {
    newVelocity = 0;
    newPosition = target;
  }

  return { position: newPosition, velocity: newVelocity };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useSpringValue
//
// Usage inside a useFrame callback:
//
//   const { tick } = useSpringValue("Scroll Spring");
//
//   useFrame((_, delta) => {
//     const rawScrollSpeed = ...; // positive or negative
//     const springValue = tick(rawScrollSpeed, delta);
//     material.uniforms.uScrollSpeed.value = springValue;
//   });
//
// ─────────────────────────────────────────────────────────────────────────────
export function useSpringValue(levaFolder = "Spring Physics") {
  // ── Leva Controls ────────────────────────────────────────────────────────
  const {
    stiffness,
    damping,
    mass,
    inputSensitivity,
    inputScale,
    restThreshold,
    clampAbs,
  } = useControls(levaFolder, {
    stiffness: {
      value: DEFAULT_CONFIG.stiffness,
      min: 1,
      max: 800,
      step: 1,
      label: "Stiffness (k)",
    },
    damping: {
      value: DEFAULT_CONFIG.damping,
      min: 0,
      max: 60,
      step: 0.5,
      label: "Damping (c)",
    },
    mass: {
      value: DEFAULT_CONFIG.mass,
      min: 0.1,
      max: 10,
      step: 0.1,
      label: "Mass (m)",
    },
    inputSensitivity: {
      value: DEFAULT_CONFIG.inputSensitivity,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      label: "Input Sensitivity",
    },
    inputScale: {
      value: DEFAULT_CONFIG.inputScale,
      min: 0.1,
      max: 30,
      step: 0.1,
      label: "Input Scale",
    },
    restThreshold: {
      value: DEFAULT_CONFIG.restThreshold,
      min: 0.00001,
      max: 0.01,
      step: 0.00001,
      label: "Rest Threshold",
    },
    clampAbs: {
      value: DEFAULT_CONFIG.clampAbs,
      min: 0,
      max: 5,
      step: 0.05,
      label: "Clamp Abs (0=off)",
    },
  });

  // ── Internal mutable state (refs so no re-renders) ───────────────────────
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRef = useRef(0);

  // ── tick: call once per frame inside useFrame ────────────────────────────
  /**
   * @param rawScrollSpeed  The raw scroll delta — positive or negative.
   * @param delta           Frame delta time in seconds (from useFrame's second arg).
   * @returns               The current spring value this frame.
   *
   * Behaviour:
   *  - Feed: target is nudged toward rawScrollSpeed * inputScale
   *  - Decay: target itself lerps back to 0 every frame (spring rests at 0)
   *  - Physics: standard spring-damper integration
   */
  const tick = (rawScrollSpeed: number, delta: number): number => {
    const config: SpringConfig = {
      stiffness,
      damping,
      mass,
      inputSensitivity,
      inputScale,
      restThreshold,
      clampAbs,
    };

    // Drive the target with incoming scroll speed, then decay it to 0
    targetRef.current +=
      (rawScrollSpeed * config.inputScale - targetRef.current) *
      config.inputSensitivity;
    targetRef.current *= 0.9; // spring target decays toward 0 every frame

    // Clamp dt to avoid instability on tab refocus / frame spikes
    const safeDt = Math.min(delta, 0.05);

    const result = springStep(
      positionRef.current,
      velocityRef.current,
      targetRef.current,
      config,
      safeDt,
    );

    positionRef.current = result.position;
    velocityRef.current = result.velocity;

    return positionRef.current;
  };

  /** Instantly reset position, velocity, and target to 0. */
  const reset = () => {
    positionRef.current = 0;
    velocityRef.current = 0;
    targetRef.current = 0;
  };

  return { tick, reset, positionRef, velocityRef, targetRef };
}
