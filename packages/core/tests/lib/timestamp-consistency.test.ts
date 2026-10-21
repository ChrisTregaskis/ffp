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
 * The difference only shows while the session's time zone is not UTC, so the
 * connection is pinned to Pacific/Auckland (never UTC) rather than inheriting the
 * server's zone, which is UTC in CI and in London for half the year.
 *
 * Prerequisites:
 * - ffp_test database must exist
 * - Migrations must be run: DB_NAME=ffp_test pnpm --filter=@ffp/database db:migrate
 */

import { eq, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { assessmentTemplates } from '@ffp/database/schema';

import { connectTestDb, type TestDb } from './test-db.fixture';

import type { Pool } from 'pg';

describe('Timestamp consistency', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb({ poolOptions: { options: '-c TimeZone=Pacific/Auckland' } }));
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
    // The pin is what makes this meaningful, so prove it took effect
    const zone = await db.execute(sql`select current_setting('TimeZone') as zone`);
    expect(zone.rows).toEqual([{ zone: 'Pacific/Auckland' }]);

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

      // On a naive column these land the zone's UTC offset apart (an hour under
      // British Summer Time, 12 or 13 here), which made a just-written row look
      // five minutes stale the moment it existed.
      expect(Math.abs(Number(drift_seconds))).toBeLessThan(60);
      expect(stale_against_five_minutes).toBe(false);
    } finally {
      await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, inserted.id));
    }
  });
});
