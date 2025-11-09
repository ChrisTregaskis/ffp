import { CognitoService } from '../lib/cognito.js';

import type { CompleteNewPasswordInput } from '../schemas/auth.schema.js';

/**
 * Response for successful password change
 */
export interface CompleteNewPasswordResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  message: string;
}

/**
 * Complete new password service
 *
 * Handles the NEW_PASSWORD_REQUIRED challenge from Cognito.
 * Called after a user with a temporary password logs in and receives
 * a session token.
 *
 * This completes the password change and returns JWT tokens for immediate use.
 *
 * This is a public endpoint (no JWT required) as the user is not yet authenticated.
 *
 * @param input - Challenge response (session, email, newPassword)
 * @returns Authentication tokens
 * @throws {UnauthorisedError} If session is expired or invalid
 * @throws {ValidationError} If password doesn't meet requirements
 * @throws {Error} If Cognito operation fails
 *
 */
export const completeNewPasswordService = async (
  input: CompleteNewPasswordInput
): Promise<CompleteNewPasswordResponse> => {
  const result = await CognitoService.completeNewPassword({
    session: input.session,
    email: input.email,
    newPassword: input.newPassword,
  });

  // Validate authentication result
  if (!result.AuthenticationResult) {
    throw new Error('Password change failed - no authentication result returned');
  }

  const { AccessToken, IdToken, RefreshToken, ExpiresIn } = result.AuthenticationResult;

  if (!AccessToken || !IdToken || !RefreshToken || !ExpiresIn) {
    throw new Error('Incomplete authentication result from Cognito');
  }

  return {
    accessToken: AccessToken,
    idToken: IdToken,
    refreshToken: RefreshToken,
    expiresIn: ExpiresIn,
    message: 'Password changed successfully. You are now logged in.',
  };
};
