import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import {
  createAliasConfig,
  createCoreInternalAliases,
} from "./vite-alias-config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...createAliasConfig(__dirname),
      // Core package internal aliases (needed when Vite processes core source files)
      ...createCoreInternalAliases(path.resolve(__dirname, "../core")),
    },
  },
  server: {
    port: 3000,
  },
});
