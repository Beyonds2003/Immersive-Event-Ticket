import * as React from "react";
import type { SVGProps } from "react";
type ArrowProps = SVGProps<SVGSVGElement> & {
  direction?: "left" | "right";
  size?: number | string;
};

const Arrow = ({
  direction = "right",
  size = 24,
  style,
  ...props
}: ArrowProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    aria-hidden="true"
    focusable="false"
    style={{
      transform: direction === "left" ? "scaleX(-1)" : undefined,
      ...style,
    }}
    {...props}
  >
    <path
      d="M9 5l7 7-7 7"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Arrow;
