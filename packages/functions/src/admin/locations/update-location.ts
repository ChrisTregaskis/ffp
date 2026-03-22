import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  updateLocationService,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /admin/locations/{id}
 *
 * Updates a location's name, address, or status. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can update locations');
  }

  const locationId = event.pathParameters?.id;

  if (!locationId) {
    throw new ValidationError('Location ID is required');
  }

  const body = JSON.parse(event.body ?? '{}') as unknown;

  return await updateLocationService(context, locationId, body);
});
