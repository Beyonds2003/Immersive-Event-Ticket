import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Canvas dimensions — higher = sharper text on the mesh
const CANVAS_W = 1024;
const CANVAS_H = 256;

const FONT = "700 56px Dangos, sans-serif";
const COLOR_TEXT = "#000000";
const COLOR_PLACEHOLDER = "#000000";
const BACKGROUND_COLOR = "rgba(255, 255, 255, 0.7)";
const COLOR_CURSOR = "#000000";
const PLACEHOLDER = "Enter Email";
const PADDING_X = 80;
const CURSOR_BLINK_MS = 530;

export const useEmailInput = (onEnter?: (value: string) => void) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stateRef = useRef({
    value: "",
    focused: false,
    cursorVisible: true,
  });

  // true for exactly one frame after Enter is pressed, then resets to false
  const enterPressed = useRef(false);

  // Build the canvas + texture once
  const texture = useMemo(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvasRef.current = canvas;

    // DEBUG: make canvas visible on screen
    // canvas.style.cssText =
    //   "position:fixed;top:10px;left:10px;z-index:9999;border:2px solid red;background:#111;";
    // document.body.appendChild(canvas);
    // Scale context so all draw calls are in logical pixels
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = tex;
    return tex;
  }, []);

  // Draw the current state onto the canvas
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    // Background fill — change this color to style the input
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const { value, focused, cursorVisible } = stateRef.current;
    const isEmpty = value.length === 0;

    ctx.font = FONT;
    ctx.textBaseline = "middle";
    const midY = CANVAS_H / 2;

    if (isEmpty && !focused) {
      // Placeholder
      ctx.fillStyle = COLOR_PLACEHOLDER;
      ctx.fillText(PLACEHOLDER, PADDING_X, midY);
    } else {
      // Typed text
      ctx.fillStyle = COLOR_TEXT;
      ctx.fillText(value, PADDING_X, midY);

      // Blinking cursor
      if (focused && cursorVisible) {
        const textW = ctx.measureText(value).width;
        const cursorX = PADDING_X + textW + 2;
        const cursorH = 56;
        ctx.fillStyle = COLOR_CURSOR;
        ctx.fillRect(cursorX, midY - cursorH / 2, 3, cursorH);
      }
    }

    if (textureRef.current) textureRef.current.needsUpdate = true;
  };

  // Setup hidden input + cursor blink interval
  useEffect(() => {
    // Hidden real DOM input — captures keyboard, IME, mobile keyboards, copy-paste
    const input = document.createElement("input");
    input.name = "email";
    input.type = "email";
    input.autocomplete = "email";
    input.style.cssText =
      "position:fixed;opacity:0;pointer-events:none;top:0;left:0;width:0;height:0;";
    document.body.appendChild(input);
    inputRef.current = input;

    const onInput = () => {
      stateRef.current.value = input.value;
      draw();
    };

    const onFocus = () => {
      stateRef.current.focused = true;
      stateRef.current.cursorVisible = true;
      draw();
    };

    const onBlur = () => {
      stateRef.current.focused = false;
      stateRef.current.cursorVisible = true;
      draw();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        enterPressed.current = true;
        onEnter?.(stateRef.current.value);
        // Reset to false on the next event-loop tick so a single
        // useFrame check sees it as true exactly once
        setTimeout(() => {
          enterPressed.current = false;
        }, 0);
      }
    };

    input.addEventListener("input", onInput);
    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);
    input.addEventListener("keydown", onKeyDown);

    // Cursor blink ticker
    const blinkId = setInterval(() => {
      if (!stateRef.current.focused) return;
      stateRef.current.cursorVisible = !stateRef.current.cursorVisible;
      draw();
    }, CURSOR_BLINK_MS);

    draw(); // initial render

    return () => {
      clearInterval(blinkId);
      input.removeEventListener("input", onInput);
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("keydown", onKeyDown);
      document.body.removeChild(input);
    };
  }, []);

  const focus = () => inputRef.current?.focus();
  const blur = () => inputRef.current?.blur();

  return { texture, focus, blur, enterPressed };
};
