// <CountUp> animates a number from 0 up to its value when it appears.
// We use it for the summary figures so they "roll up" like a counter.
// The value is formatted through whatever function you pass (e.g. money()).

import { useRef, useLayoutEffect } from "react";
import { gsap, reduceMotion } from "../lib/motion";

interface CountUpProps {
  value: number;
  format: (n: number) => string;
  className?: string;
}

export function CountUp({ value, format, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No animation for reduced motion — just print the final value.
    if (reduceMotion) {
      el.textContent = format(value);
      return;
    }

    // Animate a plain object's `n` from 0 to value, and on every frame
    // write the formatted number into the element.
    const counter = { n: 0 };
    const tween = gsap.to(counter, {
      n: value,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = format(counter.n);
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, format]);

  // Start showing the formatted value immediately (helps if JS is slow).
  return <span ref={ref} className={className}>{format(value)}</span>;
}
