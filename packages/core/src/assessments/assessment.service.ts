import { getDb, type FlowStep } from '@ffp/database';

import { queueJob } from '../jobs/job-queue.service';
import { getUserIdFromContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';
import { createSystemLogger } from '../lib/logger';
import { findByTemplateIds as findQuestionsByTemplateIds } from '../questions/question.repository';

// System logger for assessment data integrity issues (no tenant context needed)
const systemLogger = createSystemLogger('assessment-service');

import * as answerRepository from './answer.repository';
import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { UserAssessmentAnswer, SaveAnswerInput } from './answer.repository';
import type { TenantContext } from '../lib/context';
import type {
  StartAssessmentResponse,
  SaveProgressRequest,
  SaveProgressResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  UserAssessmentAnswers,
} from '../schemas/user-assessment.schema';

/**
 * Convert answers from database table format to API response format
 *
 * The user_assessment_answers table stores one row per answer, while the
 * API returns answers as a record keyed by questionId for efficient lookup.
 *
 * Note: The database AnswerValue is a flexible JSONB structure (Record<string, unknown>),
 * but the API schema expects answerValue as string | number. We extract the raw value
 * from the JSONB structure for API compatibility.
 */
function convertAnswersToResponseFormat(answers: UserAssessmentAnswer[]): UserAssessmentAnswers {
  const result: UserAssessmentAnswers = {};

  for (const answer of answers) {
    // Extract the value from the JSONB structure using the shared helper
    const answerValue = extractAnswerValue(answer.answerValue);

    result[answer.questionId] = {
      questionId: answer.questionId,
      answerValue,
      answeredAt: answer.answeredAt,
    };
  }

  return result;
}

/**
 * Convert answers from API request format to database input format
 *
 * The API accepts answers as a record keyed by questionId, while the
 * repository expects an array of SaveAnswerInput objects.
 *
 * Note: The API sends answerValue as string | number, but the database
 * AnswerValue type is Record<string, unknown>. We wrap the value in an
 * object structure for consistency.
 */
function convertAnswersToSaveFormat(answers: UserAssessmentAnswers): SaveAnswerInput[] {
  return Object.values(answers).map((answer) => ({
    questionId: answer.questionId,
    // Wrap the raw value in a consistent structure for database storage
    answerValue: { value: answer.answerValue } as Record<string, unknown>,
  }));
}

/**
 * Extract the actual answer value from JSONB structure
 *
 * The database stores answers as JSONB (e.g., { value: 5 } or { selected: 'option-a' }),
 * but the job payload requires a plain string | number value.
 *
 * @throws ValidationError if the answer value format is unexpected
 */
function extractAnswerValue(answerValue: unknown): string | number {
  // Handle direct primitive values
  if (typeof answerValue === 'string' || typeof answerValue === 'number') {
    return answerValue;
  }

  // Handle structured JSONB objects
  if (typeof answerValue === 'object' && answerValue !== null) {
    const obj = answerValue as Record<string, unknown>;

    // Check for known JSONB structures: { value: ... }, { selected: ... }, { text: ... }
    if ('value' in obj) {
      const value = obj.value;

      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }

      // value key exists but has unexpected type
      systemLogger.warn('Unexpected type for answer value.value field', {
        answerValue,
        valueType: typeof value,
      });

      throw new ValidationError('Invalid answer value format: value field has unexpected type');
    }

    if ('selected' in obj) {
      const selected = obj.selected;

      if (typeof selected === 'string') {
        return selected;
      }

      systemLogger.warn('Unexpected type for answer value.selected field', {
        answerValue,
        selectedType: typeof selected,
      });

      throw new ValidationError('Invalid answer value format: selected field has unexpected type');
    }

    if ('text' in obj) {
      const text = obj.text;

      if (typeof text === 'string') {
        return text;
      }

      systemLogger.warn('Unexpected type for answer value.text field', {
        answerValue,
        textType: typeof text,
      });

      throw new ValidationError('Invalid answer value format: text field has unexpected type');
    }

    // Object doesn't have any recognised structure
    systemLogger.warn('Unexpected answer value structure', {
      answerValue,
      keys: Object.keys(obj),
    });

    throw new ValidationError('Invalid answer value format: unrecognised object structure');
  }

  // Unexpected type (null, undefined, boolean, symbol, etc.)
  systemLogger.warn('Unexpected answer value type', {
    answerValue,
    type: typeof answerValue,
  });

  throw new ValidationError(
    'Invalid answer value format: expected string, number, or structured object'
  );
}

