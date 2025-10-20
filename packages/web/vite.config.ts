import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createViteAliasConfig } from './vite-alias-config';

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
