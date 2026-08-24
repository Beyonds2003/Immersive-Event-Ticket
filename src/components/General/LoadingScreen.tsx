import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useAtomValue } from "jotai";
import { isPhysicsLoadedAtom } from "../../libs/atoms";
import gsap from "gsap";

interface AnimatedProgressDigitProps {
  digit: string;
}

const AnimatedProgressDigit: React.FC<AnimatedProgressDigitProps> = ({
  digit,
}) => {
  const [current, setCurrent] = useState(digit);
  const [prev, setPrev] = useState<string | null>(null);

  const containerRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (digit !== current) {
      setPrev(current);
      setCurrent(digit);
    }
  }, [digit, current]);

  useEffect(() => {
    if (prev === null || !currentRef.current || !prevRef.current) return;

    const ctx = gsap.context(() => {
      gsap.killTweensOf([prevRef.current, currentRef.current]);

      // Outgoing digit slides down
      gsap.fromTo(
        prevRef.current,
        { yPercent: 0, opacity: 1 },
        {
          yPercent: 100,
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
        },
      );

      // Incoming digit slides in from top
      gsap.fromTo(
        currentRef.current,
        { yPercent: -100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => {
            setPrev(null);
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [current, prev]);

  return (
    <span ref={containerRef} className="progress-loader-digit">
      {prev !== null && (
        <span
          ref={prevRef}
          className="progress-loader-char progress-loader-char-prev"
        >
          {prev}
        </span>
      )}
      <span
        ref={currentRef}
        className="progress-loader-char progress-loader-char-curr"
      >
        {current}
      </span>
    </span>
  );
};

const LoadingScreen: React.FC = () => {
  const { progress, active } = useProgress();
  const isPhysicsLoaded = useAtomValue(isPhysicsLoadedAtom);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isRendered, setIsRendered] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressObj = useRef({ value: 0 });

  // Calculate target progress from 3D assets & physics engine
  useEffect(() => {
    let target = 0;

    if (!active && progress === 0) {
      target = isPhysicsLoaded ? 100 : 25;
    } else {
      // Drei progress is 0-100 (75% weight) + Physics (25% weight)
      const assetPart = (progress / 100) * 75;
      const physicsPart = isPhysicsLoaded ? 25 : 0;
      target = Math.min(100, Math.round(assetPart + physicsPart));

      if ((!active || progress >= 100) && isPhysicsLoaded) {
        target = 100;
      }
    }

    // Fallback safety: ensure loader completes even if assets resolve instantaneously
    const fallbackTimer = setTimeout(() => {
      if (progressObj.current.value < 100) {
        gsap.to(progressObj.current, {
          value: 100,
          duration: 0.8,
          ease: "power1.out",
          onUpdate: () => {
            setDisplayProgress(Math.round(progressObj.current.value));
          },
          onComplete: () => {
            setIsDone(true);
          },
        });
      }
    }, 4000);

    const tween = gsap.to(progressObj.current, {
      value: target,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: () => {
        setDisplayProgress(Math.round(progressObj.current.value));
      },
      onComplete: () => {
        if (target >= 100) {
          setIsDone(true);
        }
      },
    });

    return () => {
      clearTimeout(fallbackTimer);
      tween.kill();
    };
  }, [progress, active, isPhysicsLoaded]);

  // Stop video when loading completes
  // useEffect(() => {
  //   if (isDone && videoRef.current) {
  //     videoRef.current.pause();
  //   }
  // }, [isDone]);

  // Smooth fade-out when loading is 100% complete
  useEffect(() => {
    if (!isDone || !overlayRef.current) return;

    const timer = setTimeout(() => {
      gsap.to(overlayRef.current, {
        y: "-100%",
        // scale: 1.03,
        // opacity: 0.5,
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => {
          setIsRendered(false);
        },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [isDone]);

  if (!isRendered) return null;

  const digits = String(displayProgress).padStart(2, "0").split("");

  return (
    <div ref={overlayRef} className="progress-loader-overlay">
      <div className="progress-loader-center">
        <div className="loader-media">
          <img
            className={`loader-fallback-image${showFallback ? " visible" : ""}`}
            src="/images/intro-icon.png"
            alt="Loading"
          />
          <video
            ref={videoRef}
            className={`loader-video${showFallback ? "" : " visible"}`}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlayThrough={() => setShowFallback(false)}
            onError={() => setShowFallback(true)}
          >
            <source src="/images/intro-animation.webm" type="video/webm" />
          </video>
        </div>
        <div className="progress-loader-countdown">
          {digits.map((d, i) => (
            <AnimatedProgressDigit key={i} digit={d} />
          ))}
          <span className="progress-loader-unit"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
