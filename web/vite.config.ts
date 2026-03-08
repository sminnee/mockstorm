import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    exclude: ["@mockstorm/shared"],
  },
  server: {
    port: Number(process.env.FRONTEND_PORT) || 5173,
    hmr: {
      port: Number(process.env.FRONTEND_HMR_PORT) || 5174,
    },
    proxy: {
      "/api": `http://localhost:${process.env.SERVER_PORT || 3001}`,
      "/ws": {
        target: `http://localhost:${process.env.SERVER_PORT || 3001}`,
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
});
