import { eq } from 'drizzle-orm';

import { userAssessments } from '@ffp/database/schema';

import { transitionAssessmentStatus } from '../../assessments/user-assessment.repository';
import { withRLS } from '../../lib/database';
import { createSystemLogger } from '../../lib/logger';
import { generateProgramme } from '../../programmes/programme.service';

import type { DimensionalScore, GenerateProgrammeResult } from '../../schemas/job.schema';

export interface GenerateProgrammeJobPayload {
  /** The scored user assessment ID */
  assessmentSubmissionId: string;
  /** User who completed the assessment */
  userId: string;
  /** Dimensional scores from scoring */
  scores: DimensionalScore[];
  /** Programme template slug from scoring result */
  recommendedTemplateSlug?: string;
}

/**
 * Process a generate_programme job
 *
 * Creates or retrieves a programme for the user, links it to the assessment,
 * and transitions the assessment to 'completed' status.
 *
 * Flow: scored assessment → generate programme → link → complete
 */
export async function processGenerateProgramme(
  payload: GenerateProgrammeJobPayload,
  tenantId: string
): Promise<GenerateProgrammeResult> {
  const logger = createSystemLogger('generate-programme-handler');

  return await withRLS(tenantId, undefined, async (tx) => {
    // Generate or retrieve existing programme
    const result = await generateProgramme(
      {
        tenantId,
        userId: payload.userId,
        recommendedTemplateSlug: payload.recommendedTemplateSlug ?? null,
      },
      { tx }
    );

    if (result.isExisting) {
      logger.info('Retake path: returning existing programme', {
        programmeId: result.programmeId,
        assessmentId: payload.assessmentSubmissionId,
      });
    } else {
      logger.info('Created new programme', {
        programmeId: result.programmeId,
        programmeName: result.programmeName,
        assessmentId: payload.assessmentSubmissionId,
      });
    }

    // Link assessment to programme
    await tx
      .update(userAssessments)
      .set({
        programmeId: result.programmeId,
        updatedAt: new Date(),
      })
      .where(eq(userAssessments.id, payload.assessmentSubmissionId));

    // Transition assessment to completed (validates state machine, sets completedAt)
    await transitionAssessmentStatus(tenantId, payload.assessmentSubmissionId, 'completed', { tx });

    // MVP defaults — exercise catalogue not yet built
    return {
      programmeId: result.programmeId,
      programmeName: result.programmeName,
      durationWeeks: 8,
      exercises: [],
      sessionsPerWeek: 3,
      generatedAt: new Date().toISOString(),
    };
  });
}
