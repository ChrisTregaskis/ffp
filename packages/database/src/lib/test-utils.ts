import { Pool } from 'pg';

/**
 * Checks whether a PostgreSQL database is reachable.
 *
 * Used by integration and RLS tests to skip gracefully
 * when no database is available (e.g. in CI without a Postgres service).
 */
export const canConnectToDatabase = async (): Promise<boolean> => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ffp_test',
    user: process.env.DB_USER || 'test_user',
    password: process.env.DB_PASSWORD || 'test_password',
    connectionTimeoutMillis: 3000,
  });

  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
};
