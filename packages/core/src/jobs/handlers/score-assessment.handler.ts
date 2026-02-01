import { eq } from 'drizzle-orm';

import { getDb, withRLS, type DbClient } from '@ffp/database';
import { userAssessments, userAssessmentAnswers } from '@ffp/database/schema';

import { findFlowById, findStepsByFlowId } from '../../assessments/flow.repository';
import { calculateScores, toJobResult } from '../../assessments/scoring';
import { createSystemContext } from '../../lib/context';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { createSystemLogger } from '../../lib/logger';
import { findByTemplateIds } from '../../questions/question.repository';
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
 */
export async function processScoreAssessment(
  payload: ScoreAssessmentJobPayload,
  tenantId: string
): Promise<ScoreAssessmentResult> {
  const db = getDb();

  // Scoring jobs are system operations triggered by authenticated user submissions.
  // Tenant-level RLS isolation (userId = undefined) is sufficient because:
  // 1. Jobs are only created via submitAssessment() which validates user ownership
  // 2. The job payload contains userAssessmentId which is tenant-scoped
  // 3. User-level RLS would require passing userId through the job queue unnecessarily
  return await withRLS(db, tenantId, undefined, async (tx) => {
    // Type assertion: tx is compatible with DbClient for query operations
    // The $client property is only used for connection management, not queries
    const dbTx = tx as unknown as DbClient;

    // Fetch flow with scoringConfig
    const flow = await findFlowById(dbTx, payload.flowId);

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
    const steps = await findStepsByFlowId(dbTx, payload.flowId);

    // Get template IDs from question and video-assessment steps
    const templateIds = steps
      .filter((step) => step.type === 'questions' || step.type === 'video-assessment')
      .map((step) => step.templateId)
      .filter((id): id is string => id !== null);

    if (templateIds.length === 0) {
      throw new ValidationError(`Flow ${payload.flowId} has no question templates. Cannot score.`);
    }

    // Fetch questions from ALL templates in the flow
    const questions = await findByTemplateIds(dbTx, templateIds);

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
      scoredAt: new Date(result.scoredAt),
    };

    // Update assessment with scores and transition status
    await tx
      .update(userAssessments)
      .set({
        scores,
        status: 'scored',
        updatedAt: new Date(),
      })
      .where(eq(userAssessments.id, payload.userAssessmentId));

    // Chain: queue generate_program job (atomic with scoring)
    const logger = createSystemLogger('score-assessment-handler');
    const systemContext = createSystemContext({
      systemId: 'score-assessment-handler',
      tenantId,
    });

    const generateJobId = await queueJob(
      'generate_program',
      {
        assessmentSubmissionId: payload.userAssessmentId,
        userId: payload.userId,
        scores: result.scores,
        recommendedTemplateSlug: scoringResult.recommendedProgrammeId ?? undefined,
      },
      systemContext,
      { priority: 2, tx: tx as unknown as Transaction }
    );

    logger.info('Queue generate_program job', {
      generateJobId,
      assessmentId: payload.userAssessmentId,
      recommendedTemplateSlug: scoringResult.recommendedProgrammeId,
    });

    return result;
  });
}
