import { sql, type SQL } from 'drizzle-orm';

import { processJobs } from '@ffp/database';

import type { GenerateProgrammePayload } from '../schemas/job.schema';

export const GENERATE_ASSESSMENT_KEY =
  'assessmentSubmissionId' satisfies keyof GenerateProgrammePayload;
export const GENERATE_USER_KEY = 'userId' satisfies keyof GenerateProgrammePayload;

/**
 * Whether the latest programme generation job matching `match` failed for good; a newer job
 * of any status supersedes a failure. Jobs are system-managed (no RLS), so `match` must scope
 * the jobs to an organisation itself.
 */
export const latestProgrammeGenerationFailed = (match: SQL): SQL<boolean> =>
  sql<boolean>`coalesce((
    select ${processJobs.status} = 'failed'
    from ${processJobs}
    where ${processJobs.type} = 'generate_programme' and ${match}
    order by ${processJobs.createdAt} desc
    limit 1
  ), false)`;
