import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development, calls to "/api" and "/uploads" are forwarded to the
// backend on port 4000. This means the frontend code can just call
// fetch("/api/...") without worrying about CORS or the backend's address.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
