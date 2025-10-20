import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createViteAliasConfig } from "./vite-alias-config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: createViteAliasConfig(__dirname),
  },
  server: {
    port: 3000,
  },
});
