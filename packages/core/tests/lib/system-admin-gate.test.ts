import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createSystemContext,
  extractUserContext,
  type APIGatewayProxyEventV2WithJWT,
} from '../../src/lib/context';
import { withErrorHandling } from '../../src/lib/lambda-wrapper';
import { withSystemAdmin } from '../../src/lib/system-admin-gate';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// A system actor cannot come from a JWT, so that case swaps the extraction out
vi.mock('../../src/lib/context', async (importOriginal) => {
  const actual = await importOriginal<{ extractUserContext: typeof extractUserContext }>();
  return { ...actual, extractUserContext: vi.fn(actual.extractUserContext) };
});

interface LogLine {
  level: string;
  message: string;
  requestId: string;
  organisationId: string;
  context?: Record<string, unknown>;
}

const FORBIDDEN_MESSAGE = 'Only system administrators can list widgets';

const createEvent = (role?: string): APIGatewayProxyEventV2WithJWT =>
  ({
    version: '2.0',
    routeKey: 'ANY /{proxy+}',
    rawPath: '/admin/widgets',
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
        path: '/admin/widgets',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      ...(role && {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123',
              email: 'test@example.com',
              'custom:role': role,
              'custom:tenantId': 'org-456',
            },
          },
        },
      }),
    },
    isBase64Encoded: false,
  }) as APIGatewayProxyEventV2WithJWT;

const asResult = (result: unknown): APIGatewayProxyStructuredResultV2 & { body: string } =>
  result as APIGatewayProxyStructuredResultV2 & { body: string };

describe('withSystemAdmin', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const logLines = (): LogLine[] =>
    consoleLogSpy.mock.calls.map((call) => JSON.parse(call[0] as string) as LogLine);
  const denialLines = (): LogLine[] =>
    logLines().filter((line) => line.context?.action === 'admin_access_denied');

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.mocked(extractUserContext).mockRestore();
  });

  it('admits a system_admin and hands the handler the extracted context', async () => {
    const inner = vi.fn().mockResolvedValue({ ok: true });
    const handler = withErrorHandling(withSystemAdmin(FORBIDDEN_MESSAGE, inner));

    const result = asResult(await handler(createEvent('system_admin')));

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ ok: true });
    expect(inner).toHaveBeenCalledTimes(1);
    const [, context] = inner.mock.calls[0] as [unknown, { actor: { userId: string } }];
    expect(context.actor.userId).toBe('user-123');
    expect(denialLines()).toHaveLength(0);
  });

  it.each(['customer_admin', 'customer_owner', 'programme_user'])(
    'refuses a %s with the endpoint message and one denial line',
    async (role) => {
      const inner = vi.fn();
      const handler = withErrorHandling(withSystemAdmin(FORBIDDEN_MESSAGE, inner));

      const result = asResult(await handler(createEvent(role)));

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body)).toEqual({
        error: 'FORBIDDEN',
        message: FORBIDDEN_MESSAGE,
        requestId: 'test-request-id',
      });
      expect(inner).not.toHaveBeenCalled();

      const denials = denialLines();
      expect(denials).toHaveLength(1);
      expect(denials[0]).toMatchObject({
        level: 'WARN',
        message: 'Admin access denied',
        requestId: 'test-request-id',
        organisationId: 'org-456',
        context: {
          action: 'admin_access_denied',
          userId: 'user-123',
          actorType: 'user',
          role,
          method: 'GET',
          path: '/admin/widgets',
        },
      });
    }
  );

  it('does not log a refusal at ERROR or with a stack', async () => {
    const handler = withErrorHandling(withSystemAdmin(FORBIDDEN_MESSAGE, vi.fn()));

    await handler(createEvent('customer_admin'));

    const lines = logLines();
    expect(lines.some((line) => line.level === 'ERROR')).toBe(false);
    expect(lines.some((line) => line.context && 'stack' in line.context)).toBe(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('refuses a system actor', async () => {
    vi.mocked(extractUserContext).mockReturnValue(
      createSystemContext({ systemId: 'nightly-job', organisationId: 'org-456' })
    );
    const inner = vi.fn();
    const handler = withErrorHandling(withSystemAdmin(FORBIDDEN_MESSAGE, inner));

    const result = asResult(await handler(createEvent()));

    expect(result.statusCode).toBe(403);
    expect(inner).not.toHaveBeenCalled();
    const denials = denialLines();
    expect(denials).toHaveLength(1);
    expect(denials[0].context).toMatchObject({ userId: null, actorType: 'system', role: null });
  });

  it('leaves an unauthenticated caller on 401 without a denial line', async () => {
    const inner = vi.fn();
    const handler = withErrorHandling(withSystemAdmin(FORBIDDEN_MESSAGE, inner));

    const result = asResult(await handler(createEvent()));

    expect(result.statusCode).toBe(401);
    expect(inner).not.toHaveBeenCalled();
    expect(denialLines()).toHaveLength(0);
  });
});
