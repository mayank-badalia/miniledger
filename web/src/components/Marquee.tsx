// <Marquee> is the infinite scrolling "tape". It never ends because we
// render the same list of words TWICE side-by-side and slide the track
// left by exactly one copy's width, then loop. The seam is invisible.

import { useRef, useLayoutEffect } from "react";
import { gsap, reduceMotion } from "../lib/motion";

interface MarqueeProps {
  items: string[];
  speed?: number; // seconds for one full loop (bigger = slower)
  direction?: 1 | -1; // 1 = scroll left, -1 = scroll right
}

export function Marquee({ items, speed = 22, direction = 1 }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return;

    // Start at -50% if moving right, so it's already full on screen.
    const from = direction === 1 ? 0 : -50;
    const to = direction === 1 ? -50 : 0;

    gsap.set(track, { xPercent: from });
    const tween = gsap.to(track, {
      xPercent: to,
      duration: speed,
      ease: "none",
      repeat: -1, // forever
    });

    return () => {
      tween.kill();
    };
  }, [speed, direction]);

  // One visual row of items.
  const row = (
    <div className="tape__row" aria-hidden="true">
      {items.map((text, i) => (
        <span className="tape__item" key={i}>
          {text}
        </span>
      ))}
    </div>
  );

  return (
    <div className="tape">
      <div className="tape__track" ref={trackRef} style={{ display: "flex" }}>
        {row}
        {row /* the second copy that makes the loop seamless */}
      </div>
    </div>
  );
}
