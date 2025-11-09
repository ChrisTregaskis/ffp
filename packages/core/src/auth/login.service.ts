import { CognitoService } from '../lib/cognito.js';

import type { LoginInput } from '../schemas/auth.schema.js';

/**
 * Response for successful login
 */
export interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Response when user must change temporary password
 */
export interface LoginChallengeResponse {
  challengeName: 'NEW_PASSWORD_REQUIRED';
  session: string;
  email: string;
  message: string;
}

/**
 * Login result can be either successful authentication or a password challenge
 */
export type LoginResult = LoginResponse | LoginChallengeResponse;

/**
 * Login service
 *
 * Authenticates a user via Cognito using email and password.
 * Handles two scenarios:
 * 1. Successful login - Returns JWT tokens
 * 2. Temporary password - Returns challenge requiring password change
 *
 * This is a public endpoint (no JWT required).
 *
 * @param input - Login credentials (email, password)
 * @returns Login result with tokens or challenge
 * @throws {UnauthorisedError} If credentials are invalid
 * @throws {Error} If Cognito operation fails
 *
 */
export async function loginService(input: LoginInput): Promise<LoginResult> {
  const result = await CognitoService.login({
    email: input.email,
    password: input.password,
  });

  // Handle temporary password challenge
  if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    if (!result.Session) {
      throw new Error('Challenge session missing from Cognito response');
    }

    return {
      challengeName: 'NEW_PASSWORD_REQUIRED',
      session: result.Session,
      email: input.email,
      message:
        'Temporary password must be changed. Please call /auth/complete-new-password with session, email, and new password.',
    };
  }

  // Successful authentication
  if (!result.AuthenticationResult) {
    throw new Error('Authentication failed - no result returned');
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
  };
}
