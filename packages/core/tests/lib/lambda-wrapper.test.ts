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

import { type APIGatewayProxyEventV2WithJWT } from '../../src/lib/context';
import { UnauthorisedError, ValidationError, NotFoundError } from '../../src/lib/errors';
import { withErrorHandling } from '../../src/lib/lambda-wrapper';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

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

// Helper to create a minimal valid API Gateway V2 event for testing
// Note: Returns a base v2 event without JWT authorizer (for unauthenticated tests)
function createMockEvent(
  overrides?: Partial<APIGatewayProxyEventV2WithJWT>
): APIGatewayProxyEventV2WithJWT {
  const defaultEvent = {
    version: '2.0',
    routeKey: 'ANY /{proxy+}',
    rawPath: '/',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      requestId: 'test-request-id',
      routeKey: 'ANY /{proxy+}',
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      http: {
        method: 'GET',
        path: '/',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
    },
    isBase64Encoded: false,
  };

  // Cast to allow tests without JWT (will throw UnauthorizedError when context extraction fails)
  return { ...defaultEvent, ...overrides } as APIGatewayProxyEventV2WithJWT;
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

  describe('structured logging integration', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    // Helper to create an authenticated event with JWT (V2)
    function createAuthenticatedEvent(overrides?: {
      path?: string;
      httpMethod?: string;
    }): APIGatewayProxyEventV2WithJWT {
      return {
        version: '2.0',
        routeKey: 'ANY /{proxy+}',
        rawPath: overrides?.path ?? '/',
        rawQueryString: '',
        headers: {},
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          domainName: 'test.execute-api.eu-west-2.amazonaws.com',
          domainPrefix: 'test',
          requestId: 'test-request-id',
          routeKey: 'ANY /{proxy+}',
          stage: '$default',
          time: new Date().toISOString(),
          timeEpoch: Date.now(),
          http: {
            method: overrides?.httpMethod ?? 'GET',
            path: overrides?.path ?? '/',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent',
          },
          authorizer: {
            jwt: {
              claims: {
                sub: 'user-123',
                email: 'test@example.com',
                'custom:role': 'customer_owner',
                'custom:tenantId': 'tenant-456',
                'custom:customerId': 'customer-789',
              },
            },
          },
        },
        isBase64Encoded: false,
      };
    }

    it('should use structured logging for authenticated requests', async () => {
      const handler = withErrorHandling(() => {
        return Promise.resolve({ success: true });
      });

      const event = createAuthenticatedEvent({ path: '/users', httpMethod: 'GET' });
      await handler(event);

      // Should have 2 log entries: request started, request completed
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const startLog = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as {
        level: string;
        message: string;
        context?: { path: string; method: string };
      };
      const endLog = JSON.parse(consoleLogSpy.mock.calls[1][0] as string) as {
        level: string;
        message: string;
        context?: { statusCode: number };
      };

      expect(startLog.level).toBe('INFO');
      expect(startLog.message).toBe('Request started');
      expect(startLog.context?.path).toBe('/users');
      expect(startLog.context?.method).toBe('GET');

      expect(endLog.level).toBe('INFO');
      expect(endLog.message).toBe('Request completed');
      expect(endLog.context?.statusCode).toBe(200);
    });

    it('should log errors with structured logging for authenticated requests', async () => {
      const handler = withErrorHandling(() => {
        throw new ValidationError('Invalid data');
      });

      const event = createAuthenticatedEvent();
      await handler(event);

      // Should have 2 log entries: request started, request failed
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const errorLog = JSON.parse(consoleLogSpy.mock.calls[1][0] as string) as {
        level: string;
        message: string;
        context?: {
          error: string;
          errorType: string;
        };
      };

      expect(errorLog.level).toBe('ERROR');
      expect(errorLog.message).toBe('Request failed');
      expect(errorLog.context?.error).toBe('Invalid data');
      expect(errorLog.context?.errorType).toBe('VALIDATION_ERROR');
    });

    it('should include actor information in structured logs', async () => {
      const handler = withErrorHandling(() => {
        return Promise.resolve({ success: true });
      });

      const event = createAuthenticatedEvent();
      await handler(event);

      const startLog = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as {
        actor: string;
        tenantId: string;
      };

      expect(startLog.actor).toBe('test@example.com (customer_owner)');
      expect(startLog.tenantId).toBe('tenant-456');
    });

    it('should fall back to console.error for unauthenticated requests', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test error');
      });

      const unauthenticatedEvent = createMockEvent();
      await handler(unauthenticatedEvent);

      // Should not use structured logging (no JWT)
      expect(consoleLogSpy).not.toHaveBeenCalled();
      // Should use console.error instead (already mocked in outer beforeEach)
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
