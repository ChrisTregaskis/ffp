/**
 * Cognito Service Wrapper
 *
 * Provides a typed, simplified interface to AWS Cognito operations.
 * Centralises Cognito interactions to avoid direct SDK usage throughout the codebase.
 *
 * All methods throw errors that should be caught by the Lambda error handler.
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  InitiateAuthCommand,
  type AdminCreateUserCommandOutput,
  type InitiateAuthCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';

import { COGNITO_CUSTOM_ATTRIBUTES } from './constants.js';
import { UnauthorisedError } from './errors.js';

/**
 * Cognito region
 * Defaults to eu-west-2 (London) for GDPR compliance if COGNITO_REGION not set
 */
const COGNITO_REGION = process.env.COGNITO_REGION ?? 'eu-west-2';

/**
 * Cognito client instance
 */
const cognito = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

/**
 * Validates required environment variables for Cognito operations
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = (): void => {
  const requiredVars = ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Parameters for inviting a new user
 */
export interface InviteUserParams {
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  customerId: string;
  role: string;
}

/**
 * Parameters for creating a user with temporary password
 */
export interface CreateUserParams {
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  customerId: string | null;
  role: string;
  temporaryPassword?: string;
}

/**
 * Parameters for user login
 */
export interface LoginParams {
  email: string;
  password: string;
}

