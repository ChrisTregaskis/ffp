import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { APIGatewayProxyEventV2WithJWT } from '@ffp/core/server';

import { handler } from '../../src/admin/index';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const createEvent = (method: string, path: string, role: string): APIGatewayProxyEventV2WithJWT =>
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
  }) as unknown as APIGatewayProxyEventV2WithJWT;

const TAG_AND_VIDEO_ROUTES: [string, string][] = [
  ['GET', '/tag-categories'],
  ['POST', '/tags'],
  ['PUT', '/tags/abcdefghijkl'],
  ['DELETE', '/tags/abcdefghijkl'],
  ['GET', '/videos/abcdefghijkl'],
  ['PUT', '/videos/abcdefghijkl'],
];

describe('admin tag and video routes', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // A 403 rather than the router's 404 also proves the route is registered
  it.each(TAG_AND_VIDEO_ROUTES)('%s %s refuses a programme user', async (method, path) => {
    const result = (await handler(
      createEvent(method, path, 'programme_user')
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(403);
  });
});
