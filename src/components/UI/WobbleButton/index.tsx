import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { mouse } from "../../../libs/mouse";
import "./WobbleButton.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  /** outward normal X */
  nx: number;
  /** outward normal Y */
  ny: number;
}

interface CharOffset {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  rotation: number;
  targetRotation: number;
  vr: number;
}

export interface WobbleButtonProps {
  /** Visible width of the button in px */
  width?: number;
  /** Visible height of the button in px */
  height?: number;
  /** Number of spring points distributed around the pill perimeter */
  pointCount?: number;
  /** Base fill colour (hex) */
  fillColor?: string;
  /** Colour on hover (defaults to a lightened fillColor) */
  hoverColor?: string;
  /** Spring stiffness [0‒1] */
  stiffness?: number;
  /** Spring damping [0‒1] */
  damping?: number;
  /** Maximum bulge displacement in px */
  bulgeAmount?: number;
  /** Influence radius as a multiple of the pill radius */
  influenceRadius?: number;
  /** Label text */
  text?: string;
  /** Alternative label shown on hover */
  hoverText?: string;
  /** Text colour */
  textColor?: string;
  /** Text opacity when not hovered */
  textOpacity?: number;
  /** Font size in rem */
  fontSize?: number;
  fontFamily?: string;
  textMargin?: string;
  /** Animate individual characters */
  wobbleChars?: boolean;
  /** Emit heart particles on hover */
  emitHearts?: boolean;
  clickShockWave?: number;
  /** Distance (in px) from the button edge where the wobble effect starts to activate */
  proximityThreshold?: number;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  className?: string;
}

// ─── Heart particle emitter ───────────────────────────────────────────────────

class HeartEmitter {
  private interval: number;
  private driftRange: number;
  private travelMin: number;
  private travelExtra: number;
  private durationMin: number;
  private durationExtra: number;
  private _id: ReturnType<typeof setInterval> | null = null;

  constructor(opts: Partial<HeartEmitter> = {}) {
    this.interval = (opts as any).interval ?? 180;
    this.driftRange = (opts as any).driftRange ?? 40;
    this.travelMin = (opts as any).travelMin ?? 50;
    this.travelExtra = (opts as any).travelExtra ?? 30;
    this.durationMin = (opts as any).durationMin ?? 0.6;
    this.durationExtra = (opts as any).durationExtra ?? 0.4;
  }

  start(
    container: HTMLElement,
    w: number,
    h: number,
    factory: () => HTMLElement,
  ) {
    this.stop();
    this._spawn(container, w, h, factory);
    this._id = setInterval(
      () => this._spawn(container, w, h, factory),
      this.interval,
    );
  }

  stop() {
    if (this._id !== null) {
      clearInterval(this._id);
      this._id = null;
    }
  }