/**
 * Cognito Service
 *
 * Wrapper class for AWS Cognito Identity Provider operations.
 * All methods are static as there is no instance state to maintain.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CognitoService {
  /**
   * Invite a new user to the platform
   *
   * Creates a Cognito user with FORCE_CHANGE_PASSWORD status and sends
   * an email invitation with a temporary password.
   *
   * The user must change their password on first login.
   *
   * @param params - User invitation parameters
   * @returns Cognito admin create user response
   * @throws {Error} If Cognito operation fails
   *
   * @example
   * ```typescript
   * const response = await CognitoService.inviteUser({
   *   email: 'user@example.com',
   *   firstName: 'John',
   *   lastName: 'Smith',
   *   tenantId: 'tenant-123',
   *   customerId: 'customer-456',
   *   role: 'practitioner'
   * });
   * ```
   */
  static async inviteUser(params: InviteUserParams): Promise<AdminCreateUserCommandOutput> {
    validateEnvironment();
    const userPoolId = process.env.COGNITO_USER_POOL_ID; // Guaranteed by validateEnvironment()

    return await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: params.email,
        UserAttributes: [
          { Name: 'email', Value: params.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: params.firstName },
          { Name: 'family_name', Value: params.lastName },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID, Value: params.tenantId },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID, Value: params.customerId },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.ROLE, Value: params.role },
        ],
        DesiredDeliveryMediums: ['EMAIL'],
      })
    );
  }

  /**
   * Create a new user with optional temporary password
   *
   * Similar to inviteUser() but allows specifying a temporary password
   * instead of having Cognito generate one.
   *
   * Useful for:
   * - Automated testing
   * - Custom onboarding flows
   * - Migrating users from another system
   *
   * @param params - User creation parameters
   * @returns Cognito admin create user response
   * @throws {Error} If Cognito operation fails
   *
   * @example
   * ```typescript
   * const response = await CognitoService.createUser({
   *   email: 'user@example.com',
   *   firstName: 'Jane',
   *   lastName: 'Doe',
   *   tenantId: 'tenant-123',
   *   customerId: null, // Super admin has no customer
   *   role: 'super_admin',
   *   temporaryPassword: 'TempPass123!'
   * });
   * ```
   */
  static async createUser(params: CreateUserParams): Promise<AdminCreateUserCommandOutput> {
    validateEnvironment();
    const userPoolId = process.env.COGNITO_USER_POOL_ID; // Guaranteed by validateEnvironment()

    const userAttributes = [
      { Name: 'email', Value: params.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: params.firstName },
      { Name: 'family_name', Value: params.lastName },
      { Name: COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID, Value: params.tenantId },
      { Name: COGNITO_CUSTOM_ATTRIBUTES.ROLE, Value: params.role },
    ];

    // Only add customerId if it's not null (system admins don't have a customer)
    if (params.customerId !== null) {
      userAttributes.push({
        Name: COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID,
        Value: params.customerId,
      });
    }

    const command = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: params.email,
      UserAttributes: userAttributes,
      DesiredDeliveryMediums: ['EMAIL'],
      ...(params.temporaryPassword && {
        TemporaryPassword: params.temporaryPassword,
      }),
    });

    return await cognito.send(command);
  }

  /**
   * Delete a user from Cognito
   *
   * Used for rollback scenarios when user creation fails in downstream systems
   * (e.g., database insert fails after Cognito user is created).
   *
   * !IMPORTANT: This is a destructive operation and cannot be undone.
   * Use with caution and only for rollback scenarios.
   *
   * @param username - The username (email) of the user to delete
   * @throws {Error} If Cognito operation fails
   *
   * @example
   * ```typescript
   * try {
   *   // Create Cognito user
   *   const cognitoUser = await CognitoService.createUser(params);
   *
   *   // Attempt database insert
   *   await db.insert(users).values(userData);
   * } catch (dbError) {
   *   // Rollback: Delete Cognito user if database fails
   *   await CognitoService.deleteUser(cognitoUser.User!.Username!);
   *   throw dbError;
   * }
   * ```
   */
  static async deleteUser(username: string): Promise<void> {
    validateEnvironment();
    const userPoolId = process.env.COGNITO_USER_POOL_ID; // Guaranteed by validateEnvironment()

    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })
    );
  }

  /**
   * Authenticate a user with email and password
   *
   * Performs USER_PASSWORD_AUTH flow to obtain JWT tokens.
   *
   * Returns:
   * - AccessToken: Short-lived token for API requests (1 hour)
   * - IdToken: Contains user claims (tenantId, role, etc.)
   * - RefreshToken: Long-lived token for obtaining new access tokens
   *
   * @param params - Login credentials
   * @returns Cognito authentication response with tokens
   * @throws {UnauthorisedError} If credentials are invalid
   * @throws {Error} If Cognito operation fails
   *
   * @example
   * ```typescript
   * try {
   *   const response = await CognitoService.login({
   *     email: 'user@example.com',
   *     password: 'SecurePass123!'
   *   });
   *   const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
   * } catch (error) {
   *   if (error instanceof UnauthorisedError) {
   *     // Invalid credentials
   *   }
   * }
   * ```
   */
  static async login(params: LoginParams): Promise<InitiateAuthCommandOutput> {
    validateEnvironment();
    const clientId = process.env.COGNITO_CLIENT_ID; // Guaranteed by validateEnvironment()

    try {
      return await cognito.send(
        new InitiateAuthCommand({
          ClientId: clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: params.email,
            PASSWORD: params.password,
          },
        })
      );
    } catch (error) {
      // Convert Cognito errors to our error types
      if (error instanceof Error) {
        // NotAuthorizedException, UserNotFoundException, InvalidPasswordException
        if (
          error.name === 'NotAuthorizedException' ||
          error.name === 'UserNotFoundException' ||
          error.name === 'InvalidPasswordException'
        ) {
          throw new UnauthorisedError('Invalid email or password');
        }
      }
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   *
   * Uses a refresh token to obtain new access and ID tokens without
   * requiring the user to re-enter credentials.
   *
   * Access tokens expire after 1 hour, so this endpoint should be called
   * when the frontend detects an expired token.
   *
   * @param refreshToken - The refresh token from a previous login
   * @returns Cognito authentication response with new tokens
   * @throws {UnauthorisedError} If refresh token is invalid or expired
   * @throws {Error} If Cognito operation fails
   *
   * @example
   * ```typescript
   * try {
   *   const response = await CognitoService.refreshToken(storedRefreshToken);
   *   const { AccessToken, IdToken } = response.AuthenticationResult;
   *   // Note: Refresh token is NOT returned in refresh response
   * } catch (error) {
   *   if (error instanceof UnauthorisedError) {
   *     // Refresh token expired, user must login again
   *   }
   * }
   * ```
   */
  static async refreshToken(refreshToken: string): Promise<InitiateAuthCommandOutput> {
    validateEnvironment();
    const clientId = process.env.COGNITO_CLIENT_ID; // Guaranteed by validateEnvironment()

    try {
      return await cognito.send(
        new InitiateAuthCommand({
          ClientId: clientId,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        })
      );
    } catch (error) {
      // Convert Cognito errors to our error types
      if (error instanceof Error) {
        // NotAuthorizedException means the refresh token is invalid/expired
        if (error.name === 'NotAuthorizedException') {
          throw new UnauthorisedError('Refresh token is invalid or expired');
        }
      }
      throw error;
    }
  }
}
