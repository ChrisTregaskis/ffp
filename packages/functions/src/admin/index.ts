import { createSystemContext, type APIGatewayProxyEventV2WithJWT } from '@ffp/core/server';

import { validateAndMatchRoute, type RouteRegistry } from '../lib/router';

import { handler as createCustomerHandler } from './create-customer';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Infrastructure-level system context for router logging.
 * Uses placeholder tenantId as routing happens before authentication.
 */
const ROUTER_CONTEXT = createSystemContext({
  systemId: 'admin-router',
  tenantId: '00000000-0000-0000-0000-000000000000', // Placeholder for pre-auth routing
});

/**
 * Route registry mapping HTTP methods to path handlers.
 * Add new routes here to keep sst.config.ts clean.
 */
const routes: RouteRegistry = {
  POST: {
    '/create-customer': createCustomerHandler,
    // Future admin routes:
    // '/update-customer': updateCustomerHandler,
    // '/delete-customer': deleteCustomerHandler,
  },
  GET: {
    // Future admin routes:
    // '/customers': listCustomersHandler,
    // '/customer/:id': getCustomerHandler,
  },
  PUT: {
    // Future admin routes:
    // '/customer/:id': updateCustomerHandler,
  },
  DELETE: {
    // Future admin routes:
    // '/customer/:id': deleteCustomerHandler,
  },
};

/**
 * Main proxy handler that routes requests to domain handlers.
 * Returns 404 for unregistered routes, 405 for unsupported methods.
 */
export const handler = async (
  event: APIGatewayProxyEventV2WithJWT
): Promise<APIGatewayProxyResultV2> => {
  const result = validateAndMatchRoute(event, routes, 'admin', ROUTER_CONTEXT);

  if (result.type === 'error') {
    return result.response;
  }

  // Execute the matched handler
  return result.handler(event);
};
