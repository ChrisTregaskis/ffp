import { createLogger } from '@ffp/core/server';
import type { OrganisationContext, APIGatewayProxyEventV2WithJWT } from '@ffp/core/server';

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
 * Result of pattern matching - extracted parameters if matched
 */
type PatternMatchResult = { matched: false } | { matched: true; params: Record<string, string> };

/**
 * Convert a route pattern like '/{id}/progress' to a regex and extract param names.
 *
 * @param pattern - Route pattern with {param} placeholders
 * @returns Object with regex and parameter names in order
 *
 * @example
 * patternToRegex('/{id}/progress')
 * // Returns: { regex: /^\/([^/]+)\/progress$/, paramNames: ['id'] }
 */
const patternToRegex = (pattern: string): { regex: RegExp; paramNames: string[] } => {
  const paramNames: string[] = [];

  // Replace {param} with capture group, escaping other regex chars
  const regexStr = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, (char) => {
      // Don't escape our {param} braces - handle them specially
      if (char === '{' || char === '}') {
        return char;
      }

      return `\\${char}`;
    })
    .replace(/\{([^}]+)\}/g, (_, paramName: string) => {
      paramNames.push(paramName);

      return '([^/]+)'; // Capture group for path segment
    });

  return {
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
  };
};

const isDynamicPattern = (pattern: string): boolean => {
  return pattern.includes('{') && pattern.includes('}');
};

/**
 * Match a path against a route pattern and extract parameters.
 *
 * @param path - Actual request path (e.g., '/abc-123/progress')
 * @param pattern - Route pattern (e.g., '/{id}/progress')
 * @returns Match result with extracted params if successful
 */
const matchPattern = (path: string, pattern: string): PatternMatchResult => {
  const { regex, paramNames } = patternToRegex(pattern);
  const match = path.match(regex);

  if (!match) {
    return { matched: false };
  }

  // Extract captured groups into params object
  const params: Record<string, string> = {};

  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]; // +1 because match[0] is full string
  });

  return { matched: true, params };
};

/**
 * Find a matching route handler, supporting both static and dynamic patterns.
 *
 * @param path - Actual request path
 * @param methodRoutes - Routes for the HTTP method
 * @returns Handler and extracted params if found
 */
const findMatchingRoute = (
  path: string,
  methodRoutes: Partial<Record<string, RouteHandler>>
): { handler: RouteHandler; params: Record<string, string> } | null => {
  // Try exact match first (fastest path for static routes)
  const exactHandler = methodRoutes[path];

  if (exactHandler) {
    return { handler: exactHandler, params: {} };
  }

  // Try pattern matching for dynamic routes
  for (const [pattern, handler] of Object.entries(methodRoutes)) {
    if (!handler || !isDynamicPattern(pattern)) {
      continue;
    }

    const result = matchPattern(path, pattern);

    if (result.matched) {
      return { handler, params: result.params };
    }
  }

  return null;
};

/**
 * Validate and match a route from the API Gateway event
 *
 * Performs three levels of validation:
 * 1. Method validation (400 Bad Request if missing)
 * 2. Method support check (405 Method Not Allowed if unsupported)
 * 3. Route existence check (404 Not Found if route doesn't exist)
 *
 * Supports both static routes (e.g., '/start') and dynamic routes with
 * path parameters (e.g., '/{id}/progress'). Extracted path parameters
 * are injected into event.pathParameters for handler access.
 *
 * @param event - API Gateway proxy event (mutated to include extracted path params)
 * @param routes - Route registry mapping methods to path handlers
 * @param domainName - Domain name for logging (e.g., 'auth', 'admin')
 * @param routerContext - System context for router logging
 * @returns Either an error response or the matched handler with method/path info
 *
 * @example
 * // Static route
 * routes = { POST: { '/start': startHandler } }
 * // Path '/start' matches exactly
 *
 * @example
 * // Dynamic route
 * routes = { PUT: { '/{id}/progress': saveProgressHandler } }
 * // Path '/abc-123/progress' matches, event.pathParameters.id = 'abc-123'
 */
export const validateAndMatchRoute = (
  event: APIGatewayProxyEventV2WithJWT,
  routes: RouteRegistry,
  domainName: string,
  routerContext: OrganisationContext
): RouteValidationResult => {
  const logger = createLogger(routerContext);

  // Extract HTTP method and path from V2 event format
  const method = event.requestContext.http.method;
  const path = `/${event.pathParameters?.proxy ?? ''}`;

  // Handle CORS preflight — return 204 immediately
  // OPTIONS routes are registered without JWT auth in sst.config.ts
  if (method === 'OPTIONS') {
    return {
      type: 'error',
      response: {
        statusCode: 204,
        body: '',
      },
    };
  }

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

  // Find matching route (static or dynamic pattern)
  const matchResult = findMatchingRoute(path, methodRoutes);

  if (!matchResult) {
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

  // Inject extracted path parameters into event for handler access
  // Merge with existing pathParameters (preserving 'proxy' from API Gateway)
  if (Object.keys(matchResult.params).length > 0) {
    event.pathParameters = {
      ...event.pathParameters,
      ...matchResult.params,
    };

    logger.debug(`Extracted path parameters`, {
      extractedParams: matchResult.params,
      mergedPathParameters: event.pathParameters,
    });
  }

  // Success: Return matched handler with routing info
  return {
    type: 'success',
    handler: matchResult.handler,
    method,
    path,
  };
};
