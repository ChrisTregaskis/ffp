/**
 * Wait before the one extra auth-check attempt after a transient failure. Amplify already
 * retries each Cognito request up to three times within about a second; this longer wait
 * covers a connection that is still coming back, such as just after waking.
 */
export const AUTH_CHECK_RETRY_DELAYS_MS = [1000] as const;

/**
 * Error names that mean the user is definitively signed out. Every other failure is
 * transient, because Amplify keeps the stored session for it and re-throws, so a later
 * check restores the session (`@aws-amplify/auth` `TokenOrchestrator.handleErrors` clears
 * tokens only for the names in its `isAuthenticationError` list, mirrored here).
 *
 * - `UserUnAuthenticatedException`: no stored session (`assertAuthTokens`), including after
 *   Amplify cleared the tokens for an expired refresh token.
 * - `NotAuthorizedException` … `RefreshTokenReuseException`: Amplify's clear-tokens list.
 * - `AuthUserPoolException`: Amplify has no user pool configured, so there is no session.
 */
const SIGNED_OUT_AUTH_ERROR_NAMES: ReadonlySet<string> = new Set([
  'UserUnAuthenticatedException',
  'NotAuthorizedException',
  'TokenRevokedException',
  'UserNotFoundException',
  'PasswordResetRequiredException',
  'UserNotConfirmedException',
  'RefreshTokenReuseException',
  'AuthUserPoolException',
]);

/**
 * Whether an auth-check failure is transient: network, service and throttling errors, and
 * anything else Amplify keeps the session for. A bare `Error` is not Amplify's (its errors
 * carry a specific name), so it is treated as signed out rather than retried.
 */
export const isTransientAuthError = (err: unknown): boolean =>
  err instanceof Error && err.name !== 'Error' && !SIGNED_OUT_AUTH_ERROR_NAMES.has(err.name);

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `attempt`, retrying after each delay while it fails transiently. A non-transient
 * failure, or a transient one after the last delay, is re-thrown.
 */
export const retryTransientAuthError = async <T>(
  attempt: () => Promise<T>,
  delaysMs: readonly number[] = AUTH_CHECK_RETRY_DELAYS_MS
): Promise<T> => {
  for (const delayMs of delaysMs) {
    try {
      return await attempt();
    } catch (err) {
      if (!isTransientAuthError(err)) {
        throw err;
      }

      await wait(delayMs);
    }
  }

  return attempt();
};
