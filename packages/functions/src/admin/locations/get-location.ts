import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  getLocationService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/locations/{id}
 *
 * Returns a single location by ID. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view location details',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const locationId = event.pathParameters?.id;

      if (!locationId) {
        throw new ValidationError('Location ID is required');
      }

      return await getLocationService(context, locationId);
    }
  )
);
