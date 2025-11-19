import { getCurrentUser, fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { ZodError } from 'zod';

import { jwtUserClaimsSchema, type UserRole } from '@ffp/core';

import { createLogger } from '@web/lib/logger';

const logger = createLogger('AuthContext');

/**
 * User object containing authentication and tenant context extracted from JWT.
 * Lightweight type specific to authentication context (subset of full User type).
 */
export interface AuthUser {
  /** Unique user identifier from Cognito (maps to cognitoSub in database) */
  userId: string;
  /** User's email address */
  email: string;
  /** Tenant ID for multi-tenant isolation */
  tenantId: string;
  /** User's role within the tenant (imported from @ffp/core - single source of truth) */
  role: UserRole;
}

/**
 * Authentication context type defining available auth operations and state.
 */
export interface AuthContextType {
  /** Currently authenticated user, or null if not authenticated */
  user: AuthUser | null;
  /** Loading state during authentication checks */
  loading: boolean;
  /** Error message from authentication operations */
  error: string | null;
  /** Authenticate user with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** End the current user session */
  logout: () => Promise<void>;
  /** Manually refresh authentication state (e.g., after external auth changes) */
  checkAuth: () => Promise<void>;
}

/**
 * Authentication context for managing global auth state.
 */
const AuthContext = createContext<AuthContextType | null>(null);

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

  /**
   * Authenticate user with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if authentication fails
   */
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

  /**
   * End the current user session and clear auth state.
   */
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

/**
 * Custom hook to access authentication context.
 *
 * Must be used within an AuthProvider component.
 *
 * @returns Authentication context with user state and auth operations
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, login, logout } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please log in</div>;
 *
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
