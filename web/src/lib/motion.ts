// The one place that configures our animation engine.
// Import this once (we do it in main.tsx) and GSAP is ready everywhere.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// House style for every tween unless a component overrides it:
// a calm, cinematic ease and a ~0.85s duration.
gsap.defaults({ ease: "power3.out", duration: 0.85 });

// Respect the OS "reduce motion" setting. When true, we skip all the
// decorative animation and just show content.
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A pointer:coarse device is a touchscreen — no custom cursor / magnetic hover.
export const isTouch = window.matchMedia("(pointer: coarse)").matches;

export { gsap, ScrollTrigger };
