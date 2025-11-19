import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

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
      '@ffp/core': resolve(__dirname, '../core/dist/index.js'),
      '@web/assets': resolve(__dirname, 'src/assets'),
      '@web/components': resolve(__dirname, 'src/components'),
      '@web/contexts': resolve(__dirname, 'src/contexts'),
      '@web/hooks': resolve(__dirname, 'src/hooks'),
      '@web/lib': resolve(__dirname, 'src/lib'),
      '@web/pages': resolve(__dirname, 'src/pages'),
      '@web/schemas': resolve(__dirname, 'src/schemas'),
      '@web/services': resolve(__dirname, 'src/services'),
      '@web/utils': resolve(__dirname, 'src/utils'),
      '@web/types': resolve(__dirname, 'src/types'),
    },
  },
});
