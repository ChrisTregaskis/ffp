import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  createUserService,
} from '@ffp/core/server';

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
      const body = JSON.parse(event.body ?? '{}') as unknown;

      return await createUserService(context, body);
    }
  )
);
