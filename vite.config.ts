// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dev strategy:
// - Use Vite proxy for /api and /health to ECS so the browser stays same-origin.
// - This avoids CORS locally and requires no changes in the backend.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    port: 5173,
    host: "localhost",
    proxy: {
      "/api": {
        target: "http://47.236.164.215",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://47.236.164.215",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