/**
 * Start a new assessment or resume an existing one
 * @returns StartAssessmentResponse with the assessment data and isResumed flag
 *
 * @throws NotFoundError if flow doesn't exist or is inactive
 * @throws UnauthorisedError if context doesn't have a user actor or user not in database
 *
 * @example
 * ```typescript
 * const response = await startAssessment(flowId, context);
 * if (response.isResumed) {
 *   // User is continuing an existing assessment
 * } else {
 *   // User started a fresh assessment
 * }
 * ```
 */
export async function startAssessment(
  flowId: string,
  context: TenantContext
): Promise<StartAssessmentResponse> {
  const userId = await getUserIdFromContext(context);
  const { tenantId } = context;

  // 1. Validate flow exists and is active
  const flow = await flowRepository.findActiveById(flowId);

  if (!flow) {
    // Treat inactive flows the same as non-existent for security
    throw new NotFoundError('Assessment flow', flowId);
  }

  // 2. Check for existing resumable assessment
  const existingAssessment = await userAssessmentRepository.findResumable(tenantId, userId, flowId);

  if (existingAssessment) {
    // Load answers from user_assessment_answers table
    const storedAnswers = await answerRepository.findByAssessmentId(
      tenantId,
      existingAssessment.id,
      userId
    );

    const answers = convertAnswersToResponseFormat(storedAnswers);

    // Return existing assessment with isResumed=true
    return {
      assessmentId: existingAssessment.id,
      currentStep: existingAssessment.currentStep,
      status: existingAssessment.status,
      answers,
      flowId: existingAssessment.flowId,
      isResumed: true,
    };
  }

  // 3. Create new assessment
  const newAssessment = await userAssessmentRepository.create({
    tenantId,
    userId,
    flowId,
  });

  return {
    assessmentId: newAssessment.id,
    currentStep: newAssessment.currentStep,
    status: newAssessment.status,
    answers: {}, // New assessment has no answers yet
    flowId: newAssessment.flowId,
    isResumed: false,
  };
}

/**
 * Save assessment progress
 *
 * Persists user's answers and current step when navigating (Continue/Back).
 * Handles status transition from 'not_started' to 'in_progress' on first save.
 *
 * @throws NotFoundError if assessment doesn't exist or not accessible
 * @throws ValidationError if assessment is submitted/completed
 *
 * @example
 * ```typescript
 * const response = await saveProgress(assessmentId, {
 *   answers: { 'q1-uuid': { questionId: 'q1-uuid', answerValue: 5 } },
 *   currentStep: 2
 * }, context);
 * ```
 */
export async function saveProgress(
  assessmentId: string,
  data: SaveProgressRequest,
  context: TenantContext
): Promise<SaveProgressResponse> {
  const { tenantId } = context;
  const userId = await getUserIdFromContext(context);

  // Fetch assessment by ID (RLS enforced)
  const assessment = await userAssessmentRepository.findById(tenantId, assessmentId);

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Validate assessment is not submitted/completed
  if (assessment.status === 'submitted' || assessment.status === 'completed') {
    throw new ValidationError('Cannot modify submitted assessment');
  }

  // Execute all writes in a single transaction for atomicity
  return await withRLS(tenantId, userId, async (tx) => {
    // If status is 'not_started', transition to 'in_progress'
    if (assessment.status === 'not_started') {
      await userAssessmentRepository.transitionStatus(tenantId, assessmentId, 'in_progress', {
        tx,
      });
    }

    // Save answers to user_assessment_answers table
    const answersToSave = convertAnswersToSaveFormat(data.answers);
    if (answersToSave.length > 0) {
      await answerRepository.saveAnswers(tenantId, assessmentId, answersToSave, { tx });
    }

    // Update currentStep
    const updatedAssessment = await userAssessmentRepository.updateProgress(
      tenantId,
      assessmentId,
      { currentStep: data.currentStep },
      { tx }
    );

    // Return success response
    return {
      success: true as const,
      updatedAt: updatedAssessment.updatedAt.toISOString(),
    };
  });
}

/**
 * Get required question IDs from flow templates
 *
 * Fetches all questions from templates referenced by 'questions' and
 * 'video-assessment' steps in the flow, then returns IDs where
 * validation.required is true (or undefined, as required defaults to true).
 */
async function getRequiredQuestionIds(flowSteps: FlowStep[]): Promise<string[]> {
  const db = getDb();

  // Get template IDs from question and video-assessment steps
  const templateIds = flowSteps
    .filter((step) => step.type === 'questions' || step.type === 'video-assessment')
    .map((step) => step.templateId)
    .filter((id): id is string => id !== undefined);

  if (templateIds.length === 0) {
    return [];
  }

  // Fetch all questions via the template_questions join table
  const questions = await findQuestionsByTemplateIds(db, templateIds);

  // Extract required question IDs (validation.required defaults to true)
  return questions.filter((q) => q.validation?.required !== false).map((q) => q.id);
}

