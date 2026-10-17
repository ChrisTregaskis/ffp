import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  updateLocationService,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /admin/locations/{id}
 *
 * Updates a location's name, address, or status. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update locations',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const locationId = event.pathParameters?.id;

      if (!locationId) {
        throw new ValidationError('Location ID is required');
      }

      const body = JSON.parse(event.body ?? '{}') as unknown;

      return await updateLocationService(context, locationId, body);
    }
  )
);
