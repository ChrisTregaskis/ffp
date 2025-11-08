import { handler as createBusinessHandler } from './create-business';

import type { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Admin Domain Router
 *
 * This handler acts as a proxy router for all /admin/* routes.
 * It routes incoming requests to the appropriate domain handler based on HTTP method and path.
 *
 * Pattern: ANY /admin/{proxy+}
 * - GET /admin/businesses -> routes[GET]['/businesses']
 * - POST /admin/create-business -> routes[POST]['/create-business']
 */

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResultV2>;

/**
 * Route registry mapping HTTP methods to path handlers.
 * Add new routes here to keep sst.config.ts clean.
 *
 * Uses Partial to allow dynamic method and path lookups at runtime.
 */
const routes: Partial<Record<string, Partial<Record<string, RouteHandler>>>> = {
  POST: {
    '/create-business': createBusinessHandler,
    // Future admin routes:
    // '/update-business': updateBusinessHandler,
    // '/delete-business': deleteBusinessHandler,
  },
  GET: {
    // Future admin routes:
    // '/businesses': listBusinessesHandler,
    // '/business/:id': getBusinessHandler,
  },
  PUT: {
    // Future admin routes:
    // '/business/:id': updateBusinessHandler,
  },
  DELETE: {
    // Future admin routes:
    // '/business/:id': deleteBusinessHandler,
  },
};

/**
 * Main proxy handler that routes requests to domain handlers.
 * Returns 404 for unregistered routes, 405 for unsupported methods.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  const method = event.httpMethod;
  const path = `/${event.pathParameters?.proxy ?? ''}`;

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
