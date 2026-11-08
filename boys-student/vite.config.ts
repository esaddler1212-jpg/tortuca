import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.BOYS_API_PROXY ?? "http://127.0.0.1:8888";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
