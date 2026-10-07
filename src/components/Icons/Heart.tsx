import * as React from "react";
import { useEffect, useRef, type SVGProps } from "react";
import gsap from "gsap";

type Props = SVGProps<SVGSVGElement> & {
  isLikeClicked: boolean;
};

const NUMBER_OF_PARTICLE = 10;
const MAX_FADE_DURATION = 1000 + 1000;
const MIN_FADE_DURATION = 1000;
const MAX_DISTANCE = 52;
const MIN_DISTANCE = 40;
const FADE_DELAY = 1000;
const JITTER = 40;

const range = (n: number) => [...Array(n).keys()];
const random = (
  lower: number = 0,
  upper: number = 1,
  floating?: boolean,
): number => {
  if (lower > upper) {
    [lower, upper] = [upper, lower];
  }
  const isFloating = floating || lower % 1 !== 0 || upper % 1 !== 0;
  if (isFloating) {
    return Math.random() * (upper - lower) + lower;
  }
  return lower + Math.floor(Math.random() * (upper - lower + 1));
};

const Heart = ({ isLikeClicked, ...props }: Props) => {
  const btn = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!btn.current) return;

    if (isLikeClicked) {
      const particles: any = [];

      range(NUMBER_OF_PARTICLE).forEach((index) => {
        const particle = document.createElement("span");
        particle.classList.add("particle");

        const angle =
          (360 / NUMBER_OF_PARTICLE) * index + random(-JITTER, JITTER);
        const distance = random(MIN_DISTANCE, MAX_DISTANCE);

        const fromColor = random(0, 360);
        const toColor = fromColor + 180;

        particle.style.setProperty("--angle", angle + "deg");
        particle.style.setProperty("--distance", distance + "px");
        particle.style.setProperty(
          "--fade-duration",
          random(MAX_FADE_DURATION, MIN_FADE_DURATION) + "ms",
        );
        particle.style.setProperty("--size", random(8, 14) + "px");
        particle.style.setProperty(
          "--twinkle-duration",
          random(150, 300) + "ms",
        );
        particle.style.setProperty(
          "--fade-delay",
          random(0, FADE_DELAY) + "ms",
        );
        particle.style.setProperty("--pop-duration", random(500, 1000) + "ms");
        particle.style.setProperty("--twinkle-amount", String(random(0.5, 1)));
        particle.style.setProperty(
          "--from-color",
          `hsl(${fromColor}deg 100% 80%)`,
        );
        particle.style.setProperty("--to-color", `hsl(${toColor}deg 100% 80%)`);

        particles.push(particle);
      });

      window.setTimeout(() => {
        particles.forEach((particle: any) => {
          btn.current?.appendChild(particle);
        });
      }, 10);

      // Clean Up
      window.setTimeout(
        () => {
          particles.forEach((particle: any) => {
            particle.remove();
          });
        },
        MAX_FADE_DURATION + FADE_DELAY + 200,
      );
    }
  }, [isLikeClicked]);

  return (
    <div ref={btn} className="heart-icon-container">
      <span className="popCircle"></span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3.68546 5.43796C8.61936 1.29159 11.8685 7.4309 12.0406 7.4309C12.2126 7.43091 15.4617 1.29159 20.3956 5.43796C26.8941 10.8991 13.5 21.8215 12.0406 21.8215C10.5811 21.8215 -2.81297 10.8991 3.68546 5.43796Z"
          stroke={isLikeClicked ? "black" : "black"}
          stroke-width="2"
          stroke-linecap="round"
          fill={isLikeClicked ? "red" : "transparent"}
        />
      </svg>
      <span className="visually-hidden">Like this post</span>
    </div>
  );
};
export default Heart;
