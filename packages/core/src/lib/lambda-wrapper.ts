/**
 * Lambda function error handling wrapper
 *
 * Provides consistent error handling and response formatting for all Lambda functions.
 * Wraps handler functions to catch errors and convert them to properly formatted
 * API Gateway responses.
 */

import { ZodError } from 'zod';

import { BaseError, InternalServerError } from './errors.js';

import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Error response body format
 */
interface ErrorResponseBody {
  error: string;
  message: string;
  details?: Record<string, unknown> | unknown[];
}

/**
 * Wraps a Lambda handler with error handling middleware
 *
 * This wrapper:
 * 1. Executes the handler and returns success responses (200)
 * 2. Catches BaseError instances and returns appropriate status codes
 * 3. Catches ZodError instances and returns validation errors (400)
 * 4. Catches unexpected errors and returns 500 with sanitised message
 * 5. Logs all errors with context for debugging
 *
 * Security: Ensures sensitive information is never exposed in error messages
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
export const withErrorHandling = <TResult>(handler: (event: unknown) => Promise<TResult>) => {
  return async (event: unknown): Promise<APIGatewayProxyResultV2> => {
    try {
      const result = await handler(event);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      };
    } catch (error) {
      // Log error with context for debugging
      // Note: In production, this should use structured logging (see FFP-44)
      console.error('Lambda error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        // Sanitise event data to avoid logging sensitive information
        event: sanitiseEventForLogging(event),
      });

      // Handle application errors (our custom error classes)
      if (error instanceof BaseError) {
        const errorBody: ErrorResponseBody = {
          error: error.code,
          message: error.message,
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
          details: error.errors.map((err) => ({
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
const sanitiseEventForLogging = (event: unknown): unknown => {
  const redacted = '[REDACTED]';

  if (!event || typeof event !== 'object') {
    return event;
  }

  const sanitised = { ...event } as Record<string, unknown>;

  // Remove authorization headers
  if (sanitised.headers && typeof sanitised.headers === 'object') {
    const headers = { ...sanitised.headers } as Record<string, unknown>;
    if ('authorization' in headers) {
      headers.authorization = redacted;
    }
    if ('Authorization' in headers) {
      headers.Authorization = redacted;
    }
    sanitised.headers = headers;
  }

  // Remove password fields from body
  if (sanitised.body && typeof sanitised.body === 'string') {
    try {
      const body = JSON.parse(sanitised.body) as unknown;
      if (body && typeof body === 'object') {
        const bodyObj = body as Record<string, unknown>;
        if ('password' in bodyObj) {
          bodyObj.password = redacted;
        }
        if ('refreshToken' in bodyObj) {
          bodyObj.refreshToken = redacted;
        }
        sanitised.body = JSON.stringify(bodyObj);
      }
    } catch {
      // If body is not valid JSON, leave it as-is
    }
  }

  return sanitised;
};
