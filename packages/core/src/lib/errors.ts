/**
 * Custom error classes for FFP application
 *
 * Provides a typed error hierarchy with HTTP status codes for consistent
 * error handling across Lambda functions and services.
 */

/**
 * Base error class for all application errors
 *
 * Extends the native Error class with additional properties for
 * HTTP status codes, error codes, and optional contextual details.
 */
export class BaseError extends Error {
  /**
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (e.g., 'VALIDATION_ERROR')
   * @param statusCode - HTTP status code for API responses
   * @param details - Optional additional context (e.g., validation errors)
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (V8/Node.js)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 401 Unauthorised - Authentication failures
 *
 * Used when:
 * - JWT token is missing, invalid, or expired
 * - Login credentials are incorrect
 * - User is not authenticated
 */
export class UnauthorisedError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, 'UNAUTHORISED', 401);
  }
}

/**
 * 403 Forbidden - Authorisation failures
 *
 * Used when:
 * - User is authenticated but lacks required permissions
 * - User attempts to access resources outside their tenant
 * - Role-based access control denies the action
 */
export class ForbiddenError extends BaseError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * 404 Not Found - Resource not found
 *
 * Used when:
 * - Requested resource does not exist
 * - Resource exists but is outside user's tenant (security measure)
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * 400 Bad Request - Validation failures
 *
 * Used when:
 * - Request body fails Zod schema validation
 * - Business rule validation fails
 * - Required fields are missing or malformed
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * 409 Conflict - Resource conflicts
 *
 * Used when:
 * - Attempting to create a resource that already exists (e.g., duplicate email)
 * - Concurrent modification conflicts
 * - State transition conflicts
 */
export class ConflictError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * 500 Internal Server Error - Unexpected errors
 *
 * Used when:
 * - Unhandled exceptions occur
 * - External service failures (AWS SDK, database, etc.)
 * - Programming errors that shouldn't happen in production
 *
 * Note: This is typically created by the error handler middleware
 * rather than thrown directly in application code.
 */
export class InternalServerError extends BaseError {
  constructor(message = 'An unexpected error occurred') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
