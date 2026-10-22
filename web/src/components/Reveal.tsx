// <Reveal> wraps any content and fades/slides it up the first time it
// scrolls into view. Use it like a normal <div>:
//
//   <Reveal><h2>Hello</h2></Reveal>
//   <Reveal delay={0.1}>...</Reveal>
//
// All the GSAP wiring is hidden in here so the pages stay clean.

import { useRef, useLayoutEffect, ReactNode } from "react";
import { gsap, reduceMotion } from "../lib/motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  // useLayoutEffect runs right after the DOM is painted, so there's no
  // flash of the element in its final position before we animate it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: just show it, no animation.
    if (reduceMotion) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }

    // gsap.context scopes and auto-cleans every animation created inside it.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 34, autoAlpha: 0, filter: "blur(8px)" },
        {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.95,
          ease: "power4.out",
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 85%", // begin when the top hits 85% down the screen
            once: true, // animate a single time
          },
        }
      );
    }, el);

    return () => ctx.revert(); // undo everything if this unmounts
  }, [delay]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
