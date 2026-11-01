/**
 * Unit tests for Lambda error handling wrapper
 *
 * Tests the withErrorHandling middleware to ensure:
 * - Success responses are formatted correctly (200)
 * - BaseError instances are converted to proper HTTP responses
 * - ZodError instances are converted to validation errors (400)
 * - Unexpected errors are converted to 500 responses
 * - Failure logs describe the request by its shape, never its values
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import { type APIGatewayProxyEventV2WithJWT } from '../../src/lib/context';
import { UnauthorisedError, ValidationError, NotFoundError } from '../../src/lib/errors';
import { withErrorHandling } from '../../src/lib/lambda-wrapper';

import { createMockEvent } from './api-gateway-event.fixture';
import {
  LEAKABLE,
  drizzleConnectionError,
  drizzleDriverError,
  expectNothingLeakable,
} from './database-error.fixture';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Type for the error log structure
interface ErrorLogData {
  error: string;
  stack?: string;
  requestId?: string;
  request: unknown;
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
        email: z.email(),
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
        email: z.email(),
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

  describe('database driver error handling', () => {
    it('should map a unique violation to 409', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23505', constraint: 'questions_slug_unique' });
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body) as { error: string; message: string };
      expect(body.error).toBe('CONFLICT');
    });

    it('should not disclose the constraint name or the query to the caller', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23505', constraint: 'users_email_unique' });
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.body).not.toContain('users_email_unique');
      expect(result.body).not.toContain('insert into');
      expect(result.body).not.toContain(LEAKABLE.param);
    });

    it('should log a unique violation by SQLSTATE and constraint, not the query or its parameters', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23505', constraint: 'users_email_unique' });
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      await handler(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Lambda error:',
        expect.objectContaining({
          error: 'Database driver error',
          database: { sqlState: '23505', constraint: 'users_email_unique' },
        })
      );
      const logged = JSON.stringify(consoleErrorSpy.mock.calls);
      expect(logged).not.toContain('insert into');
      expect(logged).not.toContain(LEAKABLE.param);
    });

    it('should log a foreign-key violation without its query, parameters, detail or stack', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23503', constraint: 'questions_video_id_fkey' });
      });

      await handler(createMockEvent());

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Lambda error:',
        expect.objectContaining({
          error: 'Database driver error',
          errorClass: 'DrizzleQueryError',
          database: { sqlState: '23503', constraint: 'questions_video_id_fkey' },
          stack: undefined,
        })
      );
      expectNothingLeakable(JSON.stringify(consoleErrorSpy.mock.calls));
    });

    it('should log a query whose connection reset by the cause, without the query or its parameters', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleConnectionError('ECONNRESET');
      });

      const result = await handler(createMockEvent());
      assertIsObject(result);

      expect(result.statusCode).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Lambda error:',
        expect.objectContaining({
          error: 'Database query failed',
          errorClass: 'DrizzleQueryError',
          cause: { errorClass: 'Error', code: 'ECONNRESET' },
          stack: undefined,
        })
      );
      expectNothingLeakable(JSON.stringify(consoleErrorSpy.mock.calls));
    });

    it('should leave another SQLSTATE on the 500 path with a sanitised message', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23503', constraint: 'questions_video_id_fkey' });
      });

      const event = createMockEvent();
      event.requestContext.requestId = '';

      const result = await handler(event);
      assertIsObject(result);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body) as { error: string; message: string };
      expect(body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
      expect(result.body).not.toContain(LEAKABLE.param);
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

    const loggedRequest = (): unknown => (consoleErrorSpy.mock.calls[0][1] as ErrorLogData).request;

    it('logs the method, the path and the body and query keys, but none of their values', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });
      const event = createMockEvent({
        rawPath: '/auth/login',
        rawQueryString: 'email=sentinel.query%40example.com',
        queryStringParameters: { email: 'sentinel.query@example.com' },
        body: JSON.stringify({
          email: 'sentinel.member@example.com',
          password: 'sentinel-password',
        }),
      });
      event.requestContext.http.method = 'POST';

      await handler(event);

      expect(loggedRequest()).toEqual({
        method: 'POST',
        path: '/auth/login',
        queryKeys: ['email'],
        body: { type: 'object', keys: ['email', 'password'] },
      });
      expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('sentinel');
    });

    it('logs no header, so a bearer token never reaches the log', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      await handler(
        createMockEvent({
          headers: { authorization: 'Bearer sentinel-token', cookie: 'session=sentinel-cookie' },
        })
      );

      expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('sentinel');
    });

    it('logs a body that is not JSON by its length, not its text', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Test');
      });

      await handler(createMockEvent({ body: 'sentinel{' }));

      expect(loggedRequest()).toEqual({
        method: 'GET',
        path: '/',
        queryKeys: [],
        body: { type: 'unparseable', length: 9 },
      });
      expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('sentinel');
    });

    it("withholds a JSON syntax error's message, which quotes the body it failed on", async () => {
      const body = '{"email": "sentinel.member@example.com", "password": sentinel}';
      const handler = withErrorHandling(() => Promise.resolve(JSON.parse(body) as unknown));

      await handler(createMockEvent({ body }));

      expect(consoleErrorSpy.mock.calls[0][1]).toMatchObject({ errorClass: 'SyntaxError' });
      expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('sentinel');
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
        const schema = z.object({ email: z.email() });
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
                'custom:tenantId': 'org-456',
                'custom:customerId': 'location-789',
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

    const loggedEntries = (): {
      message: string;
      requestId: string;
      context?: Record<string, unknown>;
    }[] =>
      consoleLogSpy.mock.calls.map(
        (call) =>
          JSON.parse(call[0] as string) as {
            message: string;
            requestId: string;
            context?: Record<string, unknown>;
          }
      );

    const failureContext = (): Record<string, unknown> | undefined =>
      loggedEntries().find((entry) => entry.message === 'Request failed')?.context;

    it("logs no email, name or answer from a failed request's body or query, only their keys", async () => {
      const handler = withErrorHandling(() => {
        throw new ValidationError('Some answers need your attention');
      });
      const questionId = '6f1c2a90-4b7e-4c55-9d1a-3e2f8b7c6d5e';

      await handler({
        ...createAuthenticatedEvent({ path: '/admin/users', httpMethod: 'POST' }),
        rawQueryString: 'search=Sentinelname',
        queryStringParameters: { search: 'Sentinelname' },
        headers: { authorization: 'Bearer sentinel-bearer-token' },
        body: JSON.stringify({
          email: 'sentinel.member@example.com',
          firstName: 'Sentinelname',
          answers: { [questionId]: { questionId, answerValue: 'sentinel free-text answer' } },
        }),
      });

      const failure = loggedEntries().find((entry) => entry.message === 'Request failed');
      expect(failure).toMatchObject({
        requestId: 'test-request-id',
        context: {
          error: 'Some answers need your attention',
          errorType: 'VALIDATION_ERROR',
          request: {
            method: 'POST',
            path: '/admin/users',
            queryKeys: ['search'],
            body: { type: 'object', keys: ['email', 'firstName', 'answers'] },
          },
        },
      });
      expect(JSON.stringify(consoleLogSpy.mock.calls).toLowerCase()).not.toContain('sentinel');
    });

    it('should log a unique violation on an authenticated request without the query or its parameters', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23505', constraint: 'users_email_unique' });
      });

      await handler(createAuthenticatedEvent());

      expect(failureContext()).toMatchObject({
        error: 'Database driver error',
        database: { sqlState: '23505', constraint: 'users_email_unique' },
      });
      const logged = JSON.stringify(consoleLogSpy.mock.calls);
      expect(logged).not.toContain('insert into');
      expect(logged).not.toContain(LEAKABLE.param);
    });

    it('should log a foreign-key violation on an authenticated request without its query, parameters, detail or stack', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleDriverError({ code: '23503', constraint: 'questions_video_id_fkey' });
      });

      await handler(createAuthenticatedEvent());

      const context = failureContext();
      expect(context).toMatchObject({
        error: 'Database driver error',
        errorClass: 'DrizzleQueryError',
        database: { sqlState: '23503', constraint: 'questions_video_id_fkey' },
      });
      expect(context).not.toHaveProperty('stack');
      expectNothingLeakable(JSON.stringify(consoleLogSpy.mock.calls));
    });

    it('should log a query whose connection dropped on an authenticated request without the query or its parameters', async () => {
      const handler = withErrorHandling(() => {
        throw drizzleConnectionError();
      });

      await handler(createAuthenticatedEvent());

      const context = failureContext();
      expect(context).toMatchObject({
        error: 'Database query failed',
        errorClass: 'DrizzleQueryError',
        cause: { errorClass: 'Error' },
      });
      expect(context).not.toHaveProperty('stack');
      expectNothingLeakable(JSON.stringify(consoleLogSpy.mock.calls));
    });

    it('names the actor by Cognito sub and role, and logs no email on any line', async () => {
      const handler = withErrorHandling(() => {
        throw new Error('Unexpected failure');
      });

      const event = createAuthenticatedEvent();
      await handler(event);

      const startLog = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as {
        actor: string;
        organisationId: string;
      };

      expect(startLog.actor).toBe('user-123 (customer_owner)');
      expect(startLog.organisationId).toBe('org-456');
      expect(JSON.stringify(consoleLogSpy.mock.calls)).not.toContain('test@example.com');
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
