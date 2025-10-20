import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ffp/core": path.resolve(__dirname, "../core/src"),
    },
  },
  server: {
    port: 3000,
  },
});
