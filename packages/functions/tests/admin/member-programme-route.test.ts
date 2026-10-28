import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProgrammeDetailResponse } from '@ffp/core';
import type * as CoreServer from '@ffp/core/server';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const core = vi.hoisted(() => ({ getUserProgrammeService: vi.fn() }));

vi.mock('@ffp/core/server', async (importOriginal) => ({
  ...(await importOriginal<typeof CoreServer>()),
  getUserProgrammeService: core.getUserProgrammeService,
}));

const { handler } = await import('../../src/admin/index');

const createEvent = (
  method: string,
  path: string,
  role: string
): CoreServer.APIGatewayProxyEventV2WithJWT =>
  ({
    version: '2.0',
    routeKey: 'ANY /admin/{proxy+}',
    rawPath: `/admin${path}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { proxy: path.slice(1) },
    body: method === 'GET' || method === 'DELETE' ? undefined : '{}',
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      requestId: 'test-request-id',
      routeKey: 'ANY /admin/{proxy+}',
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      http: {
        method,
        path: `/admin${path}`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      authorizer: {
        jwt: {
          claims: {
            sub: 'user-123',
            email: 'member@example.com',
            'custom:role': role,
            'custom:tenantId': 'org-456',
          },
          scopes: [],
        },
      },
    },
    isBase64Encoded: false,
  }) as unknown as CoreServer.APIGatewayProxyEventV2WithJWT;

describe('admin member programme route', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // A 403 rather than the router's 404 also proves the route is registered
  it.each(['programme_user', 'customer_admin', 'customer_owner'])(
    'GET /users/{id}/programme refuses a %s',
    async (role) => {
      const result = (await handler(
        createEvent('GET', '/users/abcdefghijkl/programme', role)
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(403);
    }
  );

  it('passes the user publicId to the service and returns the programme to a system admin', async () => {
    const detail: ProgrammeDetailResponse = {
      programme: {
        id: '7b0c2a52-4b7e-4c4e-9a43-2f6a1d9b3c11',
        name: 'Level 1: Gentle Mobility',
        description: null,
        status: 'active',
        startedAt: null,
        totalPhases: 0,
        template: { name: 'Level 1: Gentle Mobility', difficulty: 'beginner' },
      },
      currentPhaseNumber: null,
      phases: [],
    };
    core.getUserProgrammeService.mockResolvedValue(detail);

    const result = (await handler(
      createEvent('GET', '/users/abcdefghijkl/programme', 'system_admin')
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(core.getUserProgrammeService.mock.calls[0][1]).toBe('abcdefghijkl');
    expect(JSON.parse(result.body ?? '')).toEqual(detail);
  });
});
