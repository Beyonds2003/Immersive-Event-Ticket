import { useEffect, useMemo, useRef } from "react";
import { useDiemnsion } from "./useDimension";
import * as THREE from "three";

export const useMouse = () => {
  const { width, height } = useDiemnsion();

  // Same logic as your shader code:
  const [mouseMoved, coords, coords_old, diff] = useMemo(() => {
    return [
      { current: false },
      new THREE.Vector2(),
      new THREE.Vector2(),
      new THREE.Vector2(),
    ];
  }, []);

  // Track whether coords_old has been seeded with a real position yet
  const seeded = useMemo(() => ({ current: false }), []);

  // ---- Update normalized coordinates ----
  const updateCoords = (x: number, y: number) => {
    coords.set((x / width) * 2 - 1, -(y / height) * 2 + 1); // -1 0 1

    // Seed coords_old on the very first move so we don't get a
    // giant spike from (0,0) → current position.
    if (!seeded.current) {
      coords_old.copy(coords);
      seeded.current = true;
    }

    mouseMoved.current = true;
    setTimeout(() => {
      mouseMoved.current = false;
    }, 100);
  };

  // ---- Events ----
  const handleMouseMove = (e: MouseEvent) => {
    updateCoords(e.clientX, e.clientY);
  };

  const handleTouch = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      updateCoords(e.touches[0].pageX, e.touches[0].pageY);
    }
  };

  const updateMouse = () => {
    // Check the *previous* position before overwriting it.
    const wasAtOrigin = coords_old.x === 0 && coords_old.y === 0;

    diff.subVectors(coords, coords_old);
    coords_old.copy(coords);

    if (wasAtOrigin) {
      diff.set(0, 0);
    }
  };

  // ---- Setup & cleanup ----
  useEffect(() => {
    document.body.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("touchstart", handleTouch);
    document.body.addEventListener("touchmove", handleTouch);

    return () => {
      document.body.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("touchstart", handleTouch);
      document.body.removeEventListener("touchmove", handleTouch);
    };
  }, []);

  return {
    coords,
    coords_old,
    diff,
    mouseMoved,
    updateMouse,
  };
};
