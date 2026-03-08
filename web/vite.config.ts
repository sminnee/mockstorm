import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: Number(process.env.FRONTEND_PORT) || 5173,
    hmr: {
      port: Number(process.env.FRONTEND_HMR_PORT) || 5174,
    },
  },
});
