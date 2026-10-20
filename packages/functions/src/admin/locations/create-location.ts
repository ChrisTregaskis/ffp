import { type CreateLocationResponse, createLocationRequestSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  createLocationService,
  createRequestContext,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /admin/organisations/{orgId}/locations
 *
 * Creates a new location under an existing organisation. Admin role required.
 *
 * Request body:
 * ```json
 * { "locationName": "Bath Clinic" }
 * ```
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system admins can create locations',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateLocationResponse> => {
      const organisationId = event.pathParameters?.orgId;

      if (!organisationId) {
        throw new ValidationError('Organisation ID is required');
      }

      const body = JSON.parse(event.body ?? '{}') as unknown;
      const input = createLocationRequestSchema.parse(body);

      const ctx = createRequestContext(context);

      return await createLocationService(ctx, organisationId, input);
    }
  )
);
