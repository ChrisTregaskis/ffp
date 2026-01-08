/**
 * Score Assessment Job Handler
 *
 * Processes assessment scoring jobs by calculating dimensional scores
 * from user responses and updating the user_assessments table.
 *
 * Architecture note: Responses are fetched from the database (user_assessment_answers)
 * rather than passed in the job payload. This ensures we score the actual persisted
 * answers and keeps the job payload lightweight.
 *
 * @module jobs/handlers/score-assessment
 */

import { eq } from 'drizzle-orm';

import { getDb, withRLS, type DbClient } from '@ffp/database';
import { userAssessments, userAssessmentAnswers } from '@ffp/database/schema';

import { calculateScores, toJobResult } from '../../assessments/scoring';
import { findById as findTemplateById } from '../../assessments/template.repository';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { findByTemplateId as findQuestionsByTemplateId } from '../../questions/question.repository';

import type { AssessmentResponse, ScoreAssessmentResult } from '../../schemas/job.schema';

export interface ScoreAssessmentJobPayload {
  /** The user assessment ID to score */
  userAssessmentId: string;
  /** The template containing the scoring configuration */
  templateId: string;
}

/**
 * Process a score_assessment job
 *
 * Fetches the assessment template, questions, and persisted answers from the database,
 * calculates scores, and updates the user_assessment record.
 *
 * @param payload - Job payload containing assessment and template IDs
 * @param tenantId - Tenant UUID for RLS context
 * @returns Score assessment result with dimensional scores
 *
 * @throws {NotFoundError} If the assessment template is not found
 * @throws {ValidationError} If no answers exist for the assessment
 */
export async function processScoreAssessment(
  payload: ScoreAssessmentJobPayload,
  tenantId: string
): Promise<ScoreAssessmentResult> {
  const db = getDb();

  return await withRLS(db, tenantId, undefined, async (tx) => {
    // Type assertion: tx is compatible with DbClient for query operations
    // The $client property is only used for connection management, not queries
    const dbTx = tx as unknown as DbClient;

    // Get template for scoring config
    const template = await findTemplateById(dbTx, payload.templateId);

    if (!template) {
      throw new NotFoundError('Assessment template', payload.templateId);
    }

    // Get questions for the template
    const questions = await findQuestionsByTemplateId(dbTx, payload.templateId);

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

    // Transform database records to AssessmentResponse format
    const responses: AssessmentResponse[] = answerRecords.map((record) => ({
      questionId: record.questionId,
      answerValue: record.answerValue as AssessmentResponse['answerValue'],
    }));

    // Calculate scores using fetched responses
    const scoringResult = calculateScores(responses, questions, template.scoringConfig);

    // Convert to job result format
    const result = toJobResult(scoringResult);

    // Update assessment with scores and transition status
    await tx
      .update(userAssessments)
      .set({
        scores: result,
        status: 'scored',
        updatedAt: new Date(),
      })
      .where(eq(userAssessments.id, payload.userAssessmentId));

    return result;
  });
}
