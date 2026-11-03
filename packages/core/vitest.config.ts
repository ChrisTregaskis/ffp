import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for @ffp/core package
 *
 * Tests shared business logic and utilities
 */
// A worktree can point its DB tests at its own test database. The suites
// write and delete rows, so anything but ffp_test or ffp_test_* is refused.
const testDbName = process.env.FFP_TEST_DB_NAME ?? 'ffp_test';

if (!/^ffp_test(_\w+)?$/.test(testDbName)) {
  throw new Error(`FFP_TEST_DB_NAME must be ffp_test or ffp_test_*, got "${testDbName}"`);
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Disable parallel execution to prevent database test interference
    // Job processor tests and job queue tests both manipulate the same process_jobs table
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/dist/**'],
    },
    // Use ffp_test database for integration tests
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    //
    // This overrides .env values. test_user is distinct from the runtime role and gets its
    // table grants only when ffp_test is migrated with DB_TEST_USER=test_user.
    env: {
      DB_NAME: testDbName,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'test_user',
      DB_PASSWORD: 'test_password',
      // The test database is local Postgres without TLS
      DB_TLS_MODE: 'local',
    },
  },
  resolve: {
    alias: {
      '@core/lib': resolve(__dirname, 'src/lib'),
      '@core/types': resolve(__dirname, 'src/types'),
      '@core/services': resolve(__dirname, 'src/services'),
      '@core/repositories': resolve(__dirname, 'src/repositories'),
    },
  },
});
