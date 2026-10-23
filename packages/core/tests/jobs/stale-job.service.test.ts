import { randomUUID } from 'crypto';

import { inArray } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import * as schema from '@ffp/database/schema';

import { detectAndMarkStaleJobs } from '../../src/jobs/stale-job.service';
import { asOrganisation, deleteOrganisations } from '../lib/rls-context.fixture';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import { jobPayload } from './job-payload.fixture';

import type { Pool } from 'pg';

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
}));

vi.mock('@ffp/database', async () => {
  const actual = await vi.importActual('@ffp/database');
  return {
    ...actual,
    getDb: mockGetDb,
  };
});

// An hour, so the sweep can only touch other suites' jobs left processing that long
const THRESHOLD_SECONDS = 3600;
const secondsAgo = (seconds: number): Date => new Date(Date.now() - seconds * 1000);

describe('detectAndMarkStaleJobs', () => {
  let pool: Pool;
  let db: TestDb<typeof schema>;
  let testOrganisationId: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb({ schema }));
    mockGetDb.mockReturnValue(db);
  });

  beforeEach(async () => {
    testOrganisationId = randomUUID();
    await asOrganisation(db, testOrganisationId, async (tx) => {
      await tx.insert(schema.organisations).values({
        id: testOrganisationId,
        name: `Test Organisation ${testOrganisationId.slice(0, 8)}`,
        type: 'business',
      });
    });
  });

  afterEach(async () => {
    // The organisation's jobs go with it (ON DELETE CASCADE)
    await deleteOrganisations(db, [testOrganisationId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  const createJob = async (
    overrides: Partial<schema.NewProcessJob>
  ): Promise<schema.ProcessJobRecord> => {
    const type = overrides.type ?? 'score_assessment';
    const payload = jobPayload(type);

    const [job] = await db
      .insert(schema.processJobs)
      .values({
        organisationId: testOrganisationId,
        type,
        status: 'processing',
        payload,
        ...overrides,
      })
      .returning();

    return job;
  };

  /** Only the jobs this test created, keyed by id. */
  const readOwnJobs = async (ids: string[]): Promise<Map<string, schema.ProcessJobRecord>> => {
    const rows = await db
      .select()
      .from(schema.processJobs)
      .where(inArray(schema.processJobs.id, ids));

    return new Map(rows.map((row) => [row.id, row]));
  };

  it('fails a processing job started past the threshold and leaves one inside it running', async () => {
    const stale = await createJob({ startedAt: secondsAgo(THRESHOLD_SECONDS + 60) });
    const running = await createJob({ startedAt: secondsAgo(THRESHOLD_SECONDS - 60) });

    await detectAndMarkStaleJobs({ defaultThresholdSeconds: THRESHOLD_SECONDS });

    const jobs = await readOwnJobs([stale.id, running.id]);
    expect(jobs.get(stale.id)).toMatchObject({
      status: 'failed',
      message: expect.stringMatching(
        /^Job timed out - started at .+, exceeded 3600s threshold$/
      ) as unknown,
      completedAt: expect.any(Date) as unknown,
    });
    expect(jobs.get(running.id)).toMatchObject({
      status: 'processing',
      message: null,
      completedAt: null,
    });
  });

  it('leaves queued, completed and failed jobs alone, however old', async () => {
    const longAgo = secondsAgo(THRESHOLD_SECONDS * 3);
    // A retry waiting out its back-off keeps the startedAt of the attempt that failed
    const queued = await createJob({ status: 'queued', startedAt: longAgo, attempts: 1 });
    const completed = await createJob({
      status: 'completed',
      startedAt: longAgo,
      completedAt: secondsAgo(THRESHOLD_SECONDS * 2),
    });
    const failed = await createJob({
      status: 'failed',
      startedAt: longAgo,
      completedAt: secondsAgo(THRESHOLD_SECONDS * 2),
      message: 'Earlier failure',
    });

    await detectAndMarkStaleJobs({ defaultThresholdSeconds: THRESHOLD_SECONDS });

    const jobs = await readOwnJobs([queued.id, completed.id, failed.id]);
    expect(jobs.get(queued.id)).toMatchObject({
      status: 'queued',
      message: null,
      completedAt: null,
    });
    expect(jobs.get(completed.id)).toMatchObject({
      status: 'completed',
      message: null,
      completedAt: completed.completedAt,
    });
    expect(jobs.get(failed.id)).toMatchObject({
      status: 'failed',
      message: 'Earlier failure',
      completedAt: failed.completedAt,
    });
  });

  it('applies a per-type threshold in place of the default', async () => {
    const startedAt = secondsAgo(THRESHOLD_SECONDS + 60);
    const scoring = await createJob({ type: 'score_assessment', startedAt });
    const generating = await createJob({ type: 'generate_programme', startedAt });

    await detectAndMarkStaleJobs({
      defaultThresholdSeconds: THRESHOLD_SECONDS,
      thresholdByType: { generate_programme: THRESHOLD_SECONDS * 2 },
    });

    const jobs = await readOwnJobs([scoring.id, generating.id]);
    expect(jobs.get(scoring.id)?.status).toBe('failed');
    expect(jobs.get(generating.id)?.status).toBe('processing');
  });
});
