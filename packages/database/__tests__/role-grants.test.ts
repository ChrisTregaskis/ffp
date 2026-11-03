import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { connectTestDb, type TestDb } from '../src/testing';

import type { Pool } from 'pg';

// Reads back the grants the migration gave the role these suites connect as
describe('Application role grants', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  it('gives the role these suites connect as row access but no TRUNCATE', async () => {
    const { rows } = await db.execute<{
      tables: number;
      with_row_access: number;
      with_truncate: number;
    }>(sql`
      SELECT count(*)::int AS tables,
             count(*) FILTER (
               WHERE has_table_privilege(c.oid, 'SELECT')
                 AND has_table_privilege(c.oid, 'INSERT')
                 AND has_table_privilege(c.oid, 'UPDATE')
                 AND has_table_privilege(c.oid, 'DELETE')
             )::int AS with_row_access,
             count(*) FILTER (WHERE has_table_privilege(c.oid, 'TRUNCATE'))::int AS with_truncate
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
    `);

    expect(rows[0].tables).toBeGreaterThan(0);
    expect(rows[0].with_row_access).toBe(rows[0].tables);
    expect(rows[0].with_truncate).toBe(0);
  });

  it('leaves TRUNCATE with no role but the owner, the runtime role included', async () => {
    const { rows } = await db.execute<{ grantee: string; tables: number }>(sql`
      SELECT pg_get_userbyid(acl.grantee) AS grantee, count(*)::int AS tables
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      CROSS JOIN LATERAL aclexplode(c.relacl) acl
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND acl.privilege_type = 'TRUNCATE' AND acl.grantee <> c.relowner
      GROUP BY 1
    `);

    expect(rows).toEqual([]);
  });
});
