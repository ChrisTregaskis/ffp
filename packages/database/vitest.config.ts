import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from monorepo root
config({ path: resolve(__dirname, '../../.env') });

// A worktree can point its DB tests at its own test database. The suites
// truncate and delete rows, so anything but ffp_test or ffp_test_* is refused.
const testDbName = process.env.FFP_TEST_DB_NAME ?? 'ffp_test';

if (!/^ffp_test(_\w+)?$/.test(testDbName)) {
  throw new Error(`FFP_TEST_DB_NAME must be ffp_test or ffp_test_*, got "${testDbName}"`);
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
    // Disable parallel execution to prevent database test interference
    // Integration tests and RLS tests both manipulate the same database tables
    fileParallelism: false,
    // Use ffp_test database for integration tests
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    env: {
      DB_NAME: testDbName,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'test_user',
      DB_PASSWORD: 'test_password',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/schema/**/*'],
    },
  },
});
