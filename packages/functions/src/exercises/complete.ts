import {
  exerciseCompletionParamsSchema,
  toggleExerciseCompletionSchema,
  toggleExerciseCompletionResponseSchema,
  type ToggleExerciseCompletionResponse,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  exerciseService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /exercises/{completionId}/complete
 * Toggles exercise completion and returns cascade results.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ToggleExerciseCompletionResponse> => {
    const context = extractUserContext(event);

    const params = exerciseCompletionParamsSchema.safeParse(event.pathParameters);

    if (!params.success) {
      throw new ValidationError(params.error.message);
    }

    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = toggleExerciseCompletionSchema.safeParse(body);

    if (!input.success) {
      throw new ValidationError(input.error.message);
    }

    const result = await exerciseService.toggleExerciseCompletion(
      params.data.completionId,
      input.data.completed,
      context
    );

    return toggleExerciseCompletionResponseSchema.parse(result);
  }
);
