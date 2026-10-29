import { and, eq } from 'drizzle-orm';

import { getDb, withRLS } from '@ffp/database';
import { userAssessments, userAssessmentAnswers } from '@ffp/database/schema';

import { findActiveFlowQuestions } from '../../assessments/flow-question.repository';
import { findFlowById, findStepsByFlowId } from '../../assessments/flow.repository';
import { calculateScores, toJobResult } from '../../assessments/scoring';
import { createSystemContext } from '../../lib/context';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { createSystemLogger } from '../../lib/logger';
import { findTemplateIdsOfSteps } from '../../schemas/assessment-flow.schema';
import {
  assessmentResponseSchema,
  type AssessmentResponse,
  type ScoreAssessmentResult,
} from '../../schemas/job.schema';
import { queueJob } from '../job-queue.service';

import type { Transaction } from '../../lib/database';

export interface ScoreAssessmentJobPayload {
  /** The user assessment ID to score */
  userAssessmentId: string;
  /** The flow containing the scoring configuration */
  flowId: string;
  /** User who completed the assessment */
  userId: string;
}

/**
 * Process a score_assessment job
 *
 * Fetches the assessment flow (with scoringConfig), all questions from templates
 * in the flow via flow_steps, and persisted answers from the database.
 * Calculates dimensional scores and updates the user_assessment record.
 * An assessment that is no longer `submitted` is left as it is and no programme is queued; the
 * calculated result is still returned, so the processor completes the job rather than retrying it.
 */
export async function processScoreAssessment(
  payload: ScoreAssessmentJobPayload,
  organisationId: string
): Promise<ScoreAssessmentResult> {
  const db = getDb();

  // Scoring jobs are system operations triggered by authenticated user submissions.
  // Organisation-level RLS isolation (userId = undefined) is sufficient because:
  // 1. Jobs are only created via submitAssessment() which validates user ownership
  // 2. The job payload contains userAssessmentId which is organisation-scoped
  // 3. User-level RLS would require passing userId through the job queue unnecessarily
  return await withRLS(db, organisationId, undefined, async (tx) => {
    // Fetch flow with scoringConfig
    const flow = await findFlowById(tx, payload.flowId);

    if (!flow) {
      throw new NotFoundError('Assessment flow', payload.flowId);
    }

    if (!flow.scoringConfig) {
      throw new ValidationError(
        `Flow ${payload.flowId} has no scoring configuration. ` +
          `Add scoringConfig to assessment_flows table.`
      );
    }

    // Fetch ALL steps for flow (normalised table)
    const steps = await findStepsByFlowId(tx, payload.flowId);

    // Only the template-linked steps carry the questions that scoring reads
    if (findTemplateIdsOfSteps(steps).length === 0) {
      throw new ValidationError(`Flow ${payload.flowId} has no question templates. Cannot score.`);
    }

    const questions = await findActiveFlowQuestions(tx, steps);

    if (questions.length === 0) {
      throw new ValidationError(
        `No questions found in flow ${payload.flowId} templates. Cannot score.`
      );
    }

    // Fetch persisted answers from database (not from payload)
    const answerRecords = await tx
      .select()
      .from(userAssessmentAnswers)
      .where(eq(userAssessmentAnswers.userAssessmentId, payload.userAssessmentId));

    if (answerRecords.length === 0) {
      throw new ValidationError(
        `No answers found for assessment ${payload.userAssessmentId}. Cannot score.`
      );
    }

    // Transform and validate database records to AssessmentResponse format.
    // Validate JSONB answerValue from database to catch
    // any malformed data that could cause silent incorrect scoring.
    const responses: AssessmentResponse[] = answerRecords.map((record) => {
      const parsed = assessmentResponseSchema.safeParse({
        questionId: record.questionId,
        answerValue: record.answerValue,
      });

      if (!parsed.success) {
        throw new ValidationError(
          `Invalid answer format for question ${record.questionId}: ${parsed.error.message}`
        );
      }

      return parsed.data;
    });

    // Calculate scores using flow's combined scoring config
    const scoringResult = calculateScores(responses, questions, flow.scoringConfig);

    // Convert to job result format
    const result = toJobResult(scoringResult);

    // Map job result to database scores format (dimensions, not scores)
    const scores = {
      dimensions: result.scores,
      overallScore: result.overallScore,
      riskLevel: scoringResult.riskLevel,
      recommendedTemplateSlug: scoringResult.recommendedProgrammeId ?? undefined,
      scoredAt: new Date(result.scoredAt),
    };

    const logger = createSystemLogger('score-assessment-handler');

    // Only a submitted assessment is scored. The status guard sits in the WHERE, so a late or
    // repeated job can't move a scored or completed assessment back, even when two jobs race.
    const updated = await tx
      .update(userAssessments)
      .set({
        scores,
        status: 'scored',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAssessments.id, payload.userAssessmentId),
          eq(userAssessments.status, 'submitted')
        )
      )
      .returning({ id: userAssessments.id });

    if (updated.length === 0) {
      const found = await tx
        .select({ status: userAssessments.status })
        .from(userAssessments)
        .where(eq(userAssessments.id, payload.userAssessmentId));

      // Not thrown: a retry could never succeed, so the job completes as a no-op
      logger.warn('Scoring skipped: the assessment is not awaiting scoring', {
        assessmentId: payload.userAssessmentId,
        status: found.at(0)?.status ?? null,
      });

      return result;
    }

    // Chain: queue generate_programme job (atomic with scoring)
    const systemContext = createSystemContext({
      systemId: 'score-assessment-handler',
      organisationId,
    });

    const generateJobId = await queueJob(
      'generate_programme',
      {
        assessmentSubmissionId: payload.userAssessmentId,
        userId: payload.userId,
        recommendedTemplateSlug: scoringResult.recommendedProgrammeId ?? undefined,
      },
      systemContext,
      { priority: 2, tx: tx as unknown as Transaction }
    );

    logger.info('Queue generate_programme job', {
      generateJobId,
      assessmentId: payload.userAssessmentId,
      recommendedTemplateSlug: scoringResult.recommendedProgrammeId,
    });

    return result;
  });
}
