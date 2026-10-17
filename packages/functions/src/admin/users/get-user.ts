import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  getUserService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/users/{id}
 *
 * Returns a single programme user by ID with location details. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view user details',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const userId = event.pathParameters?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      return await getUserService(context, userId);
    }
  )
);
