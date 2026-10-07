import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedLikeCountProps {
  isLikeClicked: boolean;
  count: number;
}

const AnimatedLikeCount = ({
  isLikeClicked,
  count,
}: AnimatedLikeCountProps) => {
  const topSpanRef = useRef<HTMLSpanElement>(null);
  const centerSpanRef = useRef<HTMLSpanElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const top = topSpanRef.current;
    const center = centerSpanRef.current;
    if (!top || !center) return;

    const target = isLikeClicked ? 100 : 0;
    gsap.to([center, top], { yPercent: target, duration: 0.4, ease: "power2.out" });
  }, [isLikeClicked]);

  return (
    <div className="like-count-wrapper">
      <span ref={topSpanRef} className="like-count-top">
        {count + 1}
      </span>
      <span ref={centerSpanRef} className="like-count-center">
        {count}
      </span>
    </div>
  );
};

export default AnimatedLikeCount;

