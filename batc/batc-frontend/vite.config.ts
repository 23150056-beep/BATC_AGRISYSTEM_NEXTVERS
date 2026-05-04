import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // Log proxy errors so a down backend is obvious in the dev console
        // instead of silently surfacing as opaque "Network error" toasts.
        configure: (proxy) => {
          proxy.on("error", (err) => {
            // eslint-disable-next-line no-console
            console.error("[vite proxy] backend unreachable:", err.message);
          });
        },
      },
    },
  },
});
