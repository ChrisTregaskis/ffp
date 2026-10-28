import { sql, type SQL } from 'drizzle-orm';

import { processJobs } from '@ffp/database';

import { GENERATE_ASSESSMENT_KEY, GENERATE_USER_KEY } from './programme-generation-failure';

import type { GenerateProgrammePayload, ScoreAssessmentPayload } from '../schemas/job.schema';

/**
 * The payload keys a finished job keeps: ids an operator traces a job by, and the ones the
 * programme readiness and Users list reads match on. Any other payload key, such as the scores a
 * generation job is given, is dropped from the payload when the job finishes.
 */
const FINISHED_JOB_PAYLOAD_KEYS = [
  'userAssessmentId',
  'flowId',
  GENERATE_USER_KEY,
  GENERATE_ASSESSMENT_KEY,
] as const satisfies readonly (keyof ScoreAssessmentPayload | keyof GenerateProgrammePayload)[];

/** The job's payload cut down to `FINISHED_JOB_PAYLOAD_KEYS`, for the update that finishes it */
export const finishedJobPayload = (): SQL<Record<string, unknown>> =>
  sql`(
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    from jsonb_each(${processJobs.payload})
    where key in (${sql.join(
      FINISHED_JOB_PAYLOAD_KEYS.map((key) => sql`${key}`),
      sql`, `
    )})
  )`;
