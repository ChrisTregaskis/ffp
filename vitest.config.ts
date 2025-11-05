import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration for monorepo-level tests
 *
 * Tests workspace configuration, path aliases, and build setup
 * Does not test application logic (that's in package-specific configs)
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'packages/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'packages/eslint-config/**',
        'packages/prettier-config/**',
      ],
      // Phase 1: 15% coverage target
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },
  },
});
