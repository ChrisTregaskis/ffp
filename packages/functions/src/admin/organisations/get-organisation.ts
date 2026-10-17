import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  getOrganisationService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/organisations/{id}
 *
 * Returns a single organisation by ID. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view organisation details',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const organisationId = event.pathParameters?.id;

      if (!organisationId) {
        throw new ValidationError('Organisation ID is required');
      }

      return await getOrganisationService(context, organisationId);
    }
  )
);
