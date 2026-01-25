/**
 * HTTP status codes that should trigger automatic retry
 *
 * Used by:
 * - QueryClient retry logic
 * - ApiError.isRetryable check
 */
export const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Standard API error name for type checking
 */
export const API_ERROR_NAME = 'ApiError';
