import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as CoreServer from '@ffp/core/server';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const core = vi.hoisted(() => ({ submitAssessment: vi.fn() }));

vi.mock('@ffp/core/server', async (importOriginal) => {
  const actual = await importOriginal<typeof CoreServer>();

  return {
    ...actual,
    assessmentService: { ...actual.assessmentService, submitAssessment: core.submitAssessment },
  };
});

const { handler } = await import('../../src/assessments/submit-assessment');

const createEvent = (body: string): CoreServer.APIGatewayProxyEventV2WithJWT =>
  ({
    version: '2.0',
    routeKey: 'POST /assessments/{id}/submit',
    rawPath: '/assessments/3ad90ada-14f9-4883-a502-56dc6cf73ab1/submit',
    rawQueryString: '',
    headers: {},
    pathParameters: { id: '3ad90ada-14f9-4883-a502-56dc6cf73ab1' },
    body,
    requestContext: {
      requestId: 'test-request-id',
      http: {
        method: 'POST',
        path: '/assessments/3ad90ada-14f9-4883-a502-56dc6cf73ab1/submit',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      authorizer: {
        jwt: {
          claims: {
            sub: 'user-123',
            email: 'member@example.com',
            'custom:role': 'programme_user',
            'custom:tenantId': 'org-456',
          },
          scopes: [],
        },
      },
    },
    isBase64Encoded: false,
  }) as unknown as CoreServer.APIGatewayProxyEventV2WithJWT;

describe('a handler given a malformed JSON body', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('answers 400, not 500, and never reaches the service', async () => {
    const result = (await handler(
      createEvent('{"answers": {"q": ')
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body ?? '')).toMatchObject({
      error: 'VALIDATION_ERROR',
      message: 'Invalid JSON in request body',
    });
    expect(core.submitAssessment).not.toHaveBeenCalled();
  });
});
