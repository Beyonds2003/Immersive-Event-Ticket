import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  type CanvasTextureItem,
  createCardCanvasTexture,
  updateCardCanvasTexture,
} from "./createCardCanvasTexture";
import type { TicketItem } from "./ticketData";

export const POOL_SIZE = 4;

export interface TexturePoolManagerOptions {
  data: TicketItem[] | string[] | any[];
  totalCards: number;
  cardGap: number;
  infiniteLoop: boolean;
}

export function useTexturePoolManager({
  data,
  totalCards,
  cardGap,
  infiniteLoop,
}: TexturePoolManagerOptions) {
  // Store 4 CanvasTexture pool items without triggering React re-renders
  const poolItemsRef = useRef<CanvasTextureItem[]>([]);
  const texturesArrayRef = useRef<THREE.CanvasTexture[]>([]);

  // Instanced attribute array (size = totalCards)
  const textureIndexBufferRef = useRef<Float32Array>(
    new Float32Array(Math.max(1, totalCards)).fill(-1),
  );

  // Track mapping: slot (0..3) -> instance index (-1 if unassigned)
  const slotToInstanceRef = useRef<number[]>([-1, -1, -1, -1]);
  // Track mapping: instance index -> slot (0..3, or -1 if unassigned)
  const instanceToSlotRef = useRef<Map<number, number>>(new Map());

  // Initialize pool of 4 textures once
  if (poolItemsRef.current.length === 0) {
    const items: CanvasTextureItem[] = [];
    const textures: THREE.CanvasTexture[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const item = createCardCanvasTexture(512, 512);
      items.push(item);
      textures.push(item.texture);
    }
    poolItemsRef.current = items;
    texturesArrayRef.current = textures;
  }

  // Ensure instanced buffer matches totalCards size if totalCards changes
  useEffect(() => {
    if (textureIndexBufferRef.current.length !== totalCards) {
      textureIndexBufferRef.current = new Float32Array(totalCards).fill(-1);
    }
  }, [totalCards]);

  // Clean up textures on unmount
  useEffect(() => {
    return () => {
      poolItemsRef.current.forEach((item) => item.texture.dispose());
    };
  }, []);

  /**
   * Called each frame in useFrame (no React state updates used).
   * Calculates the 4 visible/closest cards to focus point based on scroll progress,
   * reuses texture slots, draws new card canvas textures when needed, and updates instanced buffer attribute.
   */
  const updateTexturePool = (scrollProgress: number): boolean => {
    const count = Math.max(1, totalCards);
    const dataCount = data.length;
    if (dataCount === 0) return false;

    // 1. Calculate distance of each instance to view center (scrollProgress)
    const instances: { id: number; dist: number; dataIndex: number }[] = [];

    for (let id = 0; id < count; id++) {
      let cardOffset = (id - scrollProgress) * cardGap;
      if (infiniteLoop) {
        const totalExtent = count * cardGap;
        const halfExtent = totalExtent * 0.5;
        cardOffset =
          (((cardOffset + halfExtent) % totalExtent) + totalExtent) % totalExtent -
          halfExtent;
      }

      const dist = Math.abs(cardOffset);
      const dataIndex = ((id % dataCount) + dataCount) % dataCount;
      instances.push({ id, dist, dataIndex });
    }

    // 2. Select top 4 closest instances
    instances.sort((a, b) => a.dist - b.dist);
    const visibleInstances = instances.slice(0, Math.min(POOL_SIZE, count));
    const visibleIdsSet = new Set(visibleInstances.map((v) => v.id));

    // 3. Free up slots for instances that are no longer in top 4
    for (let slot = 0; slot < POOL_SIZE; slot++) {
      const assignedInst = slotToInstanceRef.current[slot];
      if (assignedInst !== -1 && !visibleIdsSet.has(assignedInst)) {
        slotToInstanceRef.current[slot] = -1;
        instanceToSlotRef.current.delete(assignedInst);
      }
    }

    // 4. Assign slots to visible instances
    let attributeChanged = false;

    for (const vis of visibleInstances) {
      const instId = vis.id;
      const dataIndex = vis.dataIndex;
      const itemData = data[dataIndex];

      // If instance already has a slot assigned, check if data index is current
      if (instanceToSlotRef.current.has(instId)) {
        const currentSlot = instanceToSlotRef.current.get(instId)!;
        const poolItem = poolItemsRef.current[currentSlot];
        if (poolItem.currentDataIndex !== dataIndex) {
          updateCardCanvasTexture(poolItem, itemData, dataIndex);
        }
      } else {
        // Find an unassigned slot
        let freeSlot = slotToInstanceRef.current.indexOf(-1);
        if (freeSlot === -1) freeSlot = 0; // Fallback

        slotToInstanceRef.current[freeSlot] = instId;
        instanceToSlotRef.current.set(instId, freeSlot);

        const poolItem = poolItemsRef.current[freeSlot];
        updateCardCanvasTexture(poolItem, itemData, dataIndex);
        attributeChanged = true;
      }
    }

    // 5. Update Float32Array buffer attribute
    const buffer = textureIndexBufferRef.current;
    for (let id = 0; id < count; id++) {
      const slot = instanceToSlotRef.current.get(id);
      const newIndex = slot !== undefined ? slot : -1.0;
      if (buffer[id] !== newIndex) {
        buffer[id] = newIndex;
        attributeChanged = true;
      }
    }

    return attributeChanged;
  };

  return {
    textures: texturesArrayRef.current,
    textureIndexBuffer: textureIndexBufferRef.current,
    updateTexturePool,
  };
}
