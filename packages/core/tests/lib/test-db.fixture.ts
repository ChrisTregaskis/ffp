import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';

export type TestDb<TSchema extends Record<string, unknown> = Record<string, never>> =
  NodePgDatabase<TSchema> & { $client: Pool };

/**
 * Opens a pool on the test database `vitest.config.ts` points the DB_* variables at,
 * and a drizzle client over it. `poolOptions` carries a suite's own connection
 * settings, such as a session time zone. The caller ends the pool in `afterAll`.
 */
export const connectTestDb = <TSchema extends Record<string, unknown> = Record<string, never>>({
  schema,
  poolOptions,
}: { schema?: TSchema; poolOptions?: Partial<PoolConfig> } = {}): {
  pool: Pool;
  db: TestDb<TSchema>;
} => {
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER ?? 'test_user',
    password: process.env.DB_PASSWORD ?? 'test_password',
    ...poolOptions,
  });

  return { pool, db: drizzle(pool, { schema }) };
};
