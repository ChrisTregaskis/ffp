import { Logger } from '@ffp/core/server';
import type { TenantContext, APIGatewayProxyEventV2WithJWT } from '@ffp/core/server';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export type RouteHandler = (
  event: APIGatewayProxyEventV2WithJWT
) => Promise<APIGatewayProxyResultV2>;

export type RouteRegistry = Partial<Record<string, Partial<Record<string, RouteHandler>>>>;

/**
 * Result of route validation - either an error response or the matched handler
 */
export type RouteValidationResult =
  | { type: 'error'; response: APIGatewayProxyResultV2 }
  | { type: 'success'; handler: RouteHandler; method: string; path: string };

/**
 * Validate and match a route from the API Gateway event
 *
 * Performs three levels of validation:
 * 1. Method validation (400 Bad Request if missing)
 * 2. Method support check (405 Method Not Allowed if unsupported)
 * 3. Route existence check (404 Not Found if route doesn't exist)
 *
 * @param event - API Gateway proxy event
 * @param routes - Route registry mapping methods to path handlers
 * @param domainName - Domain name for logging (e.g., 'auth', 'admin')
 * @param routerContext - System context for router logging
 * @returns Either an error response or the matched handler with method/path info
 *
 * @example
 * Ref: packages/functions/src/auth/index.ts
 */
export function validateAndMatchRoute(
  event: APIGatewayProxyEventV2WithJWT,
  routes: RouteRegistry,
  domainName: string,
  routerContext: TenantContext
): RouteValidationResult {
  const logger = new Logger(routerContext);

  // Extract HTTP method and path from V1 event format
  const method = event.requestContext.http.method;
  const path = `/${event.pathParameters?.proxy ?? ''}`;

  logger.debug(`Routing ${domainName} request`, {
    method,
    path,
    pathParameters: event.pathParameters,
  });

  // Method must be present
  if (!method) {
    return {
      type: 'error',
      response: {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Unable to determine HTTP method from event',
        }),
      },
    };
  }

  // Method must be supported
  const methodRoutes = routes[method];
  if (!methodRoutes) {
    return {
      type: 'error',
      response: {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          Allow: Object.keys(routes).join(', '),
        },
        body: JSON.stringify({
          error: 'Method Not Allowed',
          message: `HTTP method ${method} is not supported for this endpoint`,
        }),
      },
    };
  }

  // Route must exist for this method
  const routeHandler = methodRoutes[path];
  if (!routeHandler) {
    return {
      type: 'error',
      response: {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Not Found',
          message: `Route ${method} ${path} does not exist`,
        }),
      },
    };
  }

  // Success: Return matched handler with routing info
  return {
    type: 'success',
    handler: routeHandler,
    method,
    path,
  };
}
