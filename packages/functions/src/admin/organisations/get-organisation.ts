import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  getOrganisationService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/organisations/{id}
 *
 * Returns a single organisation by ID. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can view organisation details');
  }

  const organisationId = event.pathParameters?.id;

  if (!organisationId) {
    throw new ValidationError('Organisation ID is required');
  }

  return await getOrganisationService(context, organisationId);
});
