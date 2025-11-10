import { CognitoService } from '../lib/cognito.js';

import type { RefreshTokenInput } from '../schemas/auth.schema.js';

/**
 * Response for successful token refresh
 */
export interface RefreshTokenResult {
  accessToken: string;
  idToken: string;
  refreshToken: string; // Same token passed in (30-day validity)
  expiresIn: number;
}

/**
 * Refresh token service
 *
 * Obtains new access and ID tokens using a valid refresh token.
 * The refresh token itself does not rotate - it remains valid for 30 days
 * and should be stored by the client for future refresh requests.
 *
 * This is a public endpoint (no JWT required).
 *
 * @param input - Refresh token from previous login
 * @returns New tokens with same refresh token
 * @throws {UnauthorisedError} If refresh token is invalid or expired
 * @throws {Error} If Cognito operation fails
 */
export async function refreshTokenService(input: RefreshTokenInput): Promise<RefreshTokenResult> {
  const result = await CognitoService.refreshToken(input.refreshToken);

  if (!result.AuthenticationResult) {
    throw new Error('Token refresh failed - no authentication result');
  }

  const { AccessToken, IdToken, ExpiresIn } = result.AuthenticationResult;

  if (!AccessToken || !IdToken || !ExpiresIn) {
    throw new Error('Incomplete authentication result from Cognito');
  }

  return {
    accessToken: AccessToken,
    idToken: IdToken,
    refreshToken: input.refreshToken, // Return original token
    expiresIn: ExpiresIn,
  };
}
