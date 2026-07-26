import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export interface TextTextureOptions {
  /** Title lines rendered with main title font styling */
  titleLines?: string[];
  /** Subtitle data (lines or bullet segments) and paragraph description */
  subtitleData?: {
    line1?: string;
    line2?: string;
    segments?: string[];
    paragraph?: string;
  };
  /** Text color (hex/css color string). Defaults to "#FFFFFF" */
  color?: string;
  /** Font size in pixels for main title. Defaults to 256 */
  fontSize?: number;
  /** Main title font family. Defaults to "'Impact', 'Bebas Neue', sans-serif" */
  fontFamily?: string;
  /** Subtitle & paragraph font family. Defaults to "'Bebas Neue', sans-serif" */
  subFontFamily?: string;
  /** Font weight for main title. Defaults to 800 */
  weight?: string | number;
  /** Line height factor for title. Defaults to 0.86 */
  lineHeight?: number;
  /** Letter spacing ratio (relative to font size). Defaults to 0 */
  letterSpacing?: number;
  /** Inner padding in pixels. Defaults to 40 */
  margin?: number;
  /** Override canvas width. If omitted, calculated dynamically (min 1024) */
  width?: number;
  /** Override canvas height. If omitted, calculated dynamically (min 1024) */
  height?: number;
  /** Whether text is center aligned. Defaults to false */
  centered?: boolean;
}

/**
 * Wraps text into lines based on maximum width measurement.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Renders formatted multi-line title, subtitle, and paragraph text onto an HTML canvas.
 */
export function renderTextToCanvas(
  canvas: HTMLCanvasElement,
  options: TextTextureOptions = {}
): HTMLCanvasElement {
  const {
    titleLines = ["EVENT PASS", "2026 ACCESS"],
    subtitleData = {
      line1: "VIP EXPERIENCE • LIVE ENTERTAINMENT",
      line2: "ADMISSION TICKET • FRONT ROW",
      paragraph: "JOIN US FOR AN UNFORGETTABLE NIGHT. LIMITED TICKETS AVAILABLE.",
    },
    color = "#FFFFFF",
    fontSize = 256,
    fontFamily = "'Impact', 'Bebas Neue', sans-serif",
    subFontFamily = "'Bebas Neue', sans-serif",
    weight = 800,
    lineHeight = 0.86,
    letterSpacing = 0,
    margin = 40,
    centered = false,
  } = options;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const formattedTitles = titleLines.map((t) => t.toUpperCase());
  const titleFont = `${weight} ${fontSize}px ${fontFamily}`;
  const subFontSize = Math.round(fontSize * 0.2);
  const subFont = `400 ${subFontSize}px ${subFontFamily}`;
  const paraFontSize = Math.round(fontSize * 0.12);
  const paraFont = `400 ${paraFontSize}px ${subFontFamily}`;

  ctx.font = titleFont;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${fontSize * letterSpacing}px`;
  }

  // Measure title max width
  let maxTitleWidth = 0;
  for (const line of formattedTitles) {
    const w = ctx.measureText(line).width;
    if (w > maxTitleWidth) maxTitleWidth = w;
  }

  const titleGap = Math.ceil(fontSize * 0.08);
  const totalTitleHeight = fontSize * formattedTitles.length * lineHeight;

  // Subtitle lines
  const subLines: string[] = [];
  if (subtitleData.line1) subLines.push(subtitleData.line1.toUpperCase());
  if (subtitleData.line2) subLines.push(subtitleData.line2.toUpperCase());
  if (subtitleData.segments) {
    subLines.push(...subtitleData.segments.map((s) => s.toUpperCase()));
  }

  // Measure paragraph lines wrapped to max title width
  ctx.font = paraFont;
  if ("letterSpacing" in ctx) (ctx as any).letterSpacing = "0px";

  const paragraphText = (subtitleData.paragraph || "").toUpperCase();
  const paraWrapped = paragraphText
    ? wrapText(ctx, paragraphText, Math.max(maxTitleWidth, 400))
    : [];

  const paraHeight = paraWrapped.length * paraFontSize * 1.2;
  const subHeight = subLines.length * subFontSize * 1.25;

  const calculatedWidth = Math.ceil(maxTitleWidth + margin * 2);
  const calculatedHeight = Math.ceil(
    margin * 2 + totalTitleHeight + titleGap + subHeight + paraHeight
  );

  canvas.width = options.width || Math.max(calculatedWidth, 1024);
  canvas.height = options.height || Math.max(calculatedHeight, 1024);

  // Clear background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Title
  ctx.font = titleFont;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${fontSize * letterSpacing}px`;
  }
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;

  const startX = centered ? canvas.width / 2 : margin;

  for (let i = 0; i < formattedTitles.length; i++) {
    const y = margin + i * fontSize * lineHeight;
    ctx.fillText(formattedTitles[i], startX, y);
  }

  // Draw Subtitle
  let currentY = margin + totalTitleHeight + titleGap;
  if (subLines.length > 0) {
    ctx.font = subFont;
    if ("letterSpacing" in ctx) (ctx as any).letterSpacing = "0px";
    for (let i = 0; i < subLines.length; i++) {
      ctx.fillText(subLines[i], startX, currentY + i * subFontSize * 1.25);
    }
    currentY += subHeight;
  }

  // Draw Paragraph
  if (paraWrapped.length > 0) {
    ctx.font = paraFont;
    if ("letterSpacing" in ctx) (ctx as any).letterSpacing = "0px";
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < paraWrapped.length; i++) {
      ctx.fillText(paraWrapped[i], startX, currentY + i * paraFontSize * 1.2);
    }
    ctx.globalAlpha = 1.0;
  }

  return canvas;
}

/**
 * Creates a standalone THREE.CanvasTexture from parameters.
 */
export function createCanvasTextTexture(
  options: TextTextureOptions = {}
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  renderTextToCanvas(canvas, options);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * React hook that returns a responsive THREE.CanvasTexture generated dynamically from canvas text.
 * Re-renders texture automatically whenever options change.
 */
export function useCanvasTextTexture(
  options: TextTextureOptions = {}
): THREE.CanvasTexture {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const optionsKey = JSON.stringify(options);

  const texture = useMemo(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    renderTextToCanvas(canvasRef.current, options);

    if (!textureRef.current) {
      textureRef.current = new THREE.CanvasTexture(canvasRef.current);
      textureRef.current.minFilter = THREE.LinearFilter;
      textureRef.current.magFilter = THREE.LinearFilter;
      textureRef.current.colorSpace = THREE.SRGBColorSpace;
    } else {
      textureRef.current.needsUpdate = true;
    }
    return textureRef.current;
  }, [optionsKey]);

  useEffect(() => {
    if (canvasRef.current && textureRef.current) {
      renderTextToCanvas(canvasRef.current, options);
      textureRef.current.needsUpdate = true;
    }
  }, [optionsKey]);

  return texture;
}
