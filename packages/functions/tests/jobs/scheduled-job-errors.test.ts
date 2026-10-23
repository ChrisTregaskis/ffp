import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as CoreServer from '@ffp/core/server';
import type * as Database from '@ffp/database';

import type { Context, ScheduledEvent } from 'aws-lambda';

const core = vi.hoisted(() => ({
  pollAndClaimJobs: vi.fn(),
  detectAndMarkStaleJobs: vi.fn(),
}));

vi.mock('@ffp/core/server', async (importOriginal) => ({
  ...(await importOriginal<typeof CoreServer>()),
  pollAndClaimJobs: core.pollAndClaimJobs,
  detectAndMarkStaleJobs: core.detectAndMarkStaleJobs,
}));

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof Database>()),
  getDb: vi.fn(),
}));

const { handler: processJobs } = await import('../../src/jobs/process-jobs');
const { handler: detectStaleJobs } = await import('../../src/jobs/detect-stale-jobs');

const EVENT = { time: '2026-10-21T09:00:00Z', source: 'aws.events' } as ScheduledEvent;
const CONTEXT = { awsRequestId: 'request-1' } as Context;

// The shape Drizzle throws: the SQL and parameters on the error, the driver's detail on its cause
const failedQuery = (): Error =>
  Object.assign(
    new Error('Failed query: update "process_jobs" set "status" = $1\nparams: sentinel-param'),
    {
      query: 'update "process_jobs" set "status" = $1',
      params: ['sentinel-param'],
      cause: Object.assign(new Error('insert or update violates foreign key constraint'), {
        code: '23503',
        detail: 'Key (organisation_id)=(sentinel-detail) is not present',
      }),
    }
  );

// The Lambda runtime logs a thrown error's enumerable fields, so the rethrow must carry none
const expectSafeRethrow = async (run: Promise<void>): Promise<void> => {
  const thrown = await run.then(
    () => {
      throw new Error('Expected the handler to rethrow');
    },
    (error: unknown) => error
  );

  expect(thrown).toBeInstanceOf(Error);
  expect((thrown as Error).message).toBe('Database driver error');
  expect(Object.keys(thrown as Error)).toEqual([]);
  expect((thrown as Error).cause).toBeUndefined();
};

describe('scheduled job handlers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rethrows a failed poll as its safe summary, not the query error', async () => {
    core.pollAndClaimJobs.mockRejectedValue(failedQuery());

    await expectSafeRethrow(processJobs(EVENT, CONTEXT));
  });

  it('rethrows a failed stale-job sweep as its safe summary, not the query error', async () => {
    core.detectAndMarkStaleJobs.mockRejectedValue(failedQuery());

    await expectSafeRethrow(detectStaleJobs(EVENT, CONTEXT));
  });
});
