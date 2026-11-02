import { randomUUID } from 'crypto';

import { sql } from 'drizzle-orm';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { closeDb, getDb } from '@ffp/database';

import { withRLS } from '../../src/lib/database';

describe('one database pool per container', () => {
  afterAll(async () => {
    vi.restoreAllMocks();
    await closeDb();
  });

  it('runs RLS transactions and service reads on the same pool of two', async () => {
    const pool = getDb().$client;
    const connect = vi.spyOn(pool, 'connect');

    const organisationId = randomUUID();
    const setting = await withRLS(organisationId, undefined, async (tx) => {
      const result = await tx.execute<{ organisation_id: string }>(
        sql`select current_setting('app.organisation_id', true) as organisation_id`
      );
      return result.rows[0]?.organisation_id;
    });
    await getDb().execute(sql`select 1`);

    expect(setting).toBe(organisationId);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(pool.options.max).toBe(2);
  });
});