/**
 * Validate that all required questions have been answered
 *
 * @returns Array of missing question IDs (empty if all required questions answered)
 */
function findMissingRequiredQuestions(
  requiredQuestionIds: string[],
  answeredQuestionIds: string[]
): string[] {
  return requiredQuestionIds.filter((questionId) => !answeredQuestionIds.includes(questionId));
}

/**
 * Submit an assessment for scoring
 *
 * Validates the assessment can be submitted, saves final answers,
 * transitions status to 'submitted', and enqueues a scoring job.
 *
 * @throws NotFoundError if assessment doesn't exist or not accessible
 * @throws ValidationError if assessment is already submitted
 * @throws ValidationError if required questions are missing answers
 *
 * @example
 * ```typescript
 * const response = await submitAssessment(assessmentId, {
 *   answers: { 'q1-uuid': { questionId: 'q1-uuid', answerValue: 5 } }
 * }, context);
 * ```
 */
export async function submitAssessment(
  assessmentId: string,
  data: SubmitAssessmentRequest,
  context: TenantContext
): Promise<SubmitAssessmentResponse> {
  const { tenantId } = context;
  const userId = await getUserIdFromContext(context);

  // Fetch assessment (RLS enforced)
  const assessment = await userAssessmentRepository.findById(tenantId, assessmentId);

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Validate not already submitted
  if (assessment.status === 'submitted' || assessment.status === 'completed') {
    throw new ValidationError('Assessment already submitted');
  }

  // Fetch the assessment flow to get required questions
  const flow = await flowRepository.findById(assessment.flowId);

  if (!flow) {
    throw new NotFoundError('Assessment flow', assessment.flowId);
  }

  // Load existing answers from user_assessment_answers table
  const existingAnswers = await answerRepository.findByAssessmentId(tenantId, assessmentId, userId);

  // Convert request answers to save format
  const newAnswersToSave = convertAnswersToSaveFormat(data.answers);

  // Build array of all answered question IDs (existing + new)
  const answeredQuestionIds: string[] = [];

  for (const answer of existingAnswers) {
    answeredQuestionIds.push(answer.questionId);
  }

  for (const answer of newAnswersToSave) {
    answeredQuestionIds.push(answer.questionId);
  }

  // Validate required questions are answered
  const requiredQuestionIds = await getRequiredQuestionIds(flow.steps);
  const missingQuestionIds = findMissingRequiredQuestions(requiredQuestionIds, answeredQuestionIds);

  if (missingQuestionIds.length > 0) {
    throw new ValidationError('Required questions are missing answers', {
      missingQuestionIds,
    });
  }

  // Get the first template ID for scoring (primary questions template)
  const questionsStep = flow.steps.find((step) => step.type === 'questions');
  const templateId = questionsStep?.templateId;

  if (!templateId) {
    throw new ValidationError('Assessment flow has no questions template');
  }

  // Build responses array for scoring job from all answers
  // Combine existing answers with new answers (new answers override existing)
  // Extract the actual value from JSONB structure for the job payload
  const allAnswersMap = new Map<string, { questionId: string; answerValue: string | number }>();

  for (const answer of existingAnswers) {
    const extractedValue = extractAnswerValue(answer.answerValue);

    allAnswersMap.set(answer.questionId, {
      questionId: answer.questionId,
      answerValue: extractedValue,
    });
  }

  for (const answer of newAnswersToSave) {
    const extractedValue = extractAnswerValue(answer.answerValue);
    allAnswersMap.set(answer.questionId, {
      questionId: answer.questionId,
      answerValue: extractedValue,
    });
  }

  const responses = Array.from(allAnswersMap.values());

  // Execute all writes in a single transaction for atomicity
  // If any step fails, all changes are rolled back
  return await withRLS(tenantId, userId, async (tx) => {
    // Save new answers to user_assessment_answers table
    if (newAnswersToSave.length > 0) {
      await answerRepository.saveAnswers(tenantId, assessmentId, newAnswersToSave, { tx });
    }

    // Transition status to 'submitted'
    await userAssessmentRepository.transitionStatus(tenantId, assessmentId, 'submitted', { tx });

    // Enqueue score_assessment job
    const jobId = await queueJob(
      'score_assessment',
      {
        assessmentSubmissionId: assessmentId,
        templateId,
        userId,
        responses,
      },
      context,
      { priority: 2, tx } // High priority for user-triggered submission
    );

    // Return response with jobId for polling
    return {
      jobId,
      message: 'Assessment submitted successfully. Scoring in progress.',
    };
  });
}
