import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  getUserService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/users/{id}
 *
 * Returns a single programme user by ID with customer details. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can view user details');
  }

  const userId = event.pathParameters?.id;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  return await getUserService(context, userId);
});
