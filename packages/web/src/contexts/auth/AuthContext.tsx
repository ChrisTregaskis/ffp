import { getCurrentUser, fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import { ZodError } from 'zod';

import { jwtUserClaimsSchema } from '@ffp/core';

import { createLogger } from '@web/lib/logger';

import { isTransientAuthError, retryTransientAuthError } from './auth-retry';
import { AuthContext, type AuthContextType, type AuthUser } from './auth.definitions';

const logger = createLogger('AuthContext');

const fetchSession = async (): ReturnType<typeof fetchAuthSession> => {
  // Verify user is authenticated
  await getCurrentUser();

  // Fetch JWT session to extract tenant context
  return fetchAuthSession();
};

const loadAuthUser = async (): Promise<AuthUser> => {
  // Only the Cognito calls are retried; a claims failure will not change on a second try
  const session = await retryTransientAuthError(fetchSession);
  const idToken = session.tokens?.idToken;

  if (!idToken) {
    throw new Error('SESSION_EXPIRED:No valid tokens - session expired');
  }

  // Validate JWT claims using Zod schema from @ffp/core
  // This provides both runtime validation and type safety
  const claims = jwtUserClaimsSchema.parse(idToken.payload);

  // Note: Cognito attribute 'custom:tenantId' is immutable — it maps to organisationId
  return {
    userId: claims.sub,
    email: claims.email,
    organisationId: claims['custom:tenantId'],
    role: claims['custom:role'], // Type-safe UserRole from @ffp/core
  };
};

/**
 * Authentication provider component that manages auth state and operations.
 *
 * Wraps the application to provide authentication context to all child components.
 * Automatically checks for an existing session on mount and extracts tenant context
 * from JWT claims.
 *
 */
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUnavailable, setAuthUnavailable] = useState(false);
  // The retry wait leaves room for a sign-in to start a newer check; only the newest may set state
  const latestCheckId = useRef(0);

  /**
   * Check for existing authentication session on mount.
   */
  useEffect(() => {
    void checkAuth();
    // Disabled as we're doing this on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Verify if user is authenticated and extract tenant context from JWT.
   *
   * Retrieves the current user from Cognito and parses the JWT ID token to extract:
   * - User ID and email (standard claims)
   * - Organisation ID (custom:tenantId — Cognito attribute name is immutable)
   * - User role (custom:role)
   *
   * Uses Zod schema validation from @ffp/core to ensure JWT claims are valid.
   * Silently fails if no session exists (user remains null). A transient failure is
   * retried, then reported through `authUnavailable` rather than as a sign-out, because
   * Amplify still holds the session and a later check restores it.
   */
  const checkAuth = useCallback(async (): Promise<void> => {
    const checkId = ++latestCheckId.current;
    const isStale = (): boolean => checkId !== latestCheckId.current;

    try {
      setLoading(true);
      setError(null);
      setAuthUnavailable(false);

      const authUser = await loadAuthUser();

      if (isStale()) {
        return;
      }

      setUser(authUser);
    } catch (err) {
      if (isStale()) {
        return;
      }

      // Handle Zod validation errors with detailed messages
      if (err instanceof ZodError) {
        logger.error('JWT validation failed - invalid token claims', { issues: err.issues });
        const errorMessage = `Invalid JWT claims: ${err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`;
        setError(errorMessage);

        // Clear invalid tokens from storage
        await signOut({ global: false });
      } else if (err instanceof Error && err.message.startsWith('SESSION_EXPIRED:')) {
        // Session expired - inform user with friendly message
        const friendlyMessage = 'Your session has expired. Please log in again.';
        logger.warn('Session expired - user needs to re-authenticate', { error: err.message });
        setError(friendlyMessage);
      } else if (isTransientAuthError(err)) {
        logger.warn('Sign-in service unreachable after retries', {
          error: err instanceof Error ? err.name : 'unknown',
        });
        setAuthUnavailable(true);
      } else {
        // Other authentication errors (not logged in, revoked session, etc.)
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred during authentication';
        logger.error('Authentication error', { error: errorMessage });
        // Don't set user-facing error for "not authenticated" - this is expected state
      }

      // Silent failure - user remains null if not authenticated
      setUser(null);
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await signIn({ username: email, password });

        // Refresh user state after successful login
        await checkAuth();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkAuth]
  );

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await signOut();
      setUser(null);
      setAuthUnavailable(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    authUnavailable,
    login: handleLogin,
    logout: handleLogout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
