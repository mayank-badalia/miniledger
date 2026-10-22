// Sets up Lenis smooth scrolling and keeps it in sync with GSAP's
// ScrollTrigger. Call this hook ONCE, near the top of the app.
//
// Why drive Lenis from the GSAP ticker instead of its own loop?
// So there is a single animation clock. That keeps scroll-triggered
// animations perfectly aligned with the smooth scroll position.

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, reduceMotion } from "./motion";

export function useLenis() {
  useEffect(() => {
    // People who asked for reduced motion get the browser's normal scroll.
    if (reduceMotion) return;

    const lenis = new Lenis({
      lerp: 0.09, // lower = smoother/slower catch-up
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });

    // Whenever Lenis scrolls, let ScrollTrigger recalculate.
    lenis.on("scroll", ScrollTrigger.update);

    // One clock: GSAP's ticker advances Lenis every frame.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Clean up if the app unmounts (prevents duplicate loops).
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);
}
