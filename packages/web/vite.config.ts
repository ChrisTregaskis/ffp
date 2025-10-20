import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Workspace imports - point to source during development for HMR
      "@ffp/core": path.resolve(__dirname, "../core/src"),

      // Core package internal aliases (for when Vite processes core source files)
      // These are needed because the core package uses @/ aliases internally
      "@/lib": path.resolve(__dirname, "../core/src/lib"),
      "@/types": path.resolve(__dirname, "../core/src/types"),
      "@/services": path.resolve(__dirname, "../core/src/services"),
      "@/repositories": path.resolve(__dirname, "../core/src/repositories"),

      // Web package internal aliases
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
    },
  },
  server: {
    port: 3000,
  },
});
