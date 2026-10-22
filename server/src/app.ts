// Builds the Express app (routes, middleware) WITHOUT starting the server.
// Keeping this separate from index.ts lets both the local server AND the
// Vercel serverless function (api/index.ts) reuse the exact same app.

import express from "express";
import cors from "cors";

import { ensureSchema } from "./db";
import authRoutes from "./routes/auth";
import loanRoutes from "./routes/loans";
import summaryRoutes from "./routes/summary";

export function createApp() {
  const app = express();

  // Allow the frontend to call this API. In production the frontend and API
  // are served from the SAME Vercel domain, so CORS isn't strictly needed,
  // but this keeps local dev (different port) and any other origin working.
  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? true }));

  // Parse JSON bodies — but safely on serverless. On Vercel the request body
  // can already be parsed into req.body; re-reading the (consumed) stream
  // would hang, so we skip parsing again in that case.
  const jsonParser = express.json({ limit: "3mb" });
  app.use((req, res, next) => {
    const isJson = req.headers["content-type"]?.includes("application/json");
    if (isJson && req.body !== undefined) return next();
    jsonParser(req, res, next);
  });

  // A tiny health check, handy for "is the server up?". Declared BEFORE the
  // database middleware so it answers even if the DB isn't configured yet.
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Make sure the database tables exist. ensureSchema() caches its work, so
  // this is effectively free after the first request on each instance.
  app.use(async (_req, _res, next) => {
    try {
      await ensureSchema();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Feature routes.
  app.use("/api/auth", authRoutes);
  app.use("/api/loans", loanRoutes);
  app.use("/api/summary", summaryRoutes);

  return app;
}
