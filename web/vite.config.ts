import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3847,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3848",
        changeOrigin: true,
      },
      "/docs": {
        target: "http://127.0.0.1:3848",
        changeOrigin: true,
      },
      "/openapi.json": {
        target: "http://127.0.0.1:3848",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3847,
  },
});
