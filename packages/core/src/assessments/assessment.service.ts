import { getDb, type FlowStep } from '@ffp/database';

import { queueJob } from '../jobs/job-queue.service';
import { getUserIdFromContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';

import * as flowRepository from './flow.repository';
import { findTemplatesByIds } from './template.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { TenantContext } from '../lib/context';
import type { AssessmentTemplate } from '../schemas/assessment-template.schema';
import type {
  StartAssessmentResponse,
  SaveProgressRequest,
  SaveProgressResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  UserAssessmentAnswers,
} from '../schemas/user-assessment.schema';

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
    // Return existing assessment with isResumed=true
    return {
      assessmentId: existingAssessment.id,
      currentStep: existingAssessment.currentStep,
      status: existingAssessment.status,
      answers: existingAssessment.answers,
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
    answers: newAssessment.answers,
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

  // 1. Fetch assessment by ID (RLS enforced)
  const assessment = await userAssessmentRepository.findById(tenantId, assessmentId);

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // 2. Validate assessment is not submitted/completed
  if (assessment.status === 'submitted' || assessment.status === 'completed') {
    throw new ValidationError('Cannot modify submitted assessment');
  }

  // 3. If status is 'not_started', transition to 'in_progress'
  if (assessment.status === 'not_started') {
    await userAssessmentRepository.transitionStatus(tenantId, assessmentId, 'in_progress');
  }

  // 4. Update progress (merges answers + updates currentStep)
  const updatedAssessment = await userAssessmentRepository.updateProgress(tenantId, assessmentId, {
    answers: data.answers,
    currentStep: data.currentStep,
  });

  // 5. Return success response
  return {
    success: true,
    updatedAt: updatedAssessment.updatedAt.toISOString(),
  };
}

/**
 * Get required question IDs from flow templates
 *
 * Fetches all templates referenced by 'questions' and 'video-assessment' steps
 * in the flow, then extracts question IDs where validation.required is true
 * (or undefined, as required defaults to true).
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

  // Fetch all templates in a single query
  const templates: AssessmentTemplate[] = await findTemplatesByIds(db, templateIds);

  // Extract required question IDs from all templates
  return templates.flatMap((template) =>
    template.questions.filter((q) => q.validation?.required !== false).map((q) => q.id)
  );
}

/**
 * Validate that all required questions have been answered
 *
 * @returns Array of missing question IDs (empty if all required questions answered)
 */
function findMissingRequiredQuestions(
  requiredQuestionIds: string[],
  answers: UserAssessmentAnswers
): string[] {
  return requiredQuestionIds.filter((questionId) => !(questionId in answers));
}

/**
 * Submit an assessment for scoring
 *
 * Validates the assessment can be submitted, merges final answers,
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

  // Merge new answers with existing answers
  const mergedAnswers: UserAssessmentAnswers = {
    ...assessment.answers,
    ...data.answers,
  };

  // Validate required questions are answered
  const requiredQuestionIds = await getRequiredQuestionIds(flow.steps);
  const missingQuestionIds = findMissingRequiredQuestions(requiredQuestionIds, mergedAnswers);

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

  // Convert merged answers to responses format for scoring job
  const responses = Object.values(mergedAnswers).map((answer) => ({
    questionId: answer.questionId,
    answerValue: answer.answerValue,
    answerId: answer.answerId,
  }));

  // Execute all writes in a single transaction for atomicity
  // If any step fails, all changes are rolled back
  return await withRLS(tenantId, userId, async (tx) => {
    // Update assessment with merged answers
    await userAssessmentRepository.updateProgress(
      tenantId,
      assessmentId,
      {
        answers: mergedAnswers,
      },
      { tx }
    );

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
