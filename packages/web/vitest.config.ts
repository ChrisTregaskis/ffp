import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { createWebAliasConfig } from './vite-alias-config';

/**
 * Vitest configuration for @ffp/web package
 *
 * Tests React components and frontend logic
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'src/pages/dev/**',
        'src/components/dev/**',
      ],
    },
  },
  resolve: {
    alias: {
      // The app's own @web/* map, so what resolves in the browser resolves under test.
      // @ffp/core differs deliberately: tests read the built output, the dev server source.
      ...createWebAliasConfig(__dirname),
      '@ffp/core': resolve(__dirname, '../core/dist/index.js'),
    },
  },
});
