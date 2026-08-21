import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface AnimatedDigitProps {
  digit: string;
}

const AnimatedDigit: React.FC<AnimatedDigitProps> = ({ digit }) => {
  const [current, setCurrent] = useState(digit);
  const [prev, setPrev] = useState<string | null>(null);

  const containerRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<HTMLSpanElement>(null);

  // When digit prop changes, track previous digit for animation
  useEffect(() => {
    if (digit !== current) {
      setPrev(current);
      setCurrent(digit);
    }
  }, [digit, current]);

  // GSAP translateY animation for digit transition
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
        }
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
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [current, prev]);

  return (
    <span ref={containerRef} className="otp-countdown-digit">
      {prev !== null && (
        <span ref={prevRef} className="otp-countdown-char otp-countdown-char-prev">
          {prev}
        </span>
      )}
      <span ref={currentRef} className="otp-countdown-char otp-countdown-char-curr">
        {current}
      </span>
    </span>
  );
};

interface OtpCountdownProps {
  initialSeconds?: number;
  onComplete: () => void;
}

const OtpCountdown: React.FC<OtpCountdownProps> = ({
  initialSeconds = 60,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setTimeLeft(initialSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [initialSeconds]);

  const digits = String(timeLeft).padStart(2, "0").split("");

  return (
    <span className="otp-countdown" aria-label={`OTP resend available in ${timeLeft} seconds`}>
      {digits.map((d, i) => (
        <AnimatedDigit key={i} digit={d} />
      ))}
      <span className="otp-countdown-unit">s</span>
    </span>
  );
};

export default OtpCountdown;
