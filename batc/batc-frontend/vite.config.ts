import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the app under /BATC_AGRISYSTEM_NEXTVERS/.
  // In dev (vite serve) we stay at "/" so the proxy works as usual.
  base: command === "build" ? "/BATC_AGRISYSTEM_NEXTVERS/" : "/",
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
}));
