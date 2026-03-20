import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  createUserService,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /admin/users
 *
 * Creates a programme user with Cognito provisioning and DB record.
 * Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can create users');
  }

  const body = JSON.parse(event.body ?? '{}') as unknown;

  return await createUserService(context, body);
});
