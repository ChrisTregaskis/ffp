import { extractUserContext, type APIGatewayProxyEventV2WithJWT } from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as inviteUserHandler } from './invite-user';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Route registry mapping HTTP methods to path handlers.
 * All routes in this domain require JWT authentication (enforced at API Gateway level).
 */
const routes: RouteRegistry = {
  GET: {
    // Future user routes:
    // '/me': getCurrentUserHandler,
    // '/profile': getUserProfileHandler,
  },
  POST: {
    '/invite-user': inviteUserHandler, // Invite new user to tenant/customer
    // Future user routes:
    // '/update-profile': updateProfileHandler,
  },
  PUT: {
    // Future user routes:
    // '/change-password': changePasswordHandler,
  },
  DELETE: {
    // Future user routes:
    // '/deactivate': deactivateUserHandler,
  },
};

/**
 * Main proxy handler that routes requests to user domain handlers.
 * All requests are authenticated - JWT claims are validated by API Gateway.
 * Returns 404 for unregistered routes, 405 for unsupported methods.
 */
export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  // Extract user context from validated JWT claims
  const context = extractUserContext(event);

  const result = validateAndMatchRoute(event, routes, 'user', context);

  if (result.type === 'error') {
    return result.response;
  }

  // Execute the matched handler
  return result.handler(event);
};
