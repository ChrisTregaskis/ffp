/**
 * Cognito Service Wrapper
 *
 * Provides a typed, simplified interface to AWS Cognito operations.
 * Centralises Cognito interactions to avoid direct SDK usage throughout the codebase.
 *
 * Note: Cognito custom attributes are immutable — they remain custom:tenantId and
 * custom:customerId internally. The code uses organisationId/locationId naming,
 * but maps to the original Cognito attribute names via COGNITO_CUSTOM_ATTRIBUTES.
 *
 * All methods throw errors that should be caught by the Lambda error handler.
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  type AdminCreateUserCommandOutput,
  type InitiateAuthCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';

import { COGNITO_CUSTOM_ATTRIBUTES } from './constants.js';
import { UnauthorisedError, ValidationError } from './errors.js';

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
  organisationId: string;
  locationId: string;
  role: string;
}

/**
 * Parameters for creating a user with temporary password
 */
export interface CreateUserParams {
  email: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  locationId: string | null;
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
 * Parameters for completing new password challenge
 */
export interface CompleteNewPasswordParams {
  session: string;
  email: string;
  newPassword: string;
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
          { Name: COGNITO_CUSTOM_ATTRIBUTES.ORGANISATION_ID, Value: params.organisationId },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.LOCATION_ID, Value: params.locationId },
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
   */
  static async createUser(params: CreateUserParams): Promise<AdminCreateUserCommandOutput> {
    validateEnvironment();
    const userPoolId = process.env.COGNITO_USER_POOL_ID; // Guaranteed by validateEnvironment()

    const userAttributes = [
      { Name: 'email', Value: params.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: params.firstName },
      { Name: 'family_name', Value: params.lastName },
      { Name: COGNITO_CUSTOM_ATTRIBUTES.ORGANISATION_ID, Value: params.organisationId },
      { Name: COGNITO_CUSTOM_ATTRIBUTES.ROLE, Value: params.role },
    ];

    // Only add locationId if it's not null (system admins don't have a location)
    if (params.locationId !== null) {
      userAttributes.push({
        Name: COGNITO_CUSTOM_ATTRIBUTES.LOCATION_ID,
        Value: params.locationId,
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
      if (error instanceof Error) {
        if (error.name === 'NotAuthorizedException') {
          throw new UnauthorisedError('Refresh token is invalid or expired');
        }
      }

      throw error;
    }
  }

  /**
   * Complete new password challenge
   *
   * Called after a user with a temporary password logs in and receives
   * a NEW_PASSWORD_REQUIRED challenge.
   */
  static async completeNewPassword(
    params: CompleteNewPasswordParams
  ): Promise<InitiateAuthCommandOutput> {
    validateEnvironment();
    const clientId = process.env.COGNITO_CLIENT_ID;

    try {
      return await cognito.send(
        new RespondToAuthChallengeCommand({
          ClientId: clientId,
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          Session: params.session,
          ChallengeResponses: {
            USERNAME: params.email,
            NEW_PASSWORD: params.newPassword,
          },
        })
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAuthorizedException') {
          throw new UnauthorisedError('Session expired or invalid');
        }

        if (error.name === 'InvalidPasswordException') {
          throw new ValidationError('Password does not meet requirements');
        }
      }

      throw error;
    }
  }
}
