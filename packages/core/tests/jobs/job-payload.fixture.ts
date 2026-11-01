import { randomUUID } from 'crypto';

import {
  generateProgrammePayloadSchema,
  scoreAssessmentPayloadSchema,
} from '../../src/schemas/job.schema';

import type { JobPayloadMap } from '../../src/jobs/job-queue.service';

const builders: { [K in keyof JobPayloadMap]: () => JobPayloadMap[K] } = {
  score_assessment: () =>
    scoreAssessmentPayloadSchema.parse({
      userAssessmentId: randomUUID(),
      flowId: randomUUID(),
      userId: randomUUID(),
    }),
  generate_programme: () =>
    generateProgrammePayloadSchema.parse({
      assessmentSubmissionId: randomUUID(),
      userId: randomUUID(),
      recommendedTemplateSlug: 'gentle-mobility',
    }),
};

/** A payload for the job type, built through its schema as the producer sends it. */
export const jobPayload = <T extends keyof JobPayloadMap>(type: T): JobPayloadMap[T] =>
  builders[type]();
