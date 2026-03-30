import { Amplify } from 'aws-amplify';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';

/**
 * Initialise AWS Amplify with Cognito authentication configuration.
 *
 * This configuration connects the frontend to the Cognito User Pool.
 * The user pool ID and client ID are provided via environment variables.
 */
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    },
  },
});

/**
 * Re-export Amplify auth methods for use throughout the application.
 *
 * These methods provide the core authentication functionality:
 * - signIn: Authenticate a user with email/password
 * - signOut: End the current user session
 * - getCurrentUser: Retrieve the currently authenticated user
 * - fetchAuthSession: Get the current JWT tokens and session info
 * - resetPassword: Initiate a forgot password flow (sends verification code)
 * - confirmResetPassword: Complete password reset with verification code and new password
 *
 * Note: signUp is not included as FFP uses invite-only user creation (admin-only onboarding).
 */
export { signIn, signOut, getCurrentUser, fetchAuthSession, resetPassword, confirmResetPassword };
