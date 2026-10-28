/**
 * Unit tests for organisation context extraction utilities
 *
 * Tests actor-based context extraction for both user-triggered requests
 * (API Gateway with JWT) and system-triggered requests (job queues, scheduled tasks).
 *
 * Critical security tests:
 * - Multi-tenant isolation via organisationId validation
 * - JWT claim validation (missing/invalid claims)
 * - Actor type guards and display names
 * - Resolving the member's database ID from the Cognito sub within their organisation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { User } from '@ffp/database/schema';

import {
  extractUserContext,
  createSystemContext,
  extractJobContext,
  isUserActor,
  isSystemActor,
  getActorDisplayName,
  getUserIdFromContext,
  type APIGatewayProxyEventV2WithJWT,
  type UserActor,
  type SystemActor,
} from '../../src/lib/context';
import { UnauthorisedError, ValidationError } from '../../src/lib/errors';
import * as userRepository from '../../src/users/user.repository';

import type { APIGatewayEventRequestContextV2 } from 'aws-lambda';

vi.mock('../../src/users/user.repository');

const mockedUserRepository = vi.mocked(userRepository);

/**
 * Helper function to create mock API Gateway events with JWT claims
 *
 * @param claims - JWT claims to include in the event
 * @returns Mock API Gateway event with JWT authoriser
 */
