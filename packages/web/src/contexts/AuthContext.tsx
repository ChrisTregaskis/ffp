import { getCurrentUser, fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// TODO: Figure out how to utilise shared types between packages.
const USER_ROLE_VALUES = [
  'system_admin',
  'customer_owner',
  'customer_admin',
  'customer_user',
  'individual_user',
];

/**
 * User role type derived from valid role values.
 * Ensures type safety and alignment with database role definitions.
 */
export type UserRole = (typeof USER_ROLE_VALUES)[number];

/**
 * Type guard to check if a value is a valid UserRole.
 * Uses runtime array validation against database-defined values.
 */
function isValidUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLE_VALUES as readonly string[]).includes(value);
}

/**
 * User object containing authentication and tenant context extracted from JWT.
 */
export interface User {
  /** Unique user identifier from Cognito (maps to cognitoSub in database) */
  userId: string;
  /** User's email address */
  email: string;
  /** Tenant ID for multi-tenant isolation */
  tenantId: string;
  /** User's role within the tenant (type-safe enum from database schema) */
  role: UserRole;
}

/**
 * Authentication context type defining available auth operations and state.
 */
interface AuthContextType {
  /** Currently authenticated user, or null if not authenticated */
  user: User | null;
  /** Loading state during authentication checks */
  loading: boolean;
  /** Error message from authentication operations */
  error: string | null;
  /** Authenticate user with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** End the current user session */
  logout: () => Promise<void>;
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
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check for existing authentication session on mount.
   */
  useEffect(() => {
    void checkAuth();
  }, []);

  /**
   * Verify if user is authenticated and extract tenant context from JWT.
   *
   * Retrieves the current user from Cognito and parses the JWT ID token to extract:
   * - User ID and email (standard claims)
   * - Tenant ID (custom:tenantId)
   * - User role (custom:role)
   *
   * Silently fails if no session exists (user remains null).
   */
  async function checkAuth(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      // Verify user is authenticated
      await getCurrentUser();

      // Fetch JWT session to extract tenant context
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (!idToken) {
        throw new Error('No ID token found in session');
      }

      // Extract user data from JWT claims
      const { sub, email } = idToken.payload;
      const userId = typeof sub === 'string' ? sub : String(sub);
      const userEmail = typeof email === 'string' ? email : '';
      const tenantId = idToken.payload['custom:tenantId'];
      const role = idToken.payload['custom:role'];

      // Validate required claims
      if (!userId || !userEmail || !tenantId || !role) {
        throw new Error('Missing required claims in JWT token');
      }

      if (typeof tenantId !== 'string') {
        throw new Error('Invalid tenantId type');
      }

      // Validate role is a valid enum value using type guard
      if (!isValidUserRole(role)) {
        const roleStr = String(role);
        const validRoles = (USER_ROLE_VALUES as readonly string[]).join(', ');
        throw new Error(`Invalid role: ${roleStr}. Expected one of: ${validRoles}`);
      }

      // role is now properly typed as UserRole after the type guard
      setUser({
        userId,
        email: userEmail,
        tenantId,
        role,
      });
    } catch (err) {
      // Type guard to safely handle the error
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred during authentication';

      console.error('Authentication error:', errorMessage);

      // Silent failure - user remains null if not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Authenticate user with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if authentication fails
   */
  async function handleLogin(email: string, password: string): Promise<void> {
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
  }

  /**
   * End the current user session and clear auth state.
   */
  async function handleLogout(): Promise<void> {
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
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

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
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
