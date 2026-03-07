/**
 * Lambda function error handling wrapper
 *
 * Provides consistent error handling and response formatting for all Lambda functions.
 * Wraps handler functions to catch errors and convert them to properly formatted
 * API Gateway responses.
 *
 * Integrates structured logging for all requests with tenant context awareness.
 */

import { ZodError } from 'zod';

import { extractUserContext, type APIGatewayProxyEventV2WithJWT } from './context.js';
import { BaseError, InternalServerError } from './errors.js';
import { createLogger, type TenantLogger } from './logger.js';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Sensitive field names to redact from request bodies
 *
 * These fields contain security-sensitive data that should never
 * appear in logs or error messages.
 */
const SENSITIVE_BODY_FIELDS = [
  'password',
  'refreshToken',
  'accessToken',
  'idToken',
  'secret',
  'apiKey',
] as const;

/**
 * Sensitive header names to redact from requests
 *
 * These headers contain authentication/authorisation data that
 * should never appear in logs.
 */
const SENSITIVE_HEADERS = ['authorization', 'Authorization'] as const;

/**
 * Error response body format
 */
interface ErrorResponseBody {
  error: string;
  message: string;
  requestId?: string;
  details?: Record<string, unknown> | unknown[];
}

/**
 * Wraps a Lambda handler with error handling and structured logging middleware
 *
 * This wrapper:
 * 1. Extracts tenant context and creates structured logger
 * 2. Logs request start with path and method
 * 3. Executes the handler and returns success responses (200)
 * 4. Logs request completion with status code
 * 5. Catches BaseError instances and returns appropriate status codes
 * 6. Catches ZodError instances and returns validation errors (400)
 * 7. Catches unexpected errors and returns 500 with sanitised message
 * 8. Logs all errors with context for debugging
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
    } catch (error) {
      // Extract requestId for tracing (optional for tests)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const requestId = event.requestContext?.requestId;

      // Log error with structured logging if available, otherwise fall back to console
      if (logger) {
        logger.error('Request failed', {
          // For ZodError, use the structured issues array instead of the stringified message
          error:
            error instanceof ZodError
              ? error.issues
              : error instanceof Error
                ? error.message
                : 'Unknown error',
          stack: error instanceof Error && !(error instanceof ZodError) ? error.stack : undefined,
          errorType:
            error instanceof ZodError
              ? 'VALIDATION_ERROR'
              : error instanceof BaseError
                ? error.code
                : 'UNKNOWN_ERROR',
          // Sanitise event data to avoid logging sensitive information
          sanitisedEvent: sanitiseEventForLogging(event),
        });
      } else {
        // Fallback to console.error for unauthenticated requests
        console.error('Lambda error:', {
          // For ZodError, use the structured issues array instead of the stringified message
          error:
            error instanceof ZodError
              ? error.issues
              : error instanceof Error
                ? error.message
                : 'Unknown error',
          stack: error instanceof Error && !(error instanceof ZodError) ? error.stack : undefined,
          requestId,
          // Sanitise event data to avoid logging sensitive information
          event: sanitiseEventForLogging(event),
        });
      }

      // Handle application errors (our custom error classes)
      if (error instanceof BaseError) {
        const errorBody: ErrorResponseBody = {
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
        const errorBody: ErrorResponseBody = {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          ...(requestId && { requestId }),
          details: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
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
      const errorBody: ErrorResponseBody = {
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

/**
 * Sanitises event data for logging
 *
 * Removes sensitive information like:
 * - Authorization headers
 * - Password fields
 * - Tokens
 *
 * @param event - The Lambda event object
 * @returns Sanitised event object safe for logging
 */
const sanitiseEventForLogging = (
  event: APIGatewayProxyEventV2WithJWT
): APIGatewayProxyEventV2WithJWT => {
  const redacted = '[REDACTED]';
  const sanitised = { ...event };

  // Remove sensitive headers
  const headers = { ...sanitised.headers };
  for (const headerName of SENSITIVE_HEADERS) {
    if (headerName in headers) {
      headers[headerName] = redacted;
    }
  }
  sanitised.headers = headers;

  // Remove sensitive fields from body
  if (sanitised.body && typeof sanitised.body === 'string') {
    try {
      const body = JSON.parse(sanitised.body) as unknown;

      if (body && typeof body === 'object') {
        const bodyObj = body as Record<string, unknown>;

        for (const fieldName of SENSITIVE_BODY_FIELDS) {
          if (fieldName in bodyObj) {
            bodyObj[fieldName] = redacted;
          }
        }

        sanitised.body = JSON.stringify(bodyObj);
      }
    } catch {
      // If body is not valid JSON, leave it as-is
    }
  }

  return sanitised;
};
