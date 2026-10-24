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
      responses: [{ questionId: randomUUID(), answerValue: 5 }],
    }),
  generate_programme: () =>
    generateProgrammePayloadSchema.parse({
      assessmentSubmissionId: randomUUID(),
      userId: randomUUID(),
      scores: [
        { dimensionId: 'mobility', dimensionName: 'Mobility', rawScore: 75, normalisedScore: 75 },
      ],
    }),
};

/** A payload for the job type, built through its schema as the producer sends it. */
export const jobPayload = <T extends keyof JobPayloadMap>(type: T): JobPayloadMap[T] =>
  builders[type]();
