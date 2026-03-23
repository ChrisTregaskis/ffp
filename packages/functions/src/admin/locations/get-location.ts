import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  getLocationService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/locations/{id}
 *
 * Returns a single location by ID. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can view location details');
  }

  const locationId = event.pathParameters?.id;

  if (!locationId) {
    throw new ValidationError('Location ID is required');
  }

  return await getLocationService(context, locationId);
});
