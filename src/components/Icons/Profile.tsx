import * as React from "react";
import { type SVGProps, useRef, useEffect } from "react";

const MAX_OFFSET = 3.2; // max SVG units the eyes can shift

const ProfileIcon = (props: SVGProps<SVGSVGElement>) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  const current = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);

      // Clamp to unit circle so diagonal feels natural
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const scale = Math.min(len, 1) / len;

      target.current = {
        x: dx * scale * MAX_OFFSET,
        y: dy * scale * MAX_OFFSET,
      };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const tick = () => {
      const LERP = 0.1;
      const cur = current.current;
      const tgt = target.current;

      cur.x += (tgt.x - cur.x) * LERP;
      cur.y += (tgt.y - cur.y) * LERP;

      if (groupRef.current) {
        groupRef.current.setAttribute(
          "transform",
          `translate(${cur.x.toFixed(3)} ${cur.y.toFixed(3)})`
        );
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      data-v-3fa20210=""
      className="profile-avatar"
      viewBox="0 0 44 44"
      aria-hidden="true"
      {...props}
    >
      <circle data-v-3fa20210="" cx={22} cy={22} r={22} fill="#9896F0" />
      <circle
        data-v-3fa20210=""
        className="avatar-face"
        cx={22}
        cy={22}
        r={11}
        fill="#F1E8DD"
      />
      {/* Eye group – translate driven by mouse position with lerp */}
      <g ref={groupRef} data-v-3fa20210="" transform="translate(0 0)">
        <circle data-v-3fa20210="" cx={17.8} cy={18.7} r={1.5} fill="#211C3B" />
        <circle data-v-3fa20210="" cx={26.2} cy={18.7} r={1.5} fill="#211C3B" />
      </g>
    </svg>
  );
};

export default ProfileIcon;
