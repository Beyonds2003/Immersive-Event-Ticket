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

/**
 * Draws minimalist ticket content onto the canvas matching the reference design.
 * Center aligns all text: Date (top), Title & Location (middle), Time (bottom).
 */
export function updateCardCanvasTexture(
  item: CanvasTextureItem,
  data: TicketItem | string | any,
  dataIndex: number,
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

  // 4. Middle Main Text: Event Title (e.g., "Event Title" / "React Conf")
  ctx.font = "900 52px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(titleStr, w * 0.5, h * 0.44);

  // 5. Middle Sub Text: Location (e.g., "Yangon")
  ctx.font = "400 34px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(locationStr, w * 0.5, h * 0.56);

  // 6. Bottom Text: Time (e.g., "6:30 PM - 9:00 PM")
  ctx.font = "700 24px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(timeStr, w * 0.5, h * 0.86);

  ctx.restore();

  // Mark texture for GPU update
  texture.needsUpdate = true;
}
