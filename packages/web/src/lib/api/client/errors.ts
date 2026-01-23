export interface ApiErrorResponse {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (field errors, etc.) */
  details?: unknown;
  /** Request ID for debugging */
  requestId?: string;
}

/** Error codes that should trigger retry */
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Normalised API error class
 */
export class ApiError extends Error {
  readonly name = 'ApiError';

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
      body?.code ?? `HTTP_${String(response.status)}`,
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
