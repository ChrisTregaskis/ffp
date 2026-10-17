/**
 * Timestamp consistency integration tests
 *
 * Every timestamp column is `timestamptz`. The distinction matters because the
 * two writers disagree on a naive column: Postgres `now()` (behind
 * `defaultNow()`) writes the server's local wall-clock time, while a JS `Date`
 * sent through Drizzle arrives as UTC. On a `timestamp without time zone`
 * column those land an hour apart under British Summer Time, which silently
 * breaks any query comparing an application-written column against `NOW()` —
 * stale-job detection being the live example.
 *
 * Prerequisites:
 * - ffp_test database must exist
 * - Migrations must be run: DB_NAME=ffp_test pnpm --filter=@ffp/database db:migrate
 */

import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { assessmentTemplates } from '@ffp/database/schema';

describe('Timestamp consistency', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('declares every timestamp column as timestamptz', async () => {
    const result = await db.execute(sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and data_type = 'timestamp without time zone'
      order by table_name, column_name
    `);

    // Named rather than counted so a regression says which column reintroduced it.
    expect(result.rows).toEqual([]);
  });

  it('round-trips an application-written timestamp without drifting from now()', async () => {
    // Written the way the application writes one: a JS Date assigned to a typed
    // Drizzle column, alongside defaults that come from Postgres `now()`. The
    // two writers only agree once the column carries a time zone — a raw SQL
    // template serialises a Date differently and would hide the difference.
    const applicationWritten = new Date();

    const [inserted] = await db
      .insert(assessmentTemplates)
      .values({
        name: 'Timestamp consistency probe',
        createdAt: applicationWritten,
        updatedAt: applicationWritten,
      })
      .returning({ id: assessmentTemplates.id });

    try {
      const result = await db.execute(sql`
        select extract(epoch from (now() - created_at)) as drift_seconds,
               (created_at <= now() - interval '300 seconds') as stale_against_five_minutes
        from assessment_templates
        where id = ${inserted.id}
      `);

      const { drift_seconds, stale_against_five_minutes } = result.rows[0];

      // On a naive column these landed an hour apart under British Summer Time,
      // which made a just-written row look five minutes stale the moment it existed.
      expect(Math.abs(Number(drift_seconds))).toBeLessThan(60);
      expect(stale_against_five_minutes).toBe(false);
    } finally {
      await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, inserted.id));
    }
  });
});
