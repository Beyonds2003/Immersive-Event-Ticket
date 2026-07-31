import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export interface TextTextureOptions {
  /** Main title text (string or array of lines). Defaults to "Responsive Text" */
  title?: string | string[];
  /** Optional subtitle text (string or array of lines) */
  subtitle?: string | string[];

  /** Main title text color. Defaults to "#FFFFFF" */
  titleColor?: string;
  /** Subtitle text color. Defaults to "#CCCCCC" */
  subtitleColor?: string;

  /**
   * Main title font size in px, or scale factor (<= 1).
   * If omitted, scales responsively with canvas width using `fontScale`.
   */
  titleFontSize?: number;
  /** Subtitle font size in px, or scale factor (<= 1) */
  subtitleFontSize?: number;

  /** Main title font family. Defaults to "Arial, sans-serif" */
  titleFontFamily?: string;
  /** Subtitle font family. Defaults to "Arial, sans-serif" */
  subtitleFontFamily?: string;

  /** Font weight for main title. Defaults to "bold" */
  titleWeight?: string | number;
  /** Font weight for subtitle. Defaults to "normal" */
  subtitleWeight?: string | number;

  /** Line height multiplier for title. Defaults to 1.1 */
  titleLineHeight?: number;
  /** Line height multiplier for subtitle. Defaults to 1.2 */
  subtitleLineHeight?: number;

  /** Letter spacing for title in px. Defaults to 0 */
  titleLetterSpacing?: number;
  /** Letter spacing for subtitle in px. Defaults to 0 */
  subtitleLetterSpacing?: number;

  /** Margin / gap between title and subtitle in px */
  titleSubtitleMargin?: number;

  /** Canvas width in pixels. Defaults to 1024 */
  width?: number;
  /** Canvas height in pixels. Defaults to 1024 */
  height?: number;

  /** Responsive font scale factor relative to canvas width (e.g. 0.05 = 5% of width). Defaults to 0.05 */
  fontScale?: number;
  /** Minimum title font size in px. Defaults to 24 */
  minFontSize?: number;

  /** Horizontal text alignment ("center", "left", "right", "start", "end"). Defaults to "left" */
  textAlign?: CanvasTextAlign;
  /** Vertical text baseline positioning. Defaults to "middle" */
  textBaseline?: CanvasTextBaseline;

  /** Canvas padding in pixels. Defaults to 40 */
  padding?: number;

  /** Auto update canvas resolution responsive to window size. Defaults to false */
  responsive?: boolean;

  // --- Backward Compatibility Aliases ---
  /** Alias for title */
  titleLines?: string[];
  /** Alias for titleColor */
  color?: string;
  /** Alias for titleFontSize */
  fontSize?: number;
  /** Alias for titleFontFamily */
  fontFamily?: string;
  /** Alias for titleWeight */
  weight?: string | number;
  /** Alias for titleLineHeight */
  lineHeight?: number;
  /** Alias for titleLetterSpacing */
  letterSpacing?: number;
  /** Alias for titleSubtitleMargin */
  margin?: number;
}

/**
 * Wraps a single line of text if its measured width exceeds maxWidth.
 */
function wrapSingleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      const chars = Array.from(word);
      let charLine = "";
      for (const ch of chars) {
        if (ctx.measureText(charLine + ch).width > maxWidth && charLine) {
          lines.push(charLine);
          charLine = ch;
        } else {
          charLine += ch;
        }
      }
      if (charLine) {
        currentLine = charLine;
      }
      continue;
    }

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
 * Measures and wraps lines against maxWidth.
 */
