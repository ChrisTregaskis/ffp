import { apiFieldErrorsSchema, type ApiErrorBody, type ApiFieldError } from '@ffp/core';

import { API_ERROR_NAME, RETRYABLE_STATUS_CODES } from '@web/constants';

/** The body every API error carries. */
export type ApiErrorResponse = ApiErrorBody;

/**
 * Normalised API error class
 */
export class ApiError extends Error {
  readonly name = API_ERROR_NAME;

  constructor(
    /** HTTP status code */
    readonly status: number,
    /** Machine-readable error code */
    readonly code: string,
    /** Human-readable message */
    message: string,
    /** Additional details */
    readonly details?: unknown,
    /** Request ID for debugging */
    readonly requestId?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Whether this error should be retried */
  get isRetryable(): boolean {
    return RETRYABLE_STATUS_CODES.has(this.status);
  }

  /** Whether this is an authentication error */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** Whether this is a forbidden error */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Whether this is a not found error */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Whether this is a validation error */
  get isValidationError(): boolean {
    return this.status === 400 && this.code === 'VALIDATION_ERROR';
  }

  /** A validation error's per-field failures; empty when `details` holds anything else. */
  get fieldErrors(): ApiFieldError[] {
    const parsed = apiFieldErrorsSchema.safeParse(this.details);

    return parsed.success ? parsed.data : [];
  }

  /**
   * Create ApiError from fetch Response
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let body: ApiErrorResponse | null = null;

    try {
      body = (await response.json()) as ApiErrorResponse;
    } catch {
      // Response body is not JSON
    }

    return new ApiError(
      response.status,
      body?.error ?? `HTTP_${String(response.status)}`,
      body?.message ?? (response.statusText || 'An error occurred'),
      body?.details,
      body?.requestId ?? response.headers.get('x-request-id') ?? undefined
    );
  }

  /**
   * Create ApiError for network failures
   */
  static networkError(originalError: Error): ApiError {
    return new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the server. Please check your connection.',
      { originalError: originalError.message }
    );
  }

  /**
   * Create ApiError for timeouts
   */
  static timeoutError(): ApiError {
    return new ApiError(408, 'TIMEOUT_ERROR', 'The request timed out. Please try again.');
  }

  /**
   * Type guard for ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
