import { randomUUID } from 'crypto';

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

import { withRLS } from '@ffp/database';
import * as schema from '@ffp/database/schema';

import { withErrorHandling } from '../../src/lib/lambda-wrapper';

import { createMockEvent } from './api-gateway-event.fixture';
import { expectNothingLeakable } from './database-error.fixture';

// Runs against the real test database so the error is exactly what Drizzle and
// `pg` raise, not a hand-built stand-in. The insert is refused, so no row is
// created and there is nothing to clean up.
describe('logging a real database error', () => {
  let pool: Pool;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool, { schema });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('logs a foreign-key violation by SQLSTATE and constraint, with no SQL, parameters or detail', async () => {
    const missingOrganisationId = randomUUID();
    const memberEmail = 'sentinel-member-7f3a@example.com';

    const caught = await withRLS(db, missingOrganisationId, undefined, (tx) =>
      tx.insert(schema.processJobs).values({
        organisationId: missingOrganisationId,
        type: 'score_assessment',
        payload: { memberEmail },
      })
    ).then(
      () => {
        throw new Error('Expected the insert to be refused');
      },
      (error: unknown) => error
    );

    // The raw error does carry everything the log must not.
    expect(caught).toMatchObject({
      message: expect.stringContaining('insert into "process_jobs"') as unknown,
      cause: {
        code: '23503',
        detail: expect.stringContaining(missingOrganisationId) as unknown,
      },
    });
    expect(String((caught as Error).stack)).toContain(memberEmail);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await withErrorHandling(() => {
      throw caught;
    })(createMockEvent());

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Lambda error:',
      expect.objectContaining({
        error: 'Database driver error',
        database: {
          sqlState: '23503',
          constraint: 'process_jobs_organisation_id_organisations_id_fk',
          table: 'process_jobs',
        },
      })
    );
    const logged = JSON.stringify(consoleErrorSpy.mock.calls);
    expectNothingLeakable(logged);
    expect(logged).not.toContain(memberEmail);
    expect(logged).not.toContain(missingOrganisationId);
  });
});