function wrapLinesToFit(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  font: string,
  letterSpacing: number,
  maxWidth: number,
): string[] {
  ctx.font = font;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${letterSpacing}px`;
  }

  const result: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width > maxWidth) {
      result.push(...wrapSingleLine(ctx, line, maxWidth));
    } else {
      result.push(line);
    }
  }
  return result;
}

/**
 * Renders title and optional subtitle onto an HTML canvas with responsive text scaling.
 */
export function renderTextToCanvas(
  canvas: HTMLCanvasElement,
  options: TextTextureOptions = {},
): HTMLCanvasElement {
  const {
    width = 1024,
    height = 1024,
    responsive = false,
    textAlign = "left",
    textBaseline = "middle",
    padding = 40,
    fontScale = 0.05,
    minFontSize = 24,

    // Title
    title,
    titleLines: legacyTitleLines,
    titleColor,
    color: legacyColor = "#FFFFFF",
    titleFontSize,
    fontSize: legacyFontSize,
    titleFontFamily,
    fontFamily: legacyFontFamily = "Arial, sans-serif",
    titleWeight,
    weight: legacyWeight = "bold",
    titleLineHeight,
    lineHeight: legacyLineHeight = 1.1,
    titleLetterSpacing,
    letterSpacing: legacyLetterSpacing = 0,

    // Subtitle
    subtitle,
    subtitleColor = "#CCCCCC",
    subtitleFontSize,
    subtitleFontFamily = "Arial, sans-serif",
    subtitleWeight = "normal",
    subtitleLineHeight = 1.2,
    subtitleLetterSpacing = 0,

    // Margin
    titleSubtitleMargin,
    margin: legacyMargin,
  } = options;

  // Set canvas dimensions
  const finalWidth =
    responsive && typeof window !== "undefined"
      ? Math.max(window.innerWidth * (window.devicePixelRatio || 1), 512)
      : width;
  const finalHeight =
    responsive && typeof window !== "undefined"
      ? Math.max(window.innerHeight * (window.devicePixelRatio || 1), 512)
      : height;

  if (canvas.width !== finalWidth) canvas.width = finalWidth;
  if (canvas.height !== finalHeight) canvas.height = finalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Initial Title lines
  let initialTitleLines: string[] = [];
  if (title !== undefined) {
    initialTitleLines = Array.isArray(title) ? title : [title];
  } else if (legacyTitleLines && legacyTitleLines.length > 0) {
    initialTitleLines = legacyTitleLines;
  } else {
    initialTitleLines = ["Responsive Text"];
  }

  // Initial Subtitle lines
  let initialSubtitleLines: string[] = [];
  if (subtitle !== undefined) {
    initialSubtitleLines = Array.isArray(subtitle) ? subtitle : [subtitle];
  }

  // Resolve style values with legacy fallback
  const finalTitleColor = titleColor ?? legacyColor;
  const rawTitleFontSize = titleFontSize ?? legacyFontSize;
  const finalTitleFontFamily = titleFontFamily ?? legacyFontFamily;
  const finalTitleWeight = titleWeight ?? legacyWeight;
  const finalTitleLineHeight = titleLineHeight ?? legacyLineHeight;

  const baseWidth = width || 1024;
  const scaleRatio =
    responsive && typeof window !== "undefined" ? finalWidth / baseWidth : 1;

  // Compute responsive title font size
  let computedTitleFontSize: number;
  if (typeof rawTitleFontSize === "number") {
    if (rawTitleFontSize <= 1 && rawTitleFontSize > 0) {
      computedTitleFontSize = Math.max(
        minFontSize,
        finalWidth * rawTitleFontSize,
      );
    } else {
      computedTitleFontSize = Math.max(
        minFontSize,
        rawTitleFontSize * scaleRatio,
      );
    }
  } else {
    computedTitleFontSize = Math.max(minFontSize, finalWidth * fontScale);
  }

  // Compute subtitle font size
  let computedSubtitleFontSize: number;
  if (typeof subtitleFontSize === "number") {
    if (subtitleFontSize <= 1 && subtitleFontSize > 0) {
      computedSubtitleFontSize = Math.max(12, finalWidth * subtitleFontSize);
    } else {
      computedSubtitleFontSize = Math.max(12, subtitleFontSize * scaleRatio);
    }
  } else {
    computedSubtitleFontSize = Math.max(
      12,
      Math.round(computedTitleFontSize * 0.45),
    );
  }

  let finalTitleLetterSpacing =
    (titleLetterSpacing ?? legacyLetterSpacing) * scaleRatio;
  let finalSubtitleLetterSpacing = subtitleLetterSpacing * scaleRatio;
  let finalMargin =
    (titleSubtitleMargin ??
      legacyMargin ??
      Math.round(
        rawTitleFontSize
          ? rawTitleFontSize * 0.35
          : computedTitleFontSize * 0.35,
      )) * scaleRatio;

  const maxTextWidth = Math.max(50, finalWidth - padding * 2);
  const maxTextHeight = Math.max(50, finalHeight - padding * 2);

  let resolvedTitleLines: string[] = [];
  let resolvedSubtitleLines: string[] = [];
  let titleBlockHeight = 0;
  let subtitleBlockHeight = 0;
  let gap = 0;
  let totalBlockHeight = 0;

  // Auto-fit loop to shrink font sizes if lines or total height exceed available bounds
  const MAX_FIT_ITERATIONS = 5;
  for (let iter = 0; iter < MAX_FIT_ITERATIONS; iter++) {
    const titleFontSpec = `${finalTitleWeight} ${computedTitleFontSize}px ${finalTitleFontFamily}`;
    const subtitleFontSpec = `${subtitleWeight} ${computedSubtitleFontSize}px ${subtitleFontFamily}`;

    resolvedTitleLines = wrapLinesToFit(
      ctx,
      initialTitleLines,
      titleFontSpec,
      finalTitleLetterSpacing,
      maxTextWidth,
    );

    resolvedSubtitleLines = wrapLinesToFit(
      ctx,
      initialSubtitleLines,
      subtitleFontSpec,
      finalSubtitleLetterSpacing,
      maxTextWidth,
    );

    let maxLineWidth = 0;

    ctx.font = titleFontSpec;
    if ("letterSpacing" in ctx) {
      (ctx as any).letterSpacing = `${finalTitleLetterSpacing}px`;
    }
    for (const line of resolvedTitleLines) {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    }

    ctx.font = subtitleFontSpec;
    if ("letterSpacing" in ctx) {
      (ctx as any).letterSpacing = `${finalSubtitleLetterSpacing}px`;
    }
    for (const line of resolvedSubtitleLines) {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    }

    titleBlockHeight =
      resolvedTitleLines.length > 0
        ? (resolvedTitleLines.length - 1) *
            computedTitleFontSize *
            finalTitleLineHeight +
          computedTitleFontSize
        : 0;

    subtitleBlockHeight =
      resolvedSubtitleLines.length > 0
        ? (resolvedSubtitleLines.length - 1) *
            computedSubtitleFontSize *
            subtitleLineHeight +
          computedSubtitleFontSize
        : 0;

    gap =
      resolvedTitleLines.length > 0 && resolvedSubtitleLines.length > 0
        ? finalMargin
        : 0;

    totalBlockHeight = titleBlockHeight + gap + subtitleBlockHeight;

    const widthOverflow = maxLineWidth > maxTextWidth;
    const heightOverflow = totalBlockHeight > maxTextHeight;

    if (!widthOverflow && !heightOverflow) {
      break;
    }

    if (computedTitleFontSize <= minFontSize) {
      break;
    }

    const widthScale = widthOverflow ? maxTextWidth / maxLineWidth : 1;
    const heightScale = heightOverflow ? maxTextHeight / totalBlockHeight : 1;
    const fitFactor = Math.min(widthScale, heightScale) * 0.98;

    const newTitleFontSize = Math.max(
      minFontSize,
      computedTitleFontSize * fitFactor,
    );
    if (Math.abs(newTitleFontSize - computedTitleFontSize) < 0.5) {
      computedTitleFontSize = newTitleFontSize;
      break;
    }

    const sizeRatio = newTitleFontSize / computedTitleFontSize;
    computedTitleFontSize = newTitleFontSize;
    computedSubtitleFontSize = Math.max(
      10,
      computedSubtitleFontSize * sizeRatio,
    );
    finalTitleLetterSpacing = finalTitleLetterSpacing * sizeRatio;
    finalSubtitleLetterSpacing = finalSubtitleLetterSpacing * sizeRatio;
    finalMargin = finalMargin * sizeRatio;
  }

  // Vertical start position
  let currentY = (canvas.height - totalBlockHeight) / 2;
  if (textBaseline === "top" || textBaseline === "hanging") {
    currentY = padding;
  } else if (
    textBaseline === "bottom" ||
    textBaseline === "alphabetic" ||
    textBaseline === "ideographic"
  ) {
    currentY = canvas.height - totalBlockHeight - padding;
  }

  // Horizontal start position
  let startX = canvas.width / 2;
  if (textAlign === "left" || textAlign === "start") {
    startX = padding;
  } else if (textAlign === "right" || textAlign === "end") {
    startX = canvas.width - padding;
  }

  // Draw Title
  if (resolvedTitleLines.length > 0) {
    ctx.font = `${finalTitleWeight} ${computedTitleFontSize}px ${finalTitleFontFamily}`;
    ctx.fillStyle = finalTitleColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";
    if ("letterSpacing" in ctx) {
      (ctx as any).letterSpacing = `${finalTitleLetterSpacing}px`;
    }

    for (let i = 0; i < resolvedTitleLines.length; i++) {
      const lineY = currentY + i * computedTitleFontSize * finalTitleLineHeight;
      ctx.fillText(resolvedTitleLines[i], startX, lineY);
    }

    currentY += titleBlockHeight + gap;
  }

  // Draw Subtitle
  if (resolvedSubtitleLines.length > 0) {
    ctx.font = `${subtitleWeight} ${computedSubtitleFontSize}px ${subtitleFontFamily}`;
    ctx.fillStyle = subtitleColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";
    if ("letterSpacing" in ctx) {
      (ctx as any).letterSpacing = `${finalSubtitleLetterSpacing}px`;
    }

    for (let i = 0; i < resolvedSubtitleLines.length; i++) {
      const lineY =
        currentY + i * computedSubtitleFontSize * subtitleLineHeight;
      ctx.fillText(resolvedSubtitleLines[i], startX + 20, lineY);
    }
  }

  return canvas;
}

/**
 * Creates a standalone THREE.CanvasTexture from options.
 */
export function createCanvasTextTexture(
  options: TextTextureOptions = {},
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
 * Listens to window resize events and options changes to re-render automatically.
 */
export function useCanvasTextTexture(
  options: TextTextureOptions = {},
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
    const handleResize = () => {
      if (canvasRef.current && textureRef.current) {
        renderTextToCanvas(canvasRef.current, options);
        textureRef.current.needsUpdate = true;
      }
    };

    handleResize();

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        handleResize();
      });
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [optionsKey]);

  return texture;
}
