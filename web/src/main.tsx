// App entry point: mount React, wrap it in our providers, load styles.

import { createRoot } from "react-dom/client";
import "./index.css";
import "./app.css";
import "./lib/motion"; // configures GSAP once, as a side effect
import { reduceMotion } from "./lib/motion";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./components/Toast";

// Tell the stylesheet that JS motion is on, so [data-reveal] elements
// start hidden and we animate them in. (If the user prefers reduced
// motion we skip this, and everything is simply visible.)
if (!reduceMotion) {
  document.documentElement.classList.add("has-motion");
}

// Note: we intentionally do NOT use <React.StrictMode> here. In dev it
// mounts every component twice, which makes scroll-animations initialise
// twice and can flicker. Leaving it off keeps the motion clean and the
// behaviour easy to follow.
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>
);
