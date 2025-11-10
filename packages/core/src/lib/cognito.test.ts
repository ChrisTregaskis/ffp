/**
 * Unit tests for Cognito Service wrapper
 *
 * Tests the CognitoService class to ensure:
 * - Methods call Cognito SDK with correct parameters
 * - Environment variables are validated
 * - Errors are properly converted to our error types
 * - User attributes are set correctly
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { CognitoService } from './cognito';
import { COGNITO_CUSTOM_ATTRIBUTES } from './constants';
import { UnauthorisedError } from './errors';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const mockSend = vi.fn();

  return {
    CognitoIdentityProviderClient: vi.fn(() => ({
      send: mockSend,
    })),
    AdminCreateUserCommand: vi.fn((params) => ({ params })),
    InitiateAuthCommand: vi.fn((params) => ({ params })),
  };
});

// Get mock references
const mockSend = vi.mocked(new CognitoIdentityProviderClient({}).send) as ReturnType<typeof vi.fn>;

describe('CognitoService', () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Set up test environment variables
    process.env = {
      ...originalEnv,
      COGNITO_USER_POOL_ID: 'test-pool-id',
      COGNITO_CLIENT_ID: 'test-client-id',
    };
  });

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  describe('inviteUser', () => {
    it('should create user with correct attributes', async () => {
      mockSend.mockResolvedValueOnce({
        User: { Username: 'user@example.com' },
      });

      const params = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Smith',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_user',
      };

      await CognitoService.inviteUser(params);

      expect(AdminCreateUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'test-pool-id',
        Username: 'user@example.com',
        UserAttributes: [
          { Name: 'email', Value: 'user@example.com' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: 'John' },
          { Name: 'family_name', Value: 'Smith' },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID, Value: 'tenant-123' },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID, Value: 'customer-456' },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.ROLE, Value: 'customer_user' },
        ],
        DesiredDeliveryMediums: ['EMAIL'],
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error if COGNITO_USER_POOL_ID is not set', async () => {
      delete process.env.COGNITO_USER_POOL_ID;

      const params = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Smith',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_user',
      };

      await expect(CognitoService.inviteUser(params)).rejects.toThrow(
        'Missing required environment variables: COGNITO_USER_POOL_ID'
      );
    });

    it('should return Cognito response', async () => {
      const mockResponse = {
        User: {
          Username: 'user@example.com',
          Attributes: [],
        },
      };
      mockSend.mockResolvedValueOnce(mockResponse);

      const params = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Smith',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_user',
      };

      const result = await CognitoService.inviteUser(params);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('createUser', () => {
    it('should create user with customerId when provided', async () => {
      mockSend.mockResolvedValueOnce({
        User: { Username: 'user@example.com' },
      });

      const params = {
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_owner',
      };

      await CognitoService.createUser(params);

      expect(AdminCreateUserCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          UserAttributes: expect.arrayContaining([
            { Name: COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID, Value: 'customer-456' },
          ]),
        })
      );
    });

    it('should create user without customerId when null (system admin)', async () => {
      mockSend.mockResolvedValueOnce({
        User: { Username: 'admin@example.com' },
      });

      const params = {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        tenantId: 'platform',
        customerId: null,
        role: 'system_admin',
      };

      await CognitoService.createUser(params);

      const commandCall = vi.mocked(AdminCreateUserCommand).mock.calls[0][0];
      const hasCustomerId = commandCall.UserAttributes?.some(
        (attr) => attr.Name === COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID
      );

      expect(hasCustomerId).toBe(false);
    });

    it('should include temporary password when provided', async () => {
      mockSend.mockResolvedValueOnce({
        User: { Username: 'user@example.com' },
      });

      const params = {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_user',
        temporaryPassword: 'TempPass123!',
      };

      await CognitoService.createUser(params);

      expect(AdminCreateUserCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          TemporaryPassword: 'TempPass123!',
        })
      );
    });

    it('should not include temporary password when not provided', async () => {
      mockSend.mockResolvedValueOnce({
        User: { Username: 'user@example.com' },
      });

      const params = {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_user',
      };

      await CognitoService.createUser(params);

      const commandCall = vi.mocked(AdminCreateUserCommand).mock.calls[0][0];
      expect(commandCall.TemporaryPassword).toBeUndefined();
    });

    it('should throw error if COGNITO_USER_POOL_ID is not set', async () => {
      delete process.env.COGNITO_USER_POOL_ID;

      const params = {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
        role: 'customer_user',
      };

      await expect(CognitoService.createUser(params)).rejects.toThrow(
        'Missing required environment variables: COGNITO_USER_POOL_ID'
      );
    });
  });

  describe('login', () => {
    it('should initiate USER_PASSWORD_AUTH flow', async () => {
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
        },
      });

      const params = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };

      await CognitoService.login(params);

      expect(InitiateAuthCommand).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: 'user@example.com',
          PASSWORD: 'SecurePass123!',
        },
      });
    });

    it('should return authentication result', async () => {
      const mockAuthResult = {
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
        },
      };
      mockSend.mockResolvedValueOnce(mockAuthResult);

      const result = await CognitoService.login({
        email: 'user@example.com',
        password: 'SecurePass123!',
      });

      expect(result).toEqual(mockAuthResult);
    });

    it('should throw UnauthorisedError for NotAuthorizedException', async () => {
      const error = new Error('Incorrect username or password');
      error.name = 'NotAuthorizedException';
      mockSend.mockRejectedValueOnce(error);
      mockSend.mockRejectedValueOnce(error);

      await expect(
        CognitoService.login({
          email: 'user@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow(UnauthorisedError);

      await expect(
        CognitoService.login({
          email: 'user@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorisedError for UserNotFoundException', async () => {
      const error = new Error('User does not exist');
      error.name = 'UserNotFoundException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        CognitoService.login({
          email: 'nonexistent@example.com',
          password: 'password',
        })
      ).rejects.toThrow(UnauthorisedError);
    });

    it('should throw UnauthorisedError for InvalidPasswordException', async () => {
      const error = new Error('Invalid password');
      error.name = 'InvalidPasswordException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        CognitoService.login({
          email: 'user@example.com',
          password: 'invalid',
        })
      ).rejects.toThrow(UnauthorisedError);
    });

    it('should rethrow non-auth errors', async () => {
      const error = new Error('Service unavailable');
      error.name = 'ServiceUnavailableException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        CognitoService.login({
          email: 'user@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Service unavailable');
    });

    it('should throw error if COGNITO_CLIENT_ID is not set', async () => {
      delete process.env.COGNITO_CLIENT_ID;

      await expect(
        CognitoService.login({
          email: 'user@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Missing required environment variables: COGNITO_CLIENT_ID');
    });
  });

  describe('refreshToken', () => {
    it('should initiate REFRESH_TOKEN_AUTH flow', async () => {
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
        },
      });

      await CognitoService.refreshToken('refresh-token-value');

      expect(InitiateAuthCommand).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: 'refresh-token-value',
        },
      });
    });

    it('should return new authentication tokens', async () => {
      const mockAuthResult = {
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
        },
      };
      mockSend.mockResolvedValueOnce(mockAuthResult);

      const result = await CognitoService.refreshToken('refresh-token-value');

      expect(result).toEqual(mockAuthResult);
    });

    it('should throw UnauthorisedError for expired refresh token', async () => {
      const error = new Error('Refresh token expired');
      error.name = 'NotAuthorizedException';
      mockSend.mockRejectedValueOnce(error);
      mockSend.mockRejectedValueOnce(error);

      await expect(CognitoService.refreshToken('expired-token')).rejects.toThrow(UnauthorisedError);

      await expect(CognitoService.refreshToken('expired-token')).rejects.toThrow(
        'Refresh token is invalid or expired'
      );
    });

    it('should rethrow non-auth errors', async () => {
      const error = new Error('Service unavailable');
      error.name = 'ServiceUnavailableException';
      mockSend.mockRejectedValueOnce(error);

      await expect(CognitoService.refreshToken('refresh-token')).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should throw error if COGNITO_CLIENT_ID is not set', async () => {
      delete process.env.COGNITO_CLIENT_ID;

      await expect(CognitoService.refreshToken('refresh-token')).rejects.toThrow(
        'Missing required environment variables: COGNITO_CLIENT_ID'
      );
    });
  });
});
