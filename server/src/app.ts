// Builds the Express app (routes, middleware) WITHOUT starting the server.
// Keeping this separate from index.ts lets tests import the app directly.

import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth";
import loanRoutes from "./routes/loans";
import summaryRoutes from "./routes/summary";

export function createApp() {
  const app = express();

  // Allow the frontend (a different port) to call this API.
  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? true }));

  // Parse JSON request bodies.
  app.use(express.json());

  // Serve uploaded receipt photos as static files at /uploads/<name>.
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  // A tiny health check, handy for "is the server up?".
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Feature routes.
  app.use("/api/auth", authRoutes);
  app.use("/api/loans", loanRoutes);
  app.use("/api/summary", summaryRoutes);

  return app;
}
