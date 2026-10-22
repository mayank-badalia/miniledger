// A small amber dot that trails the mouse with a gentle lag, giving the
// site a "crafted" feel. It's pure decoration: hidden on touch devices
// and for reduced-motion users (handled in CSS + the early return here).

import { useRef, useLayoutEffect } from "react";
import { gsap, reduceMotion, isTouch } from "../lib/motion";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const dot = dotRef.current;
    if (!dot || reduceMotion || isTouch) return;

    // quickTo makes a reusable setter that eases toward a value — perfect
    // for following the pointer smoothly without creating a tween per move.
    const xTo = gsap.quickTo(dot, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(dot, "y", { duration: 0.4, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("pointermove", onMove);

    // Grow the dot over clickable things so it feels interactive.
    const grow = () => gsap.to(dot, { scale: 2.4, duration: 0.3 });
    const shrink = () => gsap.to(dot, { scale: 1, duration: 0.3 });
    const targets = document.querySelectorAll("a, button, .input");
    targets.forEach((t) => {
      t.addEventListener("pointerenter", grow);
      t.addEventListener("pointerleave", shrink);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      targets.forEach((t) => {
        t.removeEventListener("pointerenter", grow);
        t.removeEventListener("pointerleave", shrink);
      });
    };
  }, []);

  if (reduceMotion || isTouch) return null;
  return <div className="cursor" ref={dotRef} aria-hidden="true" />;
}
