import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from monorepo root
config({ path: resolve(__dirname, '../../.env') });

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
      DB_NAME: 'ffp_test',
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
