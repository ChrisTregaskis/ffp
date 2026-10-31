import { randomUUID } from 'crypto';

import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as schema from '@ffp/database/schema';
import {
  asOrganisation,
  connectTestDb,
  deleteOrganisations,
  type TestDb,
} from '@ffp/database/testing';

import {
  GENERATE_ASSESSMENT_KEY,
  latestProgrammeGenerationFailed,
} from '../../src/jobs/programme-generation-failure';

import { jobPayload } from './job-payload.fixture';

import type { Pool } from 'pg';

describe('latestProgrammeGenerationFailed', () => {
  let pool: Pool;
  let db: TestDb<typeof schema>;
  let organisationId: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb({ schema }));
  });

  beforeEach(async () => {
    organisationId = randomUUID();

    await asOrganisation(db, organisationId, async (tx) => {
      await tx.insert(schema.organisations).values({
        id: organisationId,
        name: `Test Organisation ${organisationId.slice(0, 8)}`,
        type: 'business',
      });
    });
  });

  afterEach(async () => {
    // The organisation's jobs go with it (ON DELETE CASCADE)
    await deleteOrganisations(db, [organisationId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  /** Two generations for one assessment queued at the same instant, the lower id inserted first */
  const queueTiedGenerations = async (statuses: {
    lowerId: 'completed' | 'failed';
    higherId: 'completed' | 'failed';
  }): Promise<string> => {
    const payload = jobPayload('generate_programme');
    const createdAt = new Date('2026-01-01T09:00:00.000Z');
    const [lowerId, higherId] = [randomUUID(), randomUUID()].sort();

    for (const [id, status] of [
      [lowerId, statuses.lowerId],
      [higherId, statuses.higherId],
    ] as const) {
      await db.insert(schema.processJobs).values({
        id,
        organisationId,
        type: 'generate_programme',
        status,
        payload,
        createdAt,
      });
    }

    return payload.assessmentSubmissionId;
  };

  const latestFailed = async (assessmentId: string): Promise<boolean> => {
    const failed = latestProgrammeGenerationFailed(
      sql`${schema.processJobs.organisationId} = ${organisationId}
        and ${schema.processJobs.payload}->>${GENERATE_ASSESSMENT_KEY} = ${assessmentId}`
    );
    const result = await db.execute<{ failed: boolean }>(sql`select ${failed} as failed`);

    return result.rows[0].failed;
  };

  it('breaks a tie on creation time by id, so a failure with the higher id is the latest', async () => {
    const assessmentId = await queueTiedGenerations({ lowerId: 'completed', higherId: 'failed' });

    expect(await latestFailed(assessmentId)).toBe(true);
  });

  it('breaks a tie on creation time by id, so a completion with the higher id is the latest', async () => {
    const assessmentId = await queueTiedGenerations({ lowerId: 'failed', higherId: 'completed' });

    expect(await latestFailed(assessmentId)).toBe(false);
  });
});
