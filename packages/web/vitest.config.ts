import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/dist/**'],
    },
  },
  resolve: {
    alias: {
      '@ffp/core': resolve(__dirname, '../core/dist/index.js'),
      '@web/components': resolve(__dirname, 'src/components'),
      '@web/hooks': resolve(__dirname, 'src/hooks'),
      '@web/pages': resolve(__dirname, 'src/pages'),
      '@web/services': resolve(__dirname, 'src/services'),
      '@web/utils': resolve(__dirname, 'src/utils'),
      '@web/types': resolve(__dirname, 'src/types'),
    },
  },
});
