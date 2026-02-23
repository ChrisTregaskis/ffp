import { getCurrentUser, fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { ZodError } from 'zod';

import { jwtUserClaimsSchema } from '@ffp/core';

import { createLogger } from '@web/lib/logger';

import { AuthContext, type AuthContextType, type AuthUser } from './auth.definitions';

const logger = createLogger('AuthContext');

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
   * - Tenant ID (custom:tenantId)
   * - User role (custom:role)
   *
   * Uses Zod schema validation from @ffp/core to ensure JWT claims are valid.
   * Silently fails if no session exists (user remains null).
   */
  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Verify user is authenticated
      await getCurrentUser();

      // Fetch JWT session to extract tenant context
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (!idToken) {
        throw new Error('SESSION_EXPIRED:No valid tokens - session expired');
      }

      // Validate JWT claims using Zod schema from @ffp/core
      // This provides both runtime validation and type safety
      const claims = jwtUserClaimsSchema.parse(idToken.payload);

      // TypeScript now knows claims are correctly typed with all required fields
      setUser({
        userId: claims.sub,
        email: claims.email,
        tenantId: claims['custom:tenantId'],
        role: claims['custom:role'], // Type-safe UserRole from @ffp/core
      });
    } catch (err) {
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
      } else {
        // Other authentication errors (not logged in, network issues, etc.)
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred during authentication';
        logger.error('Authentication error', { error: errorMessage });
        // Don't set user-facing error for "not authenticated" - this is expected state
      }

      // Silent failure - user remains null if not authenticated
      setUser(null);
    } finally {
      setLoading(false);
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
    login: handleLogin,
    logout: handleLogout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
