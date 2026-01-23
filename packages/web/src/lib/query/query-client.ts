import { QueryClient } from '@tanstack/react-query';

/** HTTP status codes that should trigger retry */
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Determines whether a failed query should be retried
 *
 * @description Smart retry logic:
 * - Retries on network errors and 5xx server errors
 * - Does NOT retry on 4xx client errors (bad request, auth, forbidden, not found)
 * - Maximum 3 retry attempts
 */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // Stop after 3 retries
  if (failureCount >= 3) return false;

  // Check for HTTP error status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return RETRYABLE_STATUS_CODES.has(status);
  }

  // Retry network errors (no status code)
  return true;
};

/**
 * Pre-configured QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: shouldRetry,
      refetchOnWindowFocus: false, // Disable for better UX
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});
