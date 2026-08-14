import { Html } from "@react-three/drei";
import React, { useEffect, useRef, useState, useId } from "react";
import gsap from "gsap";
import { useAtomValue } from "jotai";
import { pathnameAtom } from "../../libs/atoms";

interface Props {
  align: "left" | "right";
  name: string;
  message: string;
}

// Hardcoded variable to control how many messages to show on screen at once
const showAmount = 2;

// Module-level manager to coordinate message bubble animations across all instances
type Controller = {
  setActive: (active: boolean) => void;
};

class MessageManager {
  private registry = new Map<string, Controller>();
  private activeIds = new Set<string>();
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private lastScheduledTime = 0;

  register(id: string, controller: Controller) {
    this.registry.set(id, controller);
    this.checkAndFillSlots();
  }

  unregister(id: string) {
    this.registry.delete(id);
    this.activeIds.delete(id);
    const timer = this.pendingTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.pendingTimers.delete(id);
    }
    if (this.activeIds.size === 0) {
      this.lastScheduledTime = 0;
    }
    this.checkAndFillSlots();
  }

  onMessageHidden(id: string) {
    this.activeIds.delete(id);
    const timer = this.pendingTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.pendingTimers.delete(id);
    }

    if (this.activeIds.size === 0 && this.pendingTimers.size === 0) {
      this.lastScheduledTime = 0;
    }

    // Random time offset before filling the slot with a new message
    const offsetDelay = 400 + Math.random() * 800; // 0.4s to 1.2s offset
    const newTimer = setTimeout(() => {
      this.pendingTimers.delete(id);
      this.checkAndFillSlots();
    }, offsetDelay);

    this.pendingTimers.set(id, newTimer);
  }

  private checkAndFillSlots() {
    const allIds = Array.from(this.registry.keys());
    if (allIds.length === 0) return;

    const targetActiveCount = Math.min(showAmount, allIds.length);
    const needed = targetActiveCount - this.activeIds.size;

    if (needed <= 0) return;

    // Pick inactive messages that are not currently active or pending timer
    const available = allIds.filter(
      (id) => !this.activeIds.has(id) && !this.pendingTimers.has(id),
    );

    if (available.length === 0) return;

    // Shuffle available candidates
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, needed);

    const minInterval = 1500; // Minimum delay (ms) between consecutive message appearances

    chosen.forEach((id) => {
      this.activeIds.add(id);

      const now = Date.now();
      const baseTime = Math.max(now, this.lastScheduledTime + minInterval);
      const scheduledTime = baseTime + Math.random() * 300;
      this.lastScheduledTime = scheduledTime;

      const delay = Math.max(0, scheduledTime - now);

      const timer = setTimeout(() => {
        this.pendingTimers.delete(id);
        const controller = this.registry.get(id);
        if (controller && this.activeIds.has(id)) {
          controller.setActive(true);
        }
      }, delay);

      this.pendingTimers.set(id, timer);
    });
  }
}

const globalMessageManager = new MessageManager();

const Message = ({ align, name, message }: Props) => {
  const id = useId();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const stayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register with global manager
  useEffect(() => {
    const controller: Controller = {
      setActive: (active: boolean) => {
        setIsActive(active);
      },
    };

    globalMessageManager.register(id, controller);

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
      if (stayTimeoutRef.current) clearTimeout(stayTimeoutRef.current);
      globalMessageManager.unregister(id);
    };
  }, [id]);

  const handleRippleClick = () => {
    if (!node) return;

    if (tweenRef.current) tweenRef.current.kill();
    if (stayTimeoutRef.current) clearTimeout(stayTimeoutRef.current);

    tweenRef.current = gsap.to(node, {
      scale: 0,
      duration: 0.25,
      ease: "back.in(1.5)",
      onComplete: () => {
        setIsActive(false);
        globalMessageManager.onMessageHidden(id);
      },
    });
  };

  // Handle animation cycle when active and node is ready
  useEffect(() => {
    if (!isActive || !node) return;

    if (tweenRef.current) tweenRef.current.kill();
    if (stayTimeoutRef.current) clearTimeout(stayTimeoutRef.current);

    const startDelay = Math.random() * 0.1; // Small micro-jitter before bubble pops up

    tweenRef.current = gsap.fromTo(
      node,
      { scale: 0 },
      {
        scale: 1,
        duration: 0.5,
        delay: startDelay,
        ease: "back.out(2)",
        onComplete: () => {
          // Stay visible for a random duration (2.5s - 4s)
          const stayDuration = 2500 + Math.random() * 1500;

          stayTimeoutRef.current = setTimeout(() => {
            if (tweenRef.current) tweenRef.current.kill();

            tweenRef.current = gsap.to(node, {
              scale: 0,
              duration: 0.3,
              ease: "back.in(1.5)",
              onComplete: () => {
                setIsActive(false);
                globalMessageManager.onMessageHidden(id);
              },
            });
          }, stayDuration);
        },
      },
    );

    window.addEventListener("ripple-click", handleRippleClick);

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
      if (stayTimeoutRef.current) clearTimeout(stayTimeoutRef.current);
      window.removeEventListener("ripple-click", handleRippleClick);
    };
  }, [isActive, node, id]);

  const pathname = useAtomValue(pathnameAtom);
  if (pathname === "/detail") return null;
  if (pathname === "/nfc") return null;

  return (
    <Html
      as="div"
      className="message-container"
      center
      position={[align === "left" ? 0 : 0.7, 0.5, -1]}
      zIndexRange={[10, 0]}
    >
      <div
        ref={setNode}
        style={{ transform: "scale(0)", transformOrigin: "center" }}
      >
        <h1 className="user-name">@{name}</h1>
        <span className="user-message" data-align={align}>
          {message}
        </span>
      </div>
    </Html>
  );
};

export default Message;
