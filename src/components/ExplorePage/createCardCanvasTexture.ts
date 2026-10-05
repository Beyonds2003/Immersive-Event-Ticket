import * as THREE from "three";
import type { TicketItem } from "./ticketData";

export interface CanvasTextureItem {
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentDataIndex: number;
}

/**
 * Creates a THREE.CanvasTexture backed by an HTMLCanvasElement.
 */
export function createCardCanvasTexture(
  width = 512,
  height = 512,
): CanvasTextureItem {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  return {
    texture,
    canvas,
    ctx,
    currentDataIndex: -1,
  };
}

export interface CardCanvasOptions {
  /** Maximum number of wrap lines for the title (default: 2) */
  maxTitleLines?: number;
  /** Maximum width in pixels for title text before wrapping (default: canvas.width - 80) */
  titleMaxWidth?: number;
  /** Vertical line height for wrapped title lines in pixels (default: 56) */
  titleLineHeight?: number;
  /** Truncation suffix when title exceeds max lines (default: "...") */
  ellipsis?: string;
}

/**
 * Truncates text so that `text + ellipsis` fits within `maxWidth`.
 */
export function truncateWithEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  ellipsis = "...",
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  const ellipsisWidth = ctx.measureText(ellipsis).width;
  if (ellipsisWidth >= maxWidth) {
    return ellipsis;
  }

  let low = 0;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.slice(0, mid).trimEnd() + ellipsis;
    if (ctx.measureText(candidate).width <= maxWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return text.slice(0, best).trimEnd() + ellipsis;
}

/**
 * Breaks a single word that exceeds maxWidth into a fitting head and the remaining tail.
 */
export function breakLongWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
): { head: string; tail: string } {
  let low = 1;
  let high = word.length;
  let best = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = word.slice(0, mid);
    if (ctx.measureText(candidate).width <= maxWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    head: word.slice(0, best),
    tail: word.slice(best),
  };
}

/**
 * Wraps text into lines that do not exceed maxWidth, up to maxLines.
 * If text exceeds maxLines, the final line is truncated with an ellipsis.
 */
export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
  ellipsis = "...",
): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (maxLines <= 0) return [];

  // Single line constraint
  if (maxLines === 1) {
    return [truncateWithEllipsis(ctx, trimmed, maxWidth, ellipsis)];
  }

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  let wordIndex = 0;

  while (wordIndex < words.length) {
    // If we've reached the last allowed line, place remaining words and truncate if needed
    if (lines.length === maxLines - 1) {
      const remainingWords = words.slice(wordIndex);
      const remainingCandidate = currentLine
        ? `${currentLine} ${remainingWords.join(" ")}`
        : remainingWords.join(" ");

      if (ctx.measureText(remainingCandidate).width <= maxWidth) {
        lines.push(remainingCandidate);
      } else {
        lines.push(
          truncateWithEllipsis(ctx, remainingCandidate, maxWidth, ellipsis),
        );
      }
      return lines;
    }

    const word = words[wordIndex];
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      wordIndex++;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      } else {
        const broken = breakLongWord(ctx, word, maxWidth);
        lines.push(broken.head);
        words[wordIndex] = broken.tail;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Draws minimalist ticket content onto the canvas matching the reference design.
 * Center aligns all text: Date (top), Title & Location (middle), Time (bottom).
 */
export function updateCardCanvasTexture(
  item: CanvasTextureItem,
  data: TicketItem | string | any,
  dataIndex: number,
  options?: CardCanvasOptions,
): void {
  const { canvas, ctx, texture } = item;
  const w = canvas.width;
  const h = canvas.height;

  item.currentDataIndex = dataIndex;

  // Extract ticket properties or fallbacks
  const dateStr =
    typeof data === "object" && data && data.date ? data.date : "12 AUG 2026";

  const titleStr =
    typeof data === "object" && data && data.title
      ? data.title
      : typeof data === "string" && data
        ? data
        : "Event Title";

  const locationStr =
    typeof data === "object" && data && data.location
      ? data.location
      : "Yangon";

  const timeStr =
    typeof data === "object" && data && data.time
      ? data.time
      : "6:30 PM - 9:00 PM";

  // Clear canvas
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // Card Outer Bounds & Rounded Corner Radius
  const cornerRadius = 40;
  const borderWidth = 8;
  const inset = borderWidth / 2;

  // 1. Draw Card Background (Soft Light Grey Fill)
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - borderWidth, h - borderWidth, cornerRadius);
  ctx.fillStyle = "#f9f9f8";
  ctx.fill();

  // 2. Draw Soft Sky Blue Outer Border Frame
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = "#f9f9f8";
  ctx.stroke();

  // Clip content inside rounded card
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - borderWidth, h - borderWidth, cornerRadius);
  ctx.clip();

  // Configure Center Alignment for all text
  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";

  // 3. Top Text: Date (e.g., "12 AUG 2026")
  ctx.font = "700 32px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(dateStr, w * 0.5, h * 0.16);

  // 4. Middle Main Text: Event Title (wrapped with configurable max lines & ellipsis)
  ctx.font = "900 52px Dingos-Bold, sans-serif";
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";

  const maxLines =
    typeof data === "object" && data && typeof data.maxTitleLines === "number"
      ? data.maxTitleLines
      : options?.maxTitleLines ?? 2;

  const titleMaxWidth = options?.titleMaxWidth ?? w - 80;
  const titleLineHeight = options?.titleLineHeight ?? 56;
  const ellipsis = options?.ellipsis ?? "...";

  const titleLines = wrapCanvasText(
    ctx,
    titleStr,
    titleMaxWidth,
    maxLines,
    ellipsis,
  );

  const titleCenterY = h * 0.44;
  const startY =
    titleLines.length > 0
      ? titleCenterY - ((titleLines.length - 1) * titleLineHeight) / 2
      : titleCenterY;

  titleLines.forEach((line, i) => {
    const lineY = startY + i * titleLineHeight;
    ctx.fillText(line, w * 0.5, lineY);
  });

  // 5. Middle Sub Text: Location (e.g., "Yangon")
  ctx.font = "200 32px Dingos, sans-serif";
  ctx.fillStyle = "#7e7c7c";
  ctx.textBaseline = "middle";
  const lastTitleLineY =
    titleLines.length > 0
      ? startY + (titleLines.length - 1) * titleLineHeight
      : titleCenterY;
  const locationY = Math.max(lastTitleLineY + 58, h * 0.56);
  ctx.fillText(locationStr, w * 0.5, locationY);

  // 6. Bottom Text: Time (e.g., "6:30 PM - 9:00 PM")
  ctx.font = "700 24px sans-serif";
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";
  ctx.fillText(timeStr, w * 0.5, h * 0.86);

  ctx.restore();

  // Mark texture for GPU update
  texture.needsUpdate = true;
}
