import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  updateOrganisationService,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /admin/organisations/{id}
 *
 * Updates an organisation's name, status, or settings. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can update organisations');
  }

  const organisationId = event.pathParameters?.id;

  if (!organisationId) {
    throw new ValidationError('Organisation ID is required');
  }

  const body = JSON.parse(event.body ?? '{}') as unknown;

  return await updateOrganisationService(context, organisationId, body);
});
