import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for @ffp/core package
 *
 * Tests shared business logic and utilities
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
    // Use ffp_test database for integration tests
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    env: {
      DB_NAME: 'ffp_test',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'test_user',
      DB_PASSWORD: 'test_password',
    },
  },
  resolve: {
    alias: {
      '@core/lib': resolve(__dirname, 'src/lib'),
      '@core/types': resolve(__dirname, 'src/types'),
      '@core/utils': resolve(__dirname, 'src/utils'),
      '@core/services': resolve(__dirname, 'src/services'),
      '@core/repositories': resolve(__dirname, 'src/repositories'),
    },
  },
});
