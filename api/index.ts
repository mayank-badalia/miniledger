// Vercel serverless entry point for the whole API.
//
// Vercel turns this file into a function served at /api. Our vercel.json
// rewrites every /api/* request to it, and Express (reused from the local
// server) matches the real path. So one function serves all API routes.

import { createApp } from "../server/src/app";

const app = createApp();

export default app;
