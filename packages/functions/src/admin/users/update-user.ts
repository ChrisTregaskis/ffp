import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  updateUserService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for PUT /admin/users/{id}
 *
 * Updates a programme user's mutable fields. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update users',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const userId = event.pathParameters?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const body = parseJsonBody(event.body);

      return await updateUserService(context, userId, body);
    }
  )
);