function createMockAPIGatewayEvent(claims: Record<string, unknown>): APIGatewayProxyEventV2WithJWT {
  return {
    requestContext: {
      requestId: 'test-request-123',
      authorizer: {
        jwt: {
          claims,
        },
      },
      accountId: 'test-account',
      apiId: 'test-api',
      domainName: 'test.example.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/test',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      stage: 'dev',
      time: '01/Jan/2025:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    version: '2.0',
    routeKey: '$default',
    rawPath: '/test',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2WithJWT;
}

/**
 * Helper to create incomplete API Gateway event (for error testing)
 * Returns a partial event structure that's missing the authoriser
 */
function createIncompleteAPIGatewayEvent(
  overrides?: Partial<APIGatewayEventRequestContextV2>
): APIGatewayProxyEventV2WithJWT {
  return {
    requestContext: {
      requestId: 'test-request-123',
      accountId: 'test-account',
      apiId: 'test-api',
      domainName: 'test.example.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/test',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      stage: 'dev',
      time: '01/Jan/2025:00:00:00 +0000',
      timeEpoch: 1704067200000,
      ...overrides,
    },
    version: '2.0',
    routeKey: '$default',
    rawPath: '/test',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2WithJWT;
}

/**
 * Type for incomplete job messages (for error testing)
 */
type PartialJobMessage = Partial<{
  organisationId: string | number | null;
  locationId: string;
  userId: string;
  jobId: string | number;
  jobType: string | boolean;
}>;

/**
 * Helper to test invalid job messages
 * Uses proper typing instead of 'any'
 */
function expectJobContextToThrow(
  jobMessage: PartialJobMessage,
  expectedError: typeof ValidationError,
  expectedMessage: string
): void {
  expect(() => extractJobContext(jobMessage as never)).toThrow(expectedError);
  expect(() => extractJobContext(jobMessage as never)).toThrow(expectedMessage);
}

/**
 * Type for incomplete system context params (for error testing)
 */
type PartialSystemContextParams = Partial<{
  systemId: string | number | undefined;
  organisationId: string | number | undefined;
  locationId: string | null;
  triggeredBy: string;
  jobId: string;
}>;

/**
 * Helper to test invalid system context params
 * Uses proper typing instead of 'any'
 */
function expectSystemContextToThrow(
  params: PartialSystemContextParams,
  expectedError: typeof ValidationError,
  expectedMessage: string
): void {
  expect(() => createSystemContext(params as never)).toThrow(expectedError);
  expect(() => createSystemContext(params as never)).toThrow(expectedMessage);
}

describe('extractUserContext', () => {
  describe('Valid JWT claims', () => {
    it('should extract context from valid JWT with all required claims', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        'custom:tenantId': 'tenant-456',
        'custom:role': 'customer_owner',
        email: 'test@example.com',
      });

      const context = extractUserContext(event);

      expect(context.actor.type).toBe('user');
      if (isUserActor(context.actor)) {
        expect(context.actor.userId).toBe('user-123');
        expect(context.actor.userRole).toBe('customer_owner');
        expect(context.actor.email).toBe('test@example.com');
      }
      expect(context.organisationId).toBe('tenant-456');
      expect(context.locationId).toBeNull();
      expect(context.requestId).toBe('test-request-123');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract context from valid JWT with locationId present', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        'custom:tenantId': 'tenant-456',
        'custom:customerId': 'customer-789',
        'custom:role': 'customer_owner',
        email: 'test@example.com',
      });

      const context = extractUserContext(event);

      expect(context.actor.type).toBe('user');
      if (isUserActor(context.actor)) {
        expect(context.actor.userId).toBe('user-123');
        expect(context.actor.userRole).toBe('customer_owner');
        expect(context.actor.email).toBe('test@example.com');
      }
      expect(context.organisationId).toBe('tenant-456');
      expect(context.locationId).toBe('customer-789');
      expect(context.requestId).toBe('test-request-123');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract context from valid JWT without locationId (null for super admins)', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'admin-123',
        'custom:tenantId': 'platform',
        'custom:role': 'system_admin',
        email: 'admin@platform.com',
      });

      const context = extractUserContext(event);

      expect(context.actor.type).toBe('user');
      if (isUserActor(context.actor)) {
        expect(context.actor.userId).toBe('admin-123');
        expect(context.actor.userRole).toBe('system_admin');
      }
      expect(context.locationId).toBeNull();
    });

    it('takes the organisation from custom:tenantId over a header, the body and a look-alike claim', () => {
      const event: APIGatewayProxyEventV2WithJWT = {
        ...createMockAPIGatewayEvent({
          sub: 'user-123',
          'custom:tenantId': 'org-from-tenant-claim',
          'custom:organisationId': 'org-from-look-alike-claim',
          'custom:role': 'customer_owner',
          email: 'test@example.com',
        }),
        headers: { 'x-organisation-id': 'org-from-header' },
        body: JSON.stringify({ organisationId: 'org-from-body' }),
      };

      const context = extractUserContext(event);

      expect(context.organisationId).toBe('org-from-tenant-claim');
    });

    it('should create timestamp as Date object', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        'custom:tenantId': 'tenant-456',
        'custom:role': 'customer_owner',
        email: 'test@example.com',
      });

      const before = new Date();
      const context = extractUserContext(event);
      const after = new Date();

      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(context.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Missing JWT authoriser', () => {
    it.each([
      ['the authoriser is missing', undefined],
      ['the authoriser is null', { authorizer: null }],
      ['the jwt property is missing', { authorizer: {} }],
      ['the claims property is missing', { authorizer: { jwt: {} } }],
    ])('throws UnauthorisedError when %s', (_case, overrides) => {
      const event = createIncompleteAPIGatewayEvent(
        overrides as Partial<APIGatewayEventRequestContextV2> | undefined
      );

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('No JWT claims found in request');
    });
  });

  describe('Missing or invalid claims', () => {
    const MISSING = Symbol('missing');
    const validClaims: Record<string, unknown> = {
      sub: 'user-123',
      'custom:tenantId': 'tenant-456',
      'custom:role': 'customer_owner',
      email: 'test@example.com',
    };

    it.each([
      ['sub', 'missing', MISSING, 'Missing or invalid sub claim'],
      ['custom:tenantId', 'missing', MISSING, 'Missing or invalid organisationId claim'],
      ['custom:role', 'missing', MISSING, 'Missing or invalid role claim'],
      ['email', 'missing', MISSING, 'Missing or invalid email claim'],
      ['sub', 'a number', 123, 'Missing or invalid sub claim'],
      ['custom:tenantId', 'a number', 456, 'Missing or invalid organisationId claim'],
      ['custom:role', 'a boolean', true, 'Missing or invalid role claim'],
      ['email', 'an array', ['test@example.com'], 'Missing or invalid email claim'],
      ['sub', 'an empty string', '', 'Missing or invalid sub claim'],
      ['custom:tenantId', 'an empty string', '', 'Missing or invalid organisationId claim'],
    ])('throws UnauthorisedError when %s is %s', (claim, _case, value, expectedMessage) => {
      const claims =
        value === MISSING
          ? Object.fromEntries(Object.entries(validClaims).filter(([name]) => name !== claim))
          : { ...validClaims, [claim]: value };
      const event = createMockAPIGatewayEvent(claims);

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow(expectedMessage);
    });
  });
});

