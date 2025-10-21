import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for @ffp/functions package
 *
 * Tests Lambda functions and serverless business logic
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
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
      '@functions/auth': resolve(__dirname, 'src/auth'),
      '@functions/assessments': resolve(__dirname, 'src/assessments'),
      '@functions/business': resolve(__dirname, 'src/business'),
      '@functions/programs': resolve(__dirname, 'src/programs'),
      '@functions/videos': resolve(__dirname, 'src/videos'),
      '@functions/utils': resolve(__dirname, 'src/utils'),
      '@functions/types': resolve(__dirname, 'src/types'),
      '@functions/lib': resolve(__dirname, 'src/lib'),
      '@functions/services': resolve(__dirname, 'src/services'),
    },
  },
});
