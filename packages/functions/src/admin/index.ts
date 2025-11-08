import { createSystemContext, Logger } from '@ffp/core/server';

import { handler as createCustomerHandler } from './create-customer';

import type { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResultV2>;

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
 *
 * Uses Partial to allow dynamic method and path lookups at runtime.
 */
const routes: Partial<Record<string, Partial<Record<string, RouteHandler>>>> = {
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
 *
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const logger = new Logger(ROUTER_CONTEXT);

  // Extract HTTP method and path from V1 event format
  const method = event.httpMethod;
  const path = `/${event.pathParameters?.proxy ?? ''}`;

  logger.debug('Routing admin request', {
    method,
    path,
    pathParameters: event.pathParameters,
  });

  if (!method) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'Unable to determine HTTP method from event',
      }),
    };
  }

  // Check if method is supported
  const methodRoutes = routes[method];
  if (!methodRoutes) {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: Object.keys(routes).join(', '),
      },
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: `HTTP method ${method} is not supported for this endpoint`,
      }),
    };
  }

  // Check if route exists for this method
  const routeHandler = methodRoutes[path];
  if (!routeHandler) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route ${method} ${path} does not exist`,
      }),
    };
  }

  // Execute the matched handler
  return routeHandler(event);
};