describe('createSystemContext', () => {
  describe('Valid system context creation', () => {
    it('should create valid system context with all required parameters', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
      });

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.systemId).toBe('assessment-processor');
        expect(context.actor.triggeredBy).toBeUndefined();
        expect(context.actor.jobId).toBeUndefined();
      }
      expect(context.organisationId).toBe('tenant-123');
      expect(context.locationId).toBeNull();
      expect(context.requestId).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should create system context with optional triggeredBy', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
        triggeredBy: 'user-456',
      });

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBe('user-456');
      }
    });

    it('should create system context with optional jobId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
        jobId: 'job-789',
      });

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.jobId).toBe('job-789');
      }
    });

    it('should create system context with optional locationId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
        locationId: 'customer-456',
      });

      expect(context.locationId).toBe('customer-456');
    });

    it('should create system context with explicit null locationId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
        locationId: null,
      });

      expect(context.locationId).toBeNull();
    });

    it('should generate a valid UUID for requestId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
      });

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(context.requestId).toMatch(uuidRegex);
    });

    it('should create timestamp as Date object', () => {
      const before = new Date();
      const context = createSystemContext({
        systemId: 'assessment-processor',
        organisationId: 'tenant-123',
      });
      const after = new Date();

      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(context.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Invalid parameters', () => {
    it.each([
      ['systemId is missing', { systemId: undefined, organisationId: 'tenant-123' }, 'systemId'],
      ['systemId is an empty string', { systemId: '', organisationId: 'tenant-123' }, 'systemId'],
      ['systemId is not a string', { systemId: 123, organisationId: 'tenant-123' }, 'systemId'],
      [
        'organisationId is missing',
        { systemId: 'assessment-processor', organisationId: undefined },
        'organisationId',
      ],
      [
        'organisationId is an empty string',
        { systemId: 'assessment-processor', organisationId: '' },
        'organisationId',
      ],
      [
        'organisationId is not a string',
        { systemId: 'assessment-processor', organisationId: 456 },
        'organisationId',
      ],
    ])('throws ValidationError when %s', (_case, params, field) => {
      expectSystemContextToThrow(
        params,
        ValidationError,
        `${field} is required and must be a non-empty string`
      );
    });
  });
});

describe('extractJobContext', () => {
  describe('Valid job messages', () => {
    it('should extract context from valid job message with all fields', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        organisationId: 'tenant-456',
        locationId: 'customer-789',
        userId: 'user-101',
      };

      const context = extractJobContext(jobMessage);

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.systemId).toBe('assessment-processor');
        expect(context.actor.jobId).toBe('job-123');
        expect(context.actor.triggeredBy).toBe('user-101');
      }
      expect(context.organisationId).toBe('tenant-456');
      expect(context.locationId).toBe('customer-789');
      expect(context.requestId).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract context from job message with optional userId (triggeredBy)', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        organisationId: 'tenant-456',
        userId: 'user-101',
      };

      const context = extractJobContext(jobMessage);

      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBe('user-101');
      }
      expect(context.locationId).toBeNull();
    });

    it('should extract context from job message with optional locationId', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        organisationId: 'tenant-456',
        locationId: 'customer-789',
      };

      const context = extractJobContext(jobMessage);

      expect(context.locationId).toBe('customer-789');
      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBeUndefined();
      }
    });

    it('should extract context from job message without optional fields', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        organisationId: 'tenant-456',
      };

      const context = extractJobContext(jobMessage);

      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBeUndefined();
      }
      expect(context.locationId).toBeNull();
    });
  });

  describe('Invalid job messages', () => {
    it.each([
      [
        'jobId is missing',
        { jobType: 'assessment-processor', organisationId: 'tenant-456' },
        'jobId',
      ],
      [
        'jobId is an empty string',
        { jobId: '', jobType: 'assessment-processor', organisationId: 'tenant-456' },
        'jobId',
      ],
      [
        'jobId is not a string',
        { jobId: 123, jobType: 'assessment-processor', organisationId: 'tenant-456' },
        'jobId',
      ],
      ['jobType is missing', { jobId: 'job-123', organisationId: 'tenant-456' }, 'jobType'],
      [
        'jobType is an empty string',
        { jobId: 'job-123', jobType: '', organisationId: 'tenant-456' },
        'jobType',
      ],
      [
        'jobType is not a string',
        { jobId: 'job-123', jobType: true, organisationId: 'tenant-456' },
        'jobType',
      ],
      [
        'organisationId is missing',
        { jobId: 'job-123', jobType: 'assessment-processor' },
        'organisationId',
      ],
      [
        'organisationId is an empty string',
        { jobId: 'job-123', jobType: 'assessment-processor', organisationId: '' },
        'organisationId',
      ],
      [
        'organisationId is not a string',
        { jobId: 'job-123', jobType: 'assessment-processor', organisationId: null },
        'organisationId',
      ],
    ])('throws ValidationError when %s', (_case, jobMessage, field) => {
      expectJobContextToThrow(
        jobMessage,
        ValidationError,
        `Job message missing required field: ${field}`
      );
    });
  });
});

