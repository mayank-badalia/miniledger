// <Magnetic> makes its child drift toward the pointer while hovered, then
// spring back on leave. Great for buttons — subtle, not gimmicky.
// Wrap a single element:  <Magnetic><button ...>Send</button></Magnetic>

import { useRef, useLayoutEffect, ReactNode } from "react";
import { gsap, reduceMotion, isTouch } from "../lib/motion";

export function Magnetic({
  children,
  strength = 0.4,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el || reduceMotion || isTouch) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Distance of the pointer from the element's centre, scaled down.
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const reset = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, [strength]);

  // The wrapper is display:contents so it doesn't affect layout.
  return (
    <span ref={ref} style={{ display: "contents" }}>
      {children}
    </span>
  );
}
