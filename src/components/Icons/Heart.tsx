import * as React from "react";
import { type SVGProps } from "react";
const Heart = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M3.68546 6.43796C8.61936 2.29159 11.8685 8.4309 12.0406 8.4309C12.2126 8.43091 15.4617 2.29159 20.3956 6.43796C26.8941 11.8991 13.5 22.8215 12.0406 22.8215C10.5811 22.8215 -2.81297 11.8991 3.68546 6.43796Z"
      stroke="black"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);
export default Heart;
