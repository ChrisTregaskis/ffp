import type { AssessmentFlow } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowRepository,
  db,
  ValidationError,
  NotFoundError,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /assessments/flows/:id
 *
 * Protected endpoint that requires JWT authentication.
 * Returns an assessment flow with its steps for the assessment UI.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentFlow> => {
    extractUserContext(event);

    const flowId = event.pathParameters?.id;

    if (!flowId) {
      throw new ValidationError('Flow ID is required in path');
    }

    const flow = await flowRepository.findById(flowId);

    if (!flow) {
      throw new NotFoundError('Assessment flow', flowId);
    }

    const steps = await flowRepository.findStepsByFlowId(db, flowId);

    return {
      id: flow.id,
      name: flow.name,
      description: flow.description ?? undefined,
      steps: steps.map((s) => ({
        order: s.order,
        type: s.type,
        templateId: s.templateId ?? undefined,
        config: s.config as AssessmentFlow['steps'][number]['config'],
      })),
      isActive: flow.isActive,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  }
);
