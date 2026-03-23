import { createContext } from 'react';

import { type UserRole } from '@ffp/core';

/** User object containing authentication and organisation context extracted from JWT. */
export interface AuthUser {
  /** Unique user identifier from Cognito (maps to cognitoSub in database) */
  userId: string;
  /** User's email address */
  email: string;
  /** Organisation ID for multi-tenant isolation (mapped from Cognito custom:tenantId claim) */
  organisationId: string;
  /** User's role within the organisation (imported from @ffp/core - single source of truth) */
  role: UserRole;
}

/** Authentication context type defining available auth operations and state. */
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

export const AuthContext = createContext<AuthContextType | null>(null);
