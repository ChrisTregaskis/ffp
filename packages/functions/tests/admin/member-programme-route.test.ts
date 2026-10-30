import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminProgrammeDetailResponse } from '@ffp/core';
import type * as CoreServer from '@ffp/core/server';

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const core = vi.hoisted(() => ({
  getUserProgrammeService: vi.fn(),
  addMemberExerciseService: vi.fn(),
  updateMemberExerciseService: vi.fn(),
  removeMemberExerciseService: vi.fn(),
  reorderMemberExercisesService: vi.fn(),
  reorderMemberSessionsService: vi.fn(),
}));

vi.mock('@ffp/core/server', async (importOriginal) => ({
  ...(await importOriginal<typeof CoreServer>()),
  ...core,
}));

const { handler } = await import('../../src/admin/index');

const createEvent = (
  method: string,
  path: string,
  role: string,
  body = '{}'
): CoreServer.APIGatewayProxyEventV2WithJWT =>
  ({
    version: '2.0',
    routeKey: 'ANY /admin/{proxy+}',
    rawPath: `/admin${path}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { proxy: path.slice(1) },
    body: method === 'GET' || method === 'DELETE' ? undefined : body,
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
    vi.clearAllMocks();
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
    const detail: AdminProgrammeDetailResponse = {
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
      level: 1,
      keyAreas: [
        {
          questionId: '5d1f0c7e-8a2b-4c3d-9e4f-1a2b3c4d5e6f',
          question: 'Which areas would you like to focus on?',
          answers: ['Neck & Shoulders'],
        },
      ],
    };
    core.getUserProgrammeService.mockResolvedValue(detail);

    const result = (await handler(
      createEvent('GET', '/users/abcdefghijkl/programme', 'system_admin')
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(core.getUserProgrammeService.mock.calls[0][1]).toBe('abcdefghijkl');
    expect(JSON.parse(result.body ?? '')).toEqual(detail);
  });

  const SESSION_ID = '0f1514a0-8274-4dcf-a6fe-09bead163e83';
  const EXERCISE_ID = '6c0b7a1e-2f3d-4e5f-8a9b-0c1d2e3f4a5b';
  const PHASE_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
  const BODY = { orderedIds: [EXERCISE_ID] };

  const writes = [
    {
      method: 'POST',
      path: `/users/abcdefghijkl/programme/sessions/${SESSION_ID}/exercises`,
      service: core.addMemberExerciseService,
      target: SESSION_ID,
    },
    {
      method: 'PUT',
      path: `/users/abcdefghijkl/programme/exercises/${EXERCISE_ID}`,
      service: core.updateMemberExerciseService,
      target: EXERCISE_ID,
    },
    {
      method: 'DELETE',
      path: `/users/abcdefghijkl/programme/exercises/${EXERCISE_ID}`,
      service: core.removeMemberExerciseService,
      target: EXERCISE_ID,
    },
    {
      method: 'PUT',
      path: `/users/abcdefghijkl/programme/sessions/${SESSION_ID}/exercises/reorder`,
      service: core.reorderMemberExercisesService,
      target: SESSION_ID,
    },
    {
      method: 'PUT',
      path: `/users/abcdefghijkl/programme/phases/${PHASE_ID}/sessions/reorder`,
      service: core.reorderMemberSessionsService,
      target: PHASE_ID,
    },
  ];

  it.each(writes)('$method $path refuses a customer admin', async ({ method, path, service }) => {
    const result = (await handler(
      createEvent(method, path, 'customer_admin', JSON.stringify(BODY))
    )) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(403);
    expect(service).not.toHaveBeenCalled();
  });

  it.each(writes)(
    '$method $path passes the user publicId, target and body to its service',
    async ({ method, path, service, target }) => {
      service.mockResolvedValue(method === 'DELETE' ? undefined : []);

      const result = (await handler(
        createEvent(method, path, 'system_admin', JSON.stringify(BODY))
      )) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      expect(service.mock.calls[0].slice(1)).toEqual(
        method === 'DELETE' ? ['abcdefghijkl', target] : ['abcdefghijkl', target, BODY]
      );
    }
  );
});
