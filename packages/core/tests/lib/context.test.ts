/**
 * Unit tests for tenant context extraction utilities
 *
 * Tests actor-based context extraction for both user-triggered requests
 * (API Gateway with JWT) and system-triggered requests (job queues, scheduled tasks).
 *
 * Critical security tests:
 * - Multi-tenant isolation via tenantId validation
 * - JWT claim validation (missing/invalid claims)
 * - Actor type guards and display names
 */

import { describe, it, expect } from 'vitest';

import { COGNITO_CUSTOM_ATTRIBUTES } from '../../src/lib/constants';
import {
  extractUserContext,
  createSystemContext,
  extractJobContext,
  isUserActor,
  isSystemActor,
  getActorDisplayName,
  type TenantContext,
  type APIGatewayProxyEventV2WithJWT,
  type UserActor,
  type SystemActor,
} from '../../src/lib/context';
import { UnauthorisedError, ValidationError } from '../../src/lib/errors';

import type { APIGatewayEventRequestContextV2 } from 'aws-lambda';

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
  tenantId: string | number | null;
  customerId: string;
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
  tenantId: string | number | undefined;
  customerId: string | null;
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
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      const context = extractUserContext(event);

      expect(context.actor.type).toBe('user');
      if (isUserActor(context.actor)) {
        expect(context.actor.userId).toBe('user-123');
        expect(context.actor.userRole).toBe('customer_owner');
        expect(context.actor.email).toBe('test@example.com');
      }
      expect(context.tenantId).toBe('tenant-456');
      expect(context.customerId).toBeNull();
      expect(context.requestId).toBe('test-request-123');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract context from valid JWT with customerId present', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID]: 'customer-789',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      const context = extractUserContext(event);

      expect(context.actor.type).toBe('user');
      if (isUserActor(context.actor)) {
        expect(context.actor.userId).toBe('user-123');
        expect(context.actor.userRole).toBe('customer_owner');
        expect(context.actor.email).toBe('test@example.com');
      }
      expect(context.tenantId).toBe('tenant-456');
      expect(context.customerId).toBe('customer-789');
      expect(context.requestId).toBe('test-request-123');
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract context from valid JWT without customerId (null for super admins)', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'admin-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'platform',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'system_admin',
        email: 'admin@platform.com',
      });

      const context = extractUserContext(event);

      expect(context.actor.type).toBe('user');
      if (isUserActor(context.actor)) {
        expect(context.actor.userId).toBe('admin-123');
        expect(context.actor.userRole).toBe('system_admin');
      }
      expect(context.customerId).toBeNull();
    });

    it('should use event.requestContext.requestId for generated requestId', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      const context = extractUserContext(event);

      expect(context.requestId).toBe('test-request-123');
    });

    it('should create timestamp as Date object', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
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
    it('should throw UnauthorisedError when JWT authoriser is missing in request context', () => {
      const event = createIncompleteAPIGatewayEvent();

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('No JWT claims found in request');
    });

    it('should throw UnauthorisedError when authoriser is null', () => {
      const event = createIncompleteAPIGatewayEvent({
        authorizer: null,
      } as Partial<APIGatewayEventRequestContextV2>);

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('No JWT claims found in request');
    });

    it('should throw UnauthorisedError when jwt property is missing', () => {
      const event = createIncompleteAPIGatewayEvent({
        authorizer: {},
      } as Partial<APIGatewayEventRequestContextV2>);

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('No JWT claims found in request');
    });

    it('should throw UnauthorisedError when claims property is missing', () => {
      const event = createIncompleteAPIGatewayEvent({
        authorizer: {
          jwt: {},
        },
      } as Partial<APIGatewayEventRequestContextV2>);

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('No JWT claims found in request');
    });
  });

  describe('Missing required claims', () => {
    it('should throw UnauthorisedError when sub claim is missing', () => {
      const event = createMockAPIGatewayEvent({
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid sub claim');
    });

    it('should throw UnauthorisedError when tenantId claim is missing', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid tenantId claim');
    });

    it('should throw UnauthorisedError when role claim is missing', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid role claim');
    });

    it('should throw UnauthorisedError when email claim is missing', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid email claim');
    });
  });

  describe('Invalid claim types', () => {
    it('should throw UnauthorisedError when sub is not a string', () => {
      const event = createMockAPIGatewayEvent({
        sub: 123, // number instead of string
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid sub claim');
    });

    it('should throw UnauthorisedError when tenantId is not a string', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 456, // number instead of string
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid tenantId claim');
    });

    it('should throw UnauthorisedError when role is not a string', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: true, // boolean instead of string
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid role claim');
    });

    it('should throw UnauthorisedError when email is not a string', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: ['test@example.com'], // array instead of string
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid email claim');
    });

    it('should throw UnauthorisedError when sub is empty string', () => {
      const event = createMockAPIGatewayEvent({
        sub: '',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid sub claim');
    });

    it('should throw UnauthorisedError when tenantId is empty string', () => {
      const event = createMockAPIGatewayEvent({
        sub: 'user-123',
        [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: '',
        [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
        email: 'test@example.com',
      });

      expect(() => extractUserContext(event)).toThrow(UnauthorisedError);
      expect(() => extractUserContext(event)).toThrow('Missing or invalid tenantId claim');
    });
  });
});

describe('createSystemContext', () => {
  describe('Valid system context creation', () => {
    it('should create valid system context with all required parameters', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
      });

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.systemId).toBe('assessment-processor');
        expect(context.actor.triggeredBy).toBeUndefined();
        expect(context.actor.jobId).toBeUndefined();
      }
      expect(context.tenantId).toBe('tenant-123');
      expect(context.customerId).toBeNull();
      expect(context.requestId).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should create system context with optional triggeredBy', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
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
        tenantId: 'tenant-123',
        jobId: 'job-789',
      });

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.jobId).toBe('job-789');
      }
    });

    it('should create system context with optional customerId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
        customerId: 'customer-456',
      });

      expect(context.customerId).toBe('customer-456');
    });

    it('should create system context with explicit null customerId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
        customerId: null,
      });

      expect(context.customerId).toBeNull();
    });

    it('should generate a valid UUID for requestId', () => {
      const context = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
      });

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(context.requestId).toMatch(uuidRegex);
    });

    it('should create timestamp as Date object', () => {
      const before = new Date();
      const context = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
      });
      const after = new Date();

      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(context.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should create different requestIds for multiple calls', () => {
      const context1 = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
      });

      const context2 = createSystemContext({
        systemId: 'assessment-processor',
        tenantId: 'tenant-123',
      });

      expect(context1.requestId).not.toBe(context2.requestId);
    });
  });

  describe('Invalid parameters', () => {
    it('should throw ValidationError when systemId is missing', () => {
      expectSystemContextToThrow(
        {
          systemId: undefined,
          tenantId: 'tenant-123',
        },
        ValidationError,
        'systemId is required and must be a non-empty string'
      );
    });

    it('should throw ValidationError when systemId is empty string', () => {
      expectSystemContextToThrow(
        {
          systemId: '',
          tenantId: 'tenant-123',
        },
        ValidationError,
        'systemId is required and must be a non-empty string'
      );
    });

    it('should throw ValidationError when systemId is not a string', () => {
      expectSystemContextToThrow(
        {
          systemId: 123,
          tenantId: 'tenant-123',
        },
        ValidationError,
        'systemId is required and must be a non-empty string'
      );
    });

    it('should throw ValidationError when tenantId is missing', () => {
      expectSystemContextToThrow(
        {
          systemId: 'assessment-processor',
          tenantId: undefined,
        },
        ValidationError,
        'tenantId is required and must be a non-empty string'
      );
    });

    it('should throw ValidationError when tenantId is empty string', () => {
      expectSystemContextToThrow(
        {
          systemId: 'assessment-processor',
          tenantId: '',
        },
        ValidationError,
        'tenantId is required and must be a non-empty string'
      );
    });

    it('should throw ValidationError when tenantId is not a string', () => {
      expectSystemContextToThrow(
        {
          systemId: 'assessment-processor',
          tenantId: 456,
        },
        ValidationError,
        'tenantId is required and must be a non-empty string'
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
        tenantId: 'tenant-456',
        customerId: 'customer-789',
        userId: 'user-101',
      };

      const context = extractJobContext(jobMessage);

      expect(context.actor.type).toBe('system');
      if (isSystemActor(context.actor)) {
        expect(context.actor.systemId).toBe('assessment-processor');
        expect(context.actor.jobId).toBe('job-123');
        expect(context.actor.triggeredBy).toBe('user-101');
      }
      expect(context.tenantId).toBe('tenant-456');
      expect(context.customerId).toBe('customer-789');
      expect(context.requestId).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract context from job message with optional userId (triggeredBy)', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        tenantId: 'tenant-456',
        userId: 'user-101',
      };

      const context = extractJobContext(jobMessage);

      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBe('user-101');
      }
      expect(context.customerId).toBeNull();
    });

    it('should extract context from job message with optional customerId', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        tenantId: 'tenant-456',
        customerId: 'customer-789',
      };

      const context = extractJobContext(jobMessage);

      expect(context.customerId).toBe('customer-789');
      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBeUndefined();
      }
    });

    it('should extract context from job message without optional fields', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        tenantId: 'tenant-456',
      };

      const context = extractJobContext(jobMessage);

      if (isSystemActor(context.actor)) {
        expect(context.actor.triggeredBy).toBeUndefined();
      }
      expect(context.customerId).toBeNull();
    });

    it('should use jobType as systemId', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'daily-report-generator',
        tenantId: 'tenant-456',
      };

      const context = extractJobContext(jobMessage);

      if (isSystemActor(context.actor)) {
        expect(context.actor.systemId).toBe('daily-report-generator');
      }
    });

    it('should include jobId in system actor', () => {
      const jobMessage = {
        jobId: 'job-123',
        jobType: 'assessment-processor',
        tenantId: 'tenant-456',
      };

      const context = extractJobContext(jobMessage);

      if (isSystemActor(context.actor)) {
        expect(context.actor.jobId).toBe('job-123');
      }
    });
  });

  describe('Invalid job messages', () => {
    it('should throw ValidationError when jobId is missing', () => {
      expectJobContextToThrow(
        {
          jobType: 'assessment-processor',
          tenantId: 'tenant-456',
        },
        ValidationError,
        'Job message missing required field: jobId'
      );
    });

    it('should throw ValidationError when jobId is empty string', () => {
      expectJobContextToThrow(
        {
          jobId: '',
          jobType: 'assessment-processor',
          tenantId: 'tenant-456',
        },
        ValidationError,
        'Job message missing required field: jobId'
      );
    });

    it('should throw ValidationError when jobId is not a string', () => {
      expectJobContextToThrow(
        {
          jobId: 123,
          jobType: 'assessment-processor',
          tenantId: 'tenant-456',
        },
        ValidationError,
        'Job message missing required field: jobId'
      );
    });

    it('should throw ValidationError when jobType is missing', () => {
      expectJobContextToThrow(
        {
          jobId: 'job-123',
          tenantId: 'tenant-456',
        },
        ValidationError,
        'Job message missing required field: jobType'
      );
    });

    it('should throw ValidationError when jobType is empty string', () => {
      expectJobContextToThrow(
        {
          jobId: 'job-123',
          jobType: '',
          tenantId: 'tenant-456',
        },
        ValidationError,
        'Job message missing required field: jobType'
      );
    });

    it('should throw ValidationError when jobType is not a string', () => {
      expectJobContextToThrow(
        {
          jobId: 'job-123',
          jobType: true,
          tenantId: 'tenant-456',
        },
        ValidationError,
        'Job message missing required field: jobType'
      );
    });

    it('should throw ValidationError when tenantId is missing', () => {
      expectJobContextToThrow(
        {
          jobId: 'job-123',
          jobType: 'assessment-processor',
        },
        ValidationError,
        'Job message missing required field: tenantId'
      );
    });

    it('should throw ValidationError when tenantId is empty string', () => {
      expectJobContextToThrow(
        {
          jobId: 'job-123',
          jobType: 'assessment-processor',
          tenantId: '',
        },
        ValidationError,
        'Job message missing required field: tenantId'
      );
    });

    it('should throw ValidationError when tenantId is not a string', () => {
      expectJobContextToThrow(
        {
          jobId: 'job-123',
          jobType: 'assessment-processor',
          tenantId: null,
        },
        ValidationError,
        'Job message missing required field: tenantId'
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

    it('should narrow type to UserActor when true', () => {
      const context: TenantContext = {
        actor: {
          type: 'user',
          userId: 'user-123',
          userRole: 'customer_owner',
          email: 'test@example.com',
        },
        tenantId: 'tenant-456',
        customerId: null,
        requestId: 'request-123',
        timestamp: new Date(),
      };

      if (isUserActor(context.actor)) {
        // TypeScript should recognise this as UserActor
        expect(context.actor.userId).toBe('user-123');
        expect(context.actor.email).toBe('test@example.com');
      }
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

    it('should narrow type to SystemActor when true', () => {
      const context: TenantContext = {
        actor: {
          type: 'system',
          systemId: 'assessment-processor',
          jobId: 'job-123',
        },
        tenantId: 'tenant-456',
        customerId: null,
        requestId: 'request-123',
        timestamp: new Date(),
      };

      if (isSystemActor(context.actor)) {
        // TypeScript should recognise this as SystemActor
        expect(context.actor.systemId).toBe('assessment-processor');
        expect(context.actor.jobId).toBe('job-123');
      }
    });
  });
});

describe('getActorDisplayName', () => {
  it('should return formatted display name for user actor', () => {
    const userActor: UserActor = {
      type: 'user',
      userId: 'user-123',
      userRole: 'customer_owner',
      email: 'john@example.com',
    };

    const displayName = getActorDisplayName(userActor);

    expect(displayName).toBe('john@example.com (customer_owner)');
  });

  it('should return formatted display name for system actor', () => {
    const systemActor: SystemActor = {
      type: 'system',
      systemId: 'assessment-processor',
    };

    const displayName = getActorDisplayName(systemActor);

    expect(displayName).toBe('System: assessment-processor');
  });

  it('should format display name correctly for different user roles', () => {
    const roles = ['system_admin', 'customer_admin', 'programme_user'];

    roles.forEach((role) => {
      const userActor: UserActor = {
        type: 'user',
        userId: 'user-123',
        userRole: role,
        email: 'test@example.com',
      };

      const displayName = getActorDisplayName(userActor);

      expect(displayName).toBe(`test@example.com (${role})`);
    });
  });

  it('should format display name correctly for different system IDs', () => {
    const systemIds = [
      'assessment-processor',
      'daily-report-job',
      'video-transcoder',
      'email-sender',
    ];

    systemIds.forEach((systemId) => {
      const systemActor: SystemActor = {
        type: 'system',
        systemId,
      };

      const displayName = getActorDisplayName(systemActor);

      expect(displayName).toBe(`System: ${systemId}`);
    });
  });

  it('should work with context from extractUserContext', () => {
    const event = createMockAPIGatewayEvent({
      sub: 'user-123',
      [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: 'tenant-456',
      [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: 'customer_owner',
      email: 'sarah@example.com',
    });

    const context = extractUserContext(event);
    const displayName = getActorDisplayName(context.actor);

    expect(displayName).toBe('sarah@example.com (customer_owner)');
  });

  it('should work with context from createSystemContext', () => {
    const context = createSystemContext({
      systemId: 'nightly-backup',
      tenantId: 'tenant-123',
    });

    const displayName = getActorDisplayName(context.actor);

    expect(displayName).toBe('System: nightly-backup');
  });
});
