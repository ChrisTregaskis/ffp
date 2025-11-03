/**
 * Unit tests for Lambda error handling wrapper
 *
 * Tests the withErrorHandling middleware to ensure:
 * - Success responses are formatted correctly (200)
 * - BaseError instances are converted to proper HTTP responses
 * - ZodError instances are converted to validation errors (400)
 * - Unexpected errors are converted to 500 responses
 * - Sensitive data is sanitised in logs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import { UnauthorisedError, ValidationError, NotFoundError } from './errors';
import { withErrorHandling } from './lambda-wrapper';

import type { APIGatewayProxyEvent, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Type for the error log structure
interface ErrorLogData {
  error: string;
  stack?: string;
  requestId?: string;
  event: unknown;
}

// Helper to assert result is an object (not string) with required body
function assertIsObject(
  result: unknown
): asserts result is Required<APIGatewayProxyStructuredResultV2> & {
  body: string;
  headers: Record<string, string>;
} {
  if (typeof result === 'string') {
    throw new Error('Expected object result, got string');
  }
  if (typeof result !== 'object' || result === null) {
    throw new Error('Expected object result');
  }
  if (!('body' in result) || typeof result.body !== 'string') {
    throw new Error('Expected result to have string body');
  }
}

// Helper to create a minimal valid APIGatewayProxyEvent for testing
function createMockEvent(overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
  const defaultEvent: APIGatewayProxyEvent = {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      path: '/',
      stage: 'test',
      requestId: 'test-request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: '/',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
      },
      authorizer: null,
    },
    resource: '/',
  };

  return { ...defaultEvent, ...overrides };
}

describe('withErrorHandling', () => {
  // Suppress console.error for all tests to avoid cluttering test output
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console output in tests
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('success responses', () => {
    it('should return 200 with JSON body for successful handler', async () => {
      const handler = withErrorHandling(() => {
        return Promise.resolve({ message: 'Success', data: { id: 123 } });
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
      const body = JSON.parse(result.body) as {
        message: string;
        data: { id: number };
      };
      expect(body).toEqual({
        message: 'Success',
        data: { id: 123 },
      });
    });

    it('should handle null response', async () => {
      const handler = withErrorHandling(() => {
        return Promise.resolve(null);
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body) as null).toBeNull();
    });

    it('should handle array response', async () => {
      const handler = withErrorHandling(() => {
        return Promise.resolve([{ id: 1 }, { id: 2 }]);
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body) as { id: number }[];
      expect(body).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('BaseError handling', () => {
    it('should return correct status code for UnauthorisedError', async () => {
      const handler = withErrorHandling(() => {
        throw new UnauthorisedError('Invalid token');
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
      };
      expect(body).toEqual({
        error: 'UNAUTHORISED',
        message: 'Invalid token',
      });
    });

    it('should return correct status code for NotFoundError', async () => {
      const handler = withErrorHandling(() => {
        throw new NotFoundError('User', 'user-123');
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
      };
      expect(body).toEqual({
        error: 'NOT_FOUND',
        message: 'User with id user-123 not found',
      });
    });

    it('should include details when present in error', async () => {
      const handler = withErrorHandling(() => {
        throw new ValidationError('Validation failed', {
          email: 'Invalid format',
        });
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        details: { email: string };
      };
      expect(body).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { email: 'Invalid format' },
      });
    });

    it('should not include details field when not present', async () => {
      const handler = withErrorHandling(() => {
        throw new UnauthorisedError();
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        details?: unknown;
      };
      expect(body).toEqual({
        error: 'UNAUTHORISED',
        message: 'Authentication failed',
      });
      expect(body.details).toBeUndefined();
    });
  });

  describe('ZodError handling', () => {
    it('should convert ZodError to 400 validation error', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const handler = withErrorHandling(() => {
        schema.parse({ email: 'invalid', age: 15 });
        return Promise.resolve({});
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        details: unknown[];
      };
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Invalid request data');
      expect(body.details).toBeDefined();
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
    });

    it('should format Zod error details correctly', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email format'),
      });

      const handler = withErrorHandling(() => {
        schema.parse({ email: 'not-an-email' });
        return Promise.resolve({});
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);
      const body = JSON.parse(result.body) as {
        details: { path: string; message: string; code: string }[];
      };

      expect(body.details[0]).toMatchObject({
        path: 'email',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        code: expect.any(String),
      });
    });
  });

  describe('unexpected error handling', () => {
    it('should convert unexpected errors to 500', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Unexpected database error');
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
      };
      expect(body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    });

    it('should handle non-Error throws', async () => {
      const handler = withErrorHandling(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'String error';
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
      };
      expect(body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('error logging', () => {
    it('should log errors to console', async () => {
      const handler = withErrorHandling(() => {
        throw new UnauthorisedError('Test error');
      });

      await handler(createMockEvent());

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Lambda error:',
        expect.objectContaining({
          error: 'Test error',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          stack: expect.any(String),
        })
      );
    });

    it('should sanitise authorization headers in logs', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      const event = createMockEvent({
        headers: {
          authorization: 'Bearer secret-token',
          'Content-Type': 'application/json',
        },
      });

      await handler(event);

      const loggedData = consoleErrorSpy.mock.calls[0][1] as ErrorLogData;
      const loggedEvent = loggedData.event as {
        headers: Record<string, string>;
      };
      expect(loggedEvent.headers.authorization).toBe('[REDACTED]');
      expect(loggedEvent.headers['Content-Type']).toBe('application/json');
    });

    it('should sanitise password fields in request body', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      const event = createMockEvent({
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'secret-password',
        }),
      });

      await handler(event);

      const loggedData = consoleErrorSpy.mock.calls[0][1] as ErrorLogData;
      const loggedEvent = loggedData.event as { body: string };
      const loggedBody = JSON.parse(loggedEvent.body) as {
        email: string;
        password: string;
      };
      expect(loggedBody.password).toBe('[REDACTED]');
      expect(loggedBody.email).toBe('user@example.com');
    });

    it('should sanitise refresh tokens in request body', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      const event = createMockEvent({
        body: JSON.stringify({
          refreshToken: 'secret-refresh-token',
        }),
      });

      await handler(event);

      const loggedData = consoleErrorSpy.mock.calls[0][1] as ErrorLogData;
      const loggedEvent = loggedData.event as { body: string };
      const loggedBody = JSON.parse(loggedEvent.body) as {
        refreshToken: string;
      };
      expect(loggedBody.refreshToken).toBe('[REDACTED]');
    });

    it('should handle malformed JSON body gracefully', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      const event = createMockEvent({
        body: 'invalid json{',
      });

      await handler(event);

      const loggedData = consoleErrorSpy.mock.calls[0][1] as ErrorLogData;
      const loggedEvent = loggedData.event as { body: string };
      expect(loggedEvent.body).toBe('invalid json{');
    });
    it('should sanitise additional sensitive fields (accessToken, idToken, secret, apiKey)', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      const event = createMockEvent({
        body: JSON.stringify({
          email: 'user@example.com',
          accessToken: 'secret-access-token',
          idToken: 'secret-id-token',
          secret: 'my-secret-key',
          apiKey: 'my-api-key',
          publicData: 'visible-data',
        }),
      });

      await handler(event);

      const loggedData = consoleErrorSpy.mock.calls[0][1] as ErrorLogData;
      const loggedEvent = loggedData.event as { body: string };
      const loggedBody = JSON.parse(loggedEvent.body) as {
        email: string;
        accessToken: string;
        idToken: string;
        secret: string;
        apiKey: string;
        publicData: string;
      };

      // All sensitive fields should be redacted
      expect(loggedBody.accessToken).toBe('[REDACTED]');
      expect(loggedBody.idToken).toBe('[REDACTED]');
      expect(loggedBody.secret).toBe('[REDACTED]');
      expect(loggedBody.apiKey).toBe('[REDACTED]');

      // Non-sensitive fields should remain
      expect(loggedBody.email).toBe('user@example.com');
      expect(loggedBody.publicData).toBe('visible-data');
    });
  });

  describe('requestId inclusion', () => {
    it('should include requestId in BaseError responses', async () => {
      const handler = withErrorHandling(() => {
        throw new UnauthorisedError('Invalid token');
      });

      const event = createMockEvent();
      event.requestContext.requestId = 'test-request-id-123';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        requestId: string;
      };
      expect(body).toEqual({
        error: 'UNAUTHORISED',
        message: 'Invalid token',
        requestId: 'test-request-id-123',
      });
    });

    it('should include requestId in ZodError responses', async () => {
      const handler = withErrorHandling(() => {
        const schema = z.object({ email: z.string().email() });
        schema.parse({ email: 'invalid' });
        return Promise.resolve({ success: true });
      });

      const event = createMockEvent();
      event.requestContext.requestId = 'test-request-id-456';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        requestId: string;
        details: unknown[];
      };
      expect(body.requestId).toBe('test-request-id-456');
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    it('should include requestId in unexpected error responses', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Unexpected error');
      });

      const event = createMockEvent();
      event.requestContext.requestId = 'test-request-id-789';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        requestId: string;
      };
      expect(body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: 'test-request-id-789',
      });
    });

    it('should not include requestId when not present in requestContext', async () => {
      const handler = withErrorHandling(() => {
        throw new UnauthorisedError('Invalid token');
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      const body = JSON.parse(result.body) as {
        error: string;
        message: string;
        requestId?: string;
      };
      expect(body.requestId).toBeUndefined();
      expect(body).toEqual({
        error: 'UNAUTHORISED',
        message: 'Invalid token',
      });
    });
  });

  describe('response format', () => {
    it('should always include Content-Type header', async () => {
      const handler = withErrorHandling(() => {
        return Promise.resolve({ success: true });
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(result.headers).toHaveProperty('Content-Type');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should always return valid JSON body', async () => {
      const handler = withErrorHandling(() => {
        throw new UnauthorisedError();
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(() => JSON.parse(result.body) as unknown).not.toThrow();
    });
  });
});
