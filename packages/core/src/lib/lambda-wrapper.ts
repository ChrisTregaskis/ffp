/**
 * Lambda function error handling wrapper
 *
 * Provides consistent error handling and response formatting for all Lambda functions.
 * Wraps handler functions to catch errors and convert them to properly formatted
 * API Gateway responses.
 *
 * Integrates structured logging for all requests with organisation context awareness.
 */

import { ZodError } from 'zod';

import { extractUserContext, type APIGatewayProxyEventV2WithJWT } from './context.js';
import { translateDatabaseError } from './database-errors.js';
import { BaseError, ForbiddenError, InternalServerError } from './errors.js';
import { describeErrorForLog, describeShapeForLog } from './log-safe-error.js';
import { createLogger, type LogContext, type TenantLogger } from './logger.js';

import type { ApiErrorBody, ApiFieldError } from '../schemas/api-error.schema.js';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Wraps a Lambda handler with error handling and structured logging middleware
 *
 * This wrapper:
 * 1. Extracts organisation context and creates structured logger
 * 2. Logs request start with path and method
 * 3. Executes the handler and returns success responses (200)
 * 4. Logs request completion with status code
 * 5. Translates PostgreSQL driver errors into the application error hierarchy
 * 6. Catches BaseError instances and returns appropriate status codes
 * 7. Catches ZodError instances and returns validation errors (400)
 * 8. Catches unexpected errors and returns 500 with sanitised message
 * 9. Logs all errors with context for debugging (a 403 refusal at warn, without a stack)
 *
 * Security: Ensures sensitive information is never exposed in error messages or logs
 *
 * @param handler - The Lambda handler function to wrap
 * @returns Wrapped handler that returns API Gateway responses
 *
 * @example
 * ```typescript
 * export const main = withErrorHandling(async (event) => {
 *   const data = await getUserById(event.pathParameters.id);
 *   return { user: data };
 * });
 * ```
 */
export const withErrorHandling = <TResult>(
  handler: (event: APIGatewayProxyEventV2WithJWT) => Promise<TResult>
) => {
  return async (event: APIGatewayProxyEventV2WithJWT): Promise<APIGatewayProxyResultV2> => {
    // Try to extract user context for structured logging (only works for authenticated requests)
    let logger: TenantLogger | null = null;
    try {
      const context = extractUserContext(event);
      logger = createLogger(context);
      logger.info('Request started', {
        path: event.rawPath,
        method: event.requestContext.http.method,
      });
    } catch {
      // Context extraction failed (unauthenticated request or invalid JWT)
      // Fall back to console logging for backwards compatibility
    }

    try {
      const result = await handler(event);

      // Log successful completion
      if (logger) {
        logger.info('Request completed', { statusCode: 200 });
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      };
    } catch (rawError) {
      const error = translateDatabaseError(rawError);

      // Diagnostics come from the raw error; the response comes from the
      // translated one. A database error's message and stack carry the failed
      // SQL and its bound parameters, so it is summarised rather than logged.
      const { stack, ...diagnostics } = describeErrorForLog(rawError);

      // Extract requestId for tracing (optional for tests)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const requestId = event.requestContext?.requestId;

      // A refusal is expected behaviour, not a failure: warn without a stack or the event,
      // but keep the route so the line stands alone at a WARN log level.
      if (logger && error instanceof ForbiddenError) {
        logger.warn('Request refused', {
          error: error.message,
          errorType: error.code,
          method: event.requestContext.http.method,
          path: event.rawPath,
        });
      } else if (logger) {
        logger.error('Request failed', {
          ...diagnostics,
          // For ZodError, use the structured issues array instead of the stringified message
          ...(error instanceof ZodError ? { error: error.issues } : { stack }),
          errorType:
            error instanceof ZodError
              ? 'VALIDATION_ERROR'
              : error instanceof BaseError
                ? error.code
                : 'UNKNOWN_ERROR',
          request: describeRequestForLog(event),
        });
      } else {
        // Fallback to console.error for unauthenticated requests
        console.error('Lambda error:', {
          ...diagnostics,
          // For ZodError, use the structured issues array instead of the stringified message
          ...(error instanceof ZodError ? { error: error.issues } : { stack }),
          requestId,
          request: describeRequestForLog(event),
        });
      }

      // Handle application errors (our custom error classes)
      if (error instanceof BaseError) {
        const errorBody: ApiErrorBody = {
          error: error.code,
          message: error.message,
          ...(requestId && { requestId }),
        };

        // Only include details if present
        if (error.details) {
          errorBody.details = error.details;
        }

        return {
          statusCode: error.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorBody),
        };
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errorBody: ApiErrorBody = {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          ...(requestId && { requestId }),
          details: error.issues.map(
            (err): ApiFieldError => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code,
            })
          ),
        };

        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorBody),
        };
      }

      // Handle unexpected errors (don't expose internal details)
      const internalError = new InternalServerError();
      const errorBody: ApiErrorBody = {
        error: internalError.code,
        message: internalError.message,
        ...(requestId && { requestId }),
      };

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorBody),
      };
    }
  };
};

const describeBodyForLog = (body: string | undefined): Record<string, unknown> => {
  if (!body) {
    return { type: 'none' };
  }

  try {
    return describeShapeForLog(JSON.parse(body));
  } catch {
    return { type: 'unparseable', length: body.length };
  }
};

/**
 * What a failure log may say about the request: its method, its path and the keys of its
 * query and body, never their values, which carry members' emails, names, phone numbers,
 * dates of birth and answers. The path holds only ids (UUIDs and public ids), which an
 * operator needs to find the resource. Headers and the request context are left out: they
 * carry the bearer token and the JWT claims, email included.
 */
const describeRequestForLog = (event: APIGatewayProxyEventV2WithJWT): LogContext => ({
  method: event.requestContext.http.method,
  path: event.rawPath,
  queryKeys: Object.keys(event.queryStringParameters ?? {}),
  body: describeBodyForLog(event.body),
});
