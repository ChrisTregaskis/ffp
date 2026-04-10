import {
  createSystemContext,
  SYSTEM_PLACEHOLDER_ORGANISATION_ID,
  type APIGatewayProxyEventV2WithJWT,
} from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as getMeHandler } from './get-me';
import { handler as inviteUserHandler } from './invite-user';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const ROUTER_CONTEXT = createSystemContext({
  systemId: 'user-router',
  organisationId: SYSTEM_PLACEHOLDER_ORGANISATION_ID,
});

/**
 * Route registry mapping HTTP methods to path handlers.
 * All routes in this domain require JWT authentication (enforced at API Gateway level).
 */
const routes: RouteRegistry = {
  GET: {
    '/me': getMeHandler,
  },
  POST: {
    '/invite-user': inviteUserHandler, // Invite new user to organisation/location
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
  const result = validateAndMatchRoute(event, routes, 'user', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  // Execute the matched handler
  return result.handler(event);
};