describe('Type guards', () => {
  describe('isUserActor', () => {
    it('should return true for UserActor', () => {
      const userActor: UserActor = {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      };

      expect(isUserActor(userActor)).toBe(true);
    });

    it('should return false for SystemActor', () => {
      const systemActor: SystemActor = {
        type: 'system',
        systemId: 'assessment-processor',
      };

      expect(isUserActor(systemActor)).toBe(false);
    });
  });

  describe('isSystemActor', () => {
    it('should return true for SystemActor', () => {
      const systemActor: SystemActor = {
        type: 'system',
        systemId: 'assessment-processor',
      };

      expect(isSystemActor(systemActor)).toBe(true);
    });

    it('should return false for UserActor', () => {
      const userActor: UserActor = {
        type: 'user',
        userId: 'user-123',
        userRole: 'customer_owner',
        email: 'test@example.com',
      };

      expect(isSystemActor(userActor)).toBe(false);
    });
  });
});

describe('getActorDisplayName', () => {
  it('names a user actor by Cognito sub and role, never by email', () => {
    const userActor: UserActor = {
      type: 'user',
      userId: 'user-123',
      userRole: 'customer_owner',
      email: 'john@example.com',
    };

    const displayName = getActorDisplayName(userActor);

    expect(displayName).toBe('user-123 (customer_owner)');
  });

  it('should return formatted display name for system actor', () => {
    const systemActor: SystemActor = {
      type: 'system',
      systemId: 'assessment-processor',
    };

    const displayName = getActorDisplayName(systemActor);

    expect(displayName).toBe('System: assessment-processor');
  });
});

describe('getUserIdFromContext', () => {
  const ORGANISATION_ID = 'org-of-the-member';
  const COGNITO_SUB = 'cognito-sub-of-the-member';

  const memberContext = (): ReturnType<typeof extractUserContext> =>
    extractUserContext(
      createMockAPIGatewayEvent({
        sub: COGNITO_SUB,
        'custom:tenantId': ORGANISATION_ID,
        'custom:role': 'programme_user',
        email: 'member@example.com',
      })
    );

  const storedUser: User = {
    id: 'database-id-of-the-member',
    publicId: 'usr123456789',
    organisationId: ORGANISATION_ID,
    email: 'member@example.com',
    cognitoSub: COGNITO_SUB,
    firstName: 'Mo',
    lastName: 'Member',
    role: 'programme_user',
    locationId: null,
    profileImageUrl: null,
    phone: null,
    dateOfBirth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('looks the member up by Cognito sub within their organisation and returns the database ID', async () => {
    mockedUserRepository.findUserByCognitoSub.mockResolvedValue(storedUser);

    await expect(getUserIdFromContext(memberContext())).resolves.toBe('database-id-of-the-member');
    expect(mockedUserRepository.findUserByCognitoSub).toHaveBeenCalledWith(
      ORGANISATION_ID,
      COGNITO_SUB
    );
  });

  it('refuses a system actor without looking anyone up', async () => {
    const context = createSystemContext({
      systemId: 'daily-report-job',
      organisationId: ORGANISATION_ID,
    });

    await expect(getUserIdFromContext(context)).rejects.toMatchObject({
      code: 'UNAUTHORISED',
      message: 'This operation requires a user context',
    });
    expect(mockedUserRepository.findUserByCognitoSub).not.toHaveBeenCalled();
  });

  it('refuses a member with no database record', async () => {
    mockedUserRepository.findUserByCognitoSub.mockResolvedValue(null);

    await expect(getUserIdFromContext(memberContext())).rejects.toMatchObject({
      code: 'UNAUTHORISED',
      message: 'User not found in database',
    });
  });
});
