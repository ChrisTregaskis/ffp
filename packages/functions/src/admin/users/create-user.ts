import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  createUserService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for POST /admin/users
 *
 * Creates a programme user with Cognito provisioning and DB record.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can create users',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const body = parseJsonBody(event.body);

      return await createUserService(context, body);
    }
  )
);
