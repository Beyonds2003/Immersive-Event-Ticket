import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const useMouse = (canvas?: HTMLElement | null) => {
  // Keep a ref to the canvas so event handlers always see the latest value
  // without needing to be recreated when the canvas prop changes.
  const canvasRef = useRef<HTMLElement | null>(canvas ?? null);
  useEffect(() => {
    canvasRef.current = canvas ?? null;
  }, [canvas]);

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
  // x, y are client-space pixels. We resolve them relative to the canvas
  // (or the full window when no canvas is provided) so the resulting NDC
  // exactly matches clipPos.xy / clipPos.w computed in the vertex shader.
  const updateCoords = (clientX: number, clientY: number) => {
    let x = clientX;
    let y = clientY;
    let w: number;
    let h: number;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      x = clientX - rect.left;
      y = clientY - rect.top;
      w = rect.width;
      h = rect.height;
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }

    coords.set((x / w) * 2 - 1, -(y / h) * 2 + 1); // NDC: [-1, 1]

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
      updateCoords(e.touches[0].clientX, e.touches[0].clientY);
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

