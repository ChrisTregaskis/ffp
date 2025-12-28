import { getUserIdFromContext } from '../lib/context';
import { NotFoundError } from '../lib/errors';

import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { TenantContext } from '../lib/context';
import type { StartAssessmentResponse } from '../schemas/user-assessment.schema';

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
