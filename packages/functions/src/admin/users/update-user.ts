import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  updateUserService,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /admin/users/{id}
 *
 * Updates a programme user's mutable fields. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can update users');
  }

  const userId = event.pathParameters?.id;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const body = JSON.parse(event.body ?? '{}') as unknown;

  return await updateUserService(context, userId, body);
});