  private _spawn(
    container: HTMLElement,
    w: number,
    _h: number,
    factory: () => HTMLElement,
  ) {
    const el = factory();
    el.style.position = "absolute";
    el.style.pointerEvents = "none";
    el.style.userSelect = "none";
    el.style.zIndex = "10";

    const x = Math.random() * w;
    const drift = (Math.random() - 0.5) * this.driftRange;
    el.style.left = `${x}px`;
    el.style.top = "0px";
    container.appendChild(el);

    const dur = this.durationMin + Math.random() * this.durationExtra;
    const travel = this.travelMin + Math.random() * this.travelExtra;

    gsap.fromTo(
      el,
      { y: -10, x: 0, scale: 0, opacity: 0 },
      {
        y: -travel,
        x: drift,
        scale: 1,
        opacity: 1,
        duration: dur * 0.4,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(el, {
            scale: 0,
            opacity: 0,
            duration: dur * 0.6,
            ease: "power2.in",
            onComplete: () => el.remove(),
          });
        },
      },
    );
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function lightenColor(hex: string, amount: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, "0")}${ng
    .toString(16)
    .padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

const WobbleButton: React.FC<WobbleButtonProps> = ({
  width = 160,
  height = 56,
  pointCount = 32,
  fillColor = "#FF5379",
  hoverColor,
  stiffness = 0.05,
  damping = 0.97,
  bulgeAmount = 8,
  influenceRadius = 4,
  text = "",
  hoverText,
  textColor = "#ffffff",
  textOpacity = 1,
  fontSize = 1.2,
  fontFamily = "Inter",
  textMargin = "0 0 0 0",
  wobbleChars = true,
  emitHearts = false,
  proximityThreshold = 80,
  clickShockWave = 2,
  onClick,
  style,
  className,
}) => {
  // ── Derived geometry ──────────────────────────────────────────────────────
  const radius = height / 2;
  const canvasInset = Math.max(bulgeAmount * 2, 8);
  const canvasWidth = width + canvasInset * 2;
  const canvasHeight = height + canvasInset * 2;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const wrapRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const shapeRef = useRef<SVGPathElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  /** Array refs for individual char spans — populated during render */
  const charEls = useRef<(HTMLSpanElement | null)[]>([]);

  // ── Displayed text (animated transitions) ────────────────────────────────
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const fillRef = useRef(fillColor);
  fillRef.current = fillColor;

  // Characters split for per-char animation
  const characters = displayText.split("");

  // ── Physics state (never triggers re-renders) ─────────────────────────────
  const points = useRef<Point[]>([]);
  const charOffsets = useRef<CharOffset[]>([]);
  const centerX = useRef(0);
  const centerY = useRef(0);
  const sleeping = useRef(true);
  const isUpdating = useRef(false);
  const deactivateQueued = useRef(false);
  const pointerInside = useRef(false);
  const rafHandle = useRef<number | null>(null);
  const isAlive = useRef(true);
  const heartEmitter = useRef<HeartEmitter | null>(null);
  const animatingText = useRef(false);
  const pendingText = useRef<string | null>(null);
  const currentFill = useRef(fillColor);
  const outTweenRef = useRef<any>(null);
  const inTweenRef = useRef<any>(null);

  // ── initPoints ────────────────────────────────────────────────────────────
  const initPoints = useCallback(() => {
    const pts: Point[] = [];
    const r = radius;
    const halfW = width / 2 - r;
    const straight = halfW * 2;
    const arc = Math.PI * r;
    const perimeter = straight * 2 + arc * 2;

    for (let i = 0; i < pointCount; i++) {
      const t = (i / pointCount) * perimeter;
      let bx: number, by: number, nx: number, ny: number;

      if (t < straight) {
        // top edge (left → right)
        const frac = t / straight;
        bx = -halfW + frac * straight;
        by = -r;
        nx = 0;
        ny = -1;
      } else if (t < straight + arc) {
        // right semicircle
        const ang = -Math.PI / 2 + ((t - straight) / arc) * Math.PI;
        bx = halfW + Math.cos(ang) * r;
        by = Math.sin(ang) * r;
        nx = Math.cos(ang);
        ny = Math.sin(ang);
      } else if (t < straight * 2 + arc) {
        // bottom edge (right → left)
        const frac = (t - straight - arc) / straight;
        bx = halfW - frac * straight;
        by = r;
        nx = 0;
        ny = 1;
      } else {
        // left semicircle
        const ang = Math.PI / 2 + ((t - straight * 2 - arc) / arc) * Math.PI;
        bx = -halfW + Math.cos(ang) * r;
        by = Math.sin(ang) * r;
        nx = Math.cos(ang);
        ny = Math.sin(ang);
      }

      pts.push({
        baseX: bx,
        baseY: by,
        x: bx,
        y: by,
        vx: 0,
        vy: 0,
        targetX: bx,
        targetY: by,
        nx,
        ny,
      });
    }
    points.current = pts;
  }, [width, height, pointCount, radius]);

  // ── initCharOffsets ───────────────────────────────────────────────────────
  const initCharOffsets = useCallback((count: number) => {
    if (charOffsets.current.length !== count) {
      charOffsets.current = Array.from({ length: count }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 0,
        targetY: 0,
        rotation: 0,
        targetRotation: 0,
        vr: 0,
      }));
    }
  }, []);

  // ── cacheRect ─────────────────────────────────────────────────────────────
  const cacheRect = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    centerX.current = rect.left + rect.width / 2;
    centerY.current = rect.top + rect.height / 2;
  }, []);

  // ── getDistanceToButton ───────────────────────────────────────────────────
  const getDistanceToButton = useCallback(
    (mx: number, my: number) => {
      const cx = centerX.current;
      const cy = centerY.current;
      const r = radius;
      const halfW = Math.max(0, width / 2 - r);

      // Project mouse onto the horizontal line segment of the pill shape
      const projX = Math.max(cx - halfW, Math.min(mx, cx + halfW));
      const dx = mx - projX;
      const dy = my - cy;
      const distToSkeleton = Math.sqrt(dx * dx + dy * dy);
      return distToSkeleton - r;
    },
    [width, radius],
  );

  // ── buildSvgPath ──────────────────────────────────────────────────────────
  const buildSvgPath = useCallback((): string => {
    const pts = points.current;
    const n = pts.length;
    if (n < 3) return "";
    const ox = width / 2 + canvasInset;
    const oy = height / 2 + canvasInset;
    let d = `M ${pts[0].x + ox} ${pts[0].y + oy}`;
    const tension = 0.5;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const cur = pts[i];
      const next = pts[(i + 1) % n];
      const next2 = pts[(i + 2) % n];
      const cp1x = cur.x + (next.x - prev.x) * (tension / 3);
      const cp1y = cur.y + (next.y - prev.y) * (tension / 3);
      const cp2x = next.x - (next2.x - cur.x) * (tension / 3);
      const cp2y = next.y - (next2.y - cur.y) * (tension / 3);
      d += ` C ${cp1x + ox} ${cp1y + oy}, ${cp2x + ox} ${cp2y + oy}, ${
        next.x + ox
      } ${next.y + oy}`;
    }
    return `${d} Z`;
  }, [width, height, canvasInset]);

  // ── commitPath (direct DOM write) ─────────────────────────────────────────
  const commitPath = useCallback(() => {
    if (!isAlive.current) return;
    const shape = shapeRef.current;
    if (!shape) return;
    shape.setAttribute("d", buildSvgPath());
  }, [buildSvgPath]);

  // ── commitCharStyles (direct DOM write) ───────────────────────────────────
  const commitCharStyles = useCallback(() => {
    if (!isAlive.current) return;
    const offs = charOffsets.current;
    charEls.current.forEach((el, i) => {
      if (!el || !offs[i]) return;
      el.style.transform = `translate(${offs[i].x}px, ${offs[i].y}px) rotate(${offs[i].rotation}deg)`;
    });
  }, []);

  // ── snapToBase ────────────────────────────────────────────────────────────
  const snapToBase = useCallback(() => {
    for (const p of points.current) {
      p.x = p.baseX;
      p.y = p.baseY;
      p.vx = p.vy = 0;
      p.targetX = p.baseX;
      p.targetY = p.baseY;
    }
    for (const c of charOffsets.current) {
      c.x =
        c.y =
        c.vx =
        c.vy =
        c.rotation =
        c.targetX =
        c.targetY =
        c.targetRotation =
        c.vr =
          0;
    }
    commitPath();
    commitCharStyles();
  }, [commitPath, commitCharStyles]);

  // ── updatePoint ───────────────────────────────────────────────────────────
  const updatePoint = (p: Point) => {
    p.vx += (p.targetX - p.x) * stiffness;
    p.vy += (p.targetY - p.y) * stiffness;
    p.vx *= damping;
    p.vy *= damping;
    p.x += p.vx;
    p.y += p.vy;
  };

  // ── updateCharOffsets ─────────────────────────────────────────────────────
  const updateCharOffsets = (
    cx: number,
    cy: number,
    influRad: number,
    active: boolean,
  ): number => {
    if (!wobbleChars) return 0;
    const offs = charOffsets.current;
    const len = offs.length;
    if (!len) return 0;
    const spacing = (width * 0.7) / Math.max(len, 1);
    let maxVel = 0;
    const k = stiffness * 1.5;

    for (let i = 0; i < len; i++) {
      const c = offs[i];
      if (active) {
        const charCX = cx + (i - (len - 1) / 2) * spacing;
        const dx = mouse.x - charCX;
        const dy = mouse.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < influRad && dist > 0.001) {
          const norm = 1 - dist / influRad;
          const smooth = norm * norm * (3 - 2 * norm);
          const push = bulgeAmount * 0.6 * smooth;
          c.targetX = (dx / dist) * -push * 0.3;
          c.targetY = (dy / dist) * -push;
          c.targetRotation = (dx / influRad) * 15 * smooth;
        } else {
          c.targetX = c.targetY = c.targetRotation = 0;
        }
      } else {
        c.targetX = c.targetY = c.targetRotation = 0;
      }

      c.vx += (c.targetX - c.x) * k;
      c.vy += (c.targetY - c.y) * k;
      c.vr += (c.targetRotation - c.rotation) * k;
      c.vx *= damping;
      c.vy *= damping;
      c.vr *= damping;
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.vr;

      maxVel = Math.max(
        maxVel,
        Math.abs(c.vx),
        Math.abs(c.vy),
        Math.abs(c.vr),
        Math.abs(c.x),
        Math.abs(c.y),
        Math.abs(c.rotation),
      );
    }
    return maxVel;
  };

  // ── applyMouseInfluence ───────────────────────────────────────────────────
  const applyMouseInfluence = (cx: number, cy: number, influRad: number) => {
    for (const p of points.current) {
      const wx = cx + p.x;
      const wy = cy + p.y;
      const dx = mouse.x - wx;
      const dy = mouse.y - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < influRad && dist > 0.001) {
        const norm = 1 - dist / influRad;
        const smooth = norm * norm * (3 - 2 * norm);
        p.targetX = p.baseX + p.nx * bulgeAmount * smooth;
        p.targetY = p.baseY + p.ny * bulgeAmount * smooth;
      } else {
        p.targetX = p.baseX;
        p.targetY = p.baseY;
      }
    }
  };

  // ── deactivate helpers ────────────────────────────────────────────────────
  const deactivateUpdates = useCallback(() => {
    if (isUpdating.current) {
      if (rafHandle.current !== null) {
        cancelAnimationFrame(rafHandle.current);
        rafHandle.current = null;
      }
      isUpdating.current = false;
    }
  }, []);

  const queueDeactivate = useCallback(() => {
    if (!deactivateQueued.current) {
      deactivateQueued.current = true;
      queueMicrotask(() => {
        deactivateQueued.current = false;
        if (sleeping.current) deactivateUpdates();
      });
    }
  }, [deactivateUpdates]);

  // ── RAF update loop ───────────────────────────────────────────────────────
  const update = useCallback(() => {
    if (!isAlive.current) return;

    const cx = centerX.current;
    const cy = centerY.current;
    const distToEdge = getDistanceToButton(mouse.x, mouse.y);
    const influRad = proximityThreshold + radius;
    const active = distToEdge < proximityThreshold;

    if (sleeping.current && !active) {
      queueDeactivate();
      return;
    }

    if (active) {
      sleeping.current = false;
      applyMouseInfluence(cx, cy, influRad);
    } else {
      for (const p of points.current) {
        p.targetX = p.baseX;
        p.targetY = p.baseY;
      }
    }

    let maxV = 0;
    for (const p of points.current) {
      updatePoint(p);
      maxV = Math.max(
        maxV,
        Math.abs(p.vx),
        Math.abs(p.vy),
        Math.abs(p.x - p.baseX),
        Math.abs(p.y - p.baseY),
      );
    }
    maxV = Math.max(maxV, updateCharOffsets(cx, cy, influRad, active));

    const threshold = 0.2;
    if (!active && maxV < threshold) {
      snapToBase();
      sleeping.current = true;
      queueDeactivate();
      return;
    }

    commitPath();
    commitCharStyles();

    rafHandle.current = requestAnimationFrame(update);
  }, [
    proximityThreshold,
    radius,
    stiffness,
    damping,
    bulgeAmount,
    wobbleChars,
    width,
    getDistanceToButton,
    commitPath,
    commitCharStyles,
    snapToBase,
    queueDeactivate,
  ]);

  const activateUpdates = useCallback(() => {
    if (!isUpdating.current) {
      isUpdating.current = true;
      rafHandle.current = requestAnimationFrame(update);
    }
  }, [update]);

  // ── Mouse activity handler ────────────────────────────────────────────────
  const handleMouseActivity = useCallback(() => {
    if (!wrapRef.current) return;
    // Re-measure every time: getBoundingClientRect at mouse-event time is always
    // the true visual position, even during a parent entrance animation.
    cacheRect();
    const distToEdge = getDistanceToButton(mouse.x, mouse.y);
    if (distToEdge < proximityThreshold) {
      sleeping.current = false;
      activateUpdates();
    }
  }, [cacheRect, getDistanceToButton, proximityThreshold, activateUpdates]);

  // ── Trigger shockwave ─────────────────────────────────────────────────────
  const triggerShockwave = useCallback(
    (force = 3) => {
      for (const p of points.current) {
        p.vx += p.nx * force;
        p.vy += p.ny * force;
      }
      if (wobbleChars) {
        const offs = charOffsets.current;
        for (let i = 0; i < offs.length; i++) {
          const frac = i / (offs.length - 1 || 1) - 0.5;
          offs[i].vy -= force * 0.5;
          offs[i].vx += frac * force * 0.3;
        }
      }
      sleeping.current = false;
      activateUpdates();
      commitPath();
      commitCharStyles();
    },
    [wobbleChars, activateUpdates, commitPath, commitCharStyles],
  );

  // ── Text transition ───────────────────────────────────────────────────────
  const animateTextChange = useCallback(
    (next: string) => {
      if (animatingText.current) {
        pendingText.current = next;
        return;
      }
      animatingText.current = true;

      if (next === displayText) {
        animatingText.current = false;
        if (pendingText.current !== null) {
          const t = pendingText.current;
          pendingText.current = null;
          animateTextChange(t);
        }
        return;
      }

      // Kill any running in-tween
      if (inTweenRef.current) {
        inTweenRef.current.kill();
        inTweenRef.current = null;
      }

      // Animate out
      const outEls = Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>(
          ".wobbly-btn__char",
        ) ?? [],
      );
      if (outEls.length) {
        outTweenRef.current = gsap.to(outEls, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "back.in(1.7)",
          onComplete: () => {
            outTweenRef.current = null;
            setDisplayText(next);
          },
        });
      } else {
        setDisplayText(next);
      }
    },
    [setDisplayText, displayText],
  );

  // Animate characters in when displayText changes
  useEffect(() => {
    let active = true;
    const inEls = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>(".wobbly-btn__char") ??
        [],
    );
    if (inEls.length) {
      animatingText.current = true;
      // Kill any running out-tween
      if (outTweenRef.current) {
        outTweenRef.current.kill();
        outTweenRef.current = null;
      }
      inTweenRef.current = gsap.fromTo(
        inEls,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.03,
          ease: "elastic.out(1, 0.5)",
          onComplete: () => {
            inTweenRef.current = null;
            if (!active) return;
            animatingText.current = false;
            if (pendingText.current !== null) {
              const t = pendingText.current;
              pendingText.current = null;
              animateTextChange(t);
            }
          },
        },
      );
    } else {
      animatingText.current = false;
      if (pendingText.current !== null) {
        const t = pendingText.current;
        pendingText.current = null;
        animateTextChange(t);
      }
    }

    return () => {
      active = false;
      if (inTweenRef.current) {
        inTweenRef.current.kill();
        inTweenRef.current = null;
      }
    };
  }, [displayText, animateTextChange]);

  // ── Hover colour ──────────────────────────────────────────────────────────
  const resolvedHoverColor = hoverColor ?? lightenColor(fillColor, 0.15);
  const currentFillColor = isHovered ? resolvedHoverColor : fillColor;

  // Keep the SVG fill in sync without a re-render via direct DOM write
  useEffect(() => {
    if (shapeRef.current) {
      shapeRef.current.style.fill = currentFillColor;
    }
  }, [currentFillColor]);

  // ── Hovered state side-effects ────────────────────────────────────────────
  useEffect(() => {
    if (hoverText) {
      const next = isHovered ? hoverText : text;
      animateTextChange(next);
    }
    if (emitHearts) {
      if (!heartEmitter.current) heartEmitter.current = new HeartEmitter();
      if (isHovered && particlesRef.current) {
        heartEmitter.current.start(particlesRef.current, width, height, () => {
          const span = document.createElement("span");
          span.textContent = "🤍";
          span.style.fontSize = 0.6 + Math.random() * 0.6 + "rem";
          return span;
        });
      } else {
        heartEmitter.current.stop();
      }
    }
  }, [isHovered]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    isAlive.current = true;

    const onMouseMove = () => handleMouseActivity();
    const onMouseDown = () => handleMouseActivity();
    const onMouseUp = () => handleMouseActivity();
    const onScroll = () => cacheRect();
    const onResize = () => {
      initPoints();
      initCharOffsets(displayText.length);
      snapToBase();
      sleeping.current = true;
      queueDeactivate();
      requestAnimationFrame(() => setTimeout(cacheRect, 0));
    };

    initPoints();
    initCharOffsets(displayText.length);
    commitPath();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      isAlive.current = false;
      deactivateUpdates();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, { capture: true });
      heartEmitter.current?.stop();
      outTweenRef.current?.kill();
      inTweenRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialize when dimensions / pointCount change
  useEffect(() => {
    initPoints();
    sleeping.current = false;
    activateUpdates();
  }, [width, height, pointCount, initPoints, activateUpdates]);

  // Re-initialize char offsets when text changes
  useEffect(() => {
    initCharOffsets(characters.length);
    charEls.current = charEls.current.slice(0, characters.length);
  }, [characters.length, initCharOffsets]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent) => {
    triggerShockwave(clickShockWave);
    onClick?.(e);
  };

  // ── Pointer enter / leave ─────────────────────────────────────────────────
  const handlePointerEnter = () => {
    pointerInside.current = true;
    setIsHovered(true);
    cacheRect();
    handleMouseActivity();
  };
  const handlePointerLeave = () => {
    pointerInside.current = false;
    setIsHovered(false);
    sleeping.current = false;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <button
      ref={wrapRef}
      className={`wobbly-btn${className ? ` ${className}` : ""}`}
      style={{
        width,
        height,
        ...style,
      }}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Dynamic wobbly SVG */}
      <svg
        ref={svgRef}
        className="wobbly-btn__svg"
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        style={{
          marginLeft: `-${canvasInset}px`,
          marginTop: `-${canvasInset}px`,
        }}
        aria-hidden
      >
        <path
          ref={shapeRef}
          style={{
            fill: currentFillColor,
            transition: "fill 0.25s ease",
          }}
        />
      </svg>

      {/* Heart particles */}
      <div ref={particlesRef} className="wobbly-btn__particles" />

      {/* Text content */}
      <div
        ref={contentRef}
        className="wobbly-btn__content"
        style={{
          color: textColor,
          fontSize: `${fontSize}rem`,
          fontFamily: `${fontFamily}`,
          margin: textMargin,
          opacity: isHovered ? 1 : textOpacity,
          transition: "opacity 0.25s ease",
        }}
      >
        {characters.map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              charEls.current[i] = el;
            }}
            className="wobbly-btn__char"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>
    </button>
  );
};

export default WobbleButton;
