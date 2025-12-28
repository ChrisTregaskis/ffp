import { getUserIdFromContext } from '../lib/context';
import { NotFoundError, ValidationError } from '../lib/errors';

import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { TenantContext } from '../lib/context';
import type {
  StartAssessmentResponse,
  SaveProgressRequest,
  SaveProgressResponse,
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
