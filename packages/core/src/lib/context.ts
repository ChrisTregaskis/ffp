/**
 * Tenant Context Extraction Utilities
 *
 * Provides actor-based context extraction for both user-triggered requests
 * (API Gateway with JWT) and system-triggered requests (job queues, scheduled tasks).
 *
 * All contexts include tenantId (RLS isolation boundary) and flow through layers
 * (Handler → Service → Repository).
 *
 * @module lib/context
 */

import { randomUUID } from 'crypto';

import { type APIGatewayProxyEventV2, type APIGatewayEventRequestContextV2 } from 'aws-lambda';

import * as userRepository from '../users/user.repository';

import { COGNITO_CUSTOM_ATTRIBUTES } from './constants';
import { UnauthorisedError, ValidationError } from './errors';

/**
 * JWT claims structure from AWS Cognito
 */
interface JWTClaims {
  sub: string;
  email: string;
  [COGNITO_CUSTOM_ATTRIBUTES.ROLE]: string;
  [COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID]: string;
  [COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID]?: string;
  [key: string]: unknown;
}

/**
 * API Gateway JWT authorizer structure
 */
interface JWTAuthorizer {
  jwt: {
    claims: JWTClaims;
  };
}

/**
 * API Gateway V2 request context with JWT authorizer
 */
interface APIGatewayEventRequestContextV2WithJWT extends APIGatewayEventRequestContextV2 {
  authorizer: JWTAuthorizer;
}

/**
 * API Gateway V2 event with JWT authorizer
 */
export type APIGatewayProxyEventV2WithJWT = Omit<APIGatewayProxyEventV2, 'requestContext'> & {
  requestContext: APIGatewayEventRequestContextV2WithJWT;
};

/**
 * Type guard to safely validate JWT authorizer structure
 *
 * @param authorizer - The authorizer object from API Gateway request context
 * @returns True if authorizer has the expected JWT structure
 */
function hasJWTClaims(authorizer: unknown): authorizer is JWTAuthorizer {
  if (typeof authorizer !== 'object' || authorizer === null) {
    return false;
  }

  const auth = authorizer as Record<string, unknown>;

  if (!('jwt' in auth) || typeof auth.jwt !== 'object' || auth.jwt === null) {
    return false;
  }

  const jwt = auth.jwt as Record<string, unknown>;

  return 'claims' in jwt && typeof jwt.claims === 'object' && jwt.claims !== null;
}

/**
 * User actor - represents authenticated API requests from users
 */
export interface UserActor {
  type: 'user';
  userId: string;
  userRole: string;
  email: string;
}

/**
 * System actor - represents background jobs, scheduled tasks, or system operations
 */
export interface SystemActor {
  type: 'system';
  systemId: string; // e.g., 'assessment-processor', 'daily-report-job'
  triggeredBy?: string; // Original user ID if user-triggered
  jobId?: string; // Queue job ID for traceability
}

/**
 * Actor type - either a user or a system
 */
export type Actor = UserActor | SystemActor;

/**
 * Platform settings that can be included in context
 */
export type PlatformSettings = Record<string, unknown>;

/**
 * Enhanced tenant context supporting both user and system actors
 *
 * This context flows through all layers of the application and provides
 * the necessary information for multi-tenant isolation, logging, and auditing.
 */
export interface TenantContext {
  /** The actor performing the operation (user or system) */
  actor: Actor;
  /** Tenant ID for Row-Level Security isolation */
  tenantId: string;
  /** Customer ID within the tenant (nullable for super admins) */
  customerId: string | null;
  /** Unique request ID for tracing and logging */
  requestId: string;
  /** Timestamp when the context was created */
  timestamp: Date;
  /** Optional platform settings for the tenant */
  settings?: PlatformSettings;
  /** Optional list of enabled modules for the tenant */
  enabledModules?: string[];
}

/**
 * Extract context from API Gateway user request
 *
 * Parses JWT claims from the API Gateway event and creates a TenantContext
 * with a UserActor. This should be used for all authenticated API requests.
 *
 * @param event - API Gateway proxy event with JWT authoriser
 * @returns TenantContext with user actor
 * @throws UnauthorisedError if JWT claims are missing or invalid
 *
 * @example
 * ```typescript
 * export const handler = async (event: APIGatewayProxyEventV2WithJWT) => {
 *   const context = extractUserContext(event);
 *   // Use context for RLS, logging, etc.
 * };
 * ```
 */
export function extractUserContext(event: APIGatewayProxyEventV2WithJWT): TenantContext {
  const { authorizer } = event.requestContext;

  if (!hasJWTClaims(authorizer)) {
    throw new UnauthorisedError('No JWT claims found in request');
  }

  const { claims } = authorizer.jwt;

  // Validate required claims exist and are strings
  const sub = claims.sub;
  const role = claims[COGNITO_CUSTOM_ATTRIBUTES.ROLE];
  const email = claims.email;
  const tenantId = claims[COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID];

  if (!sub || typeof sub !== 'string') {
    throw new UnauthorisedError('Missing or invalid sub claim');
  }

  if (!role || typeof role !== 'string') {
    throw new UnauthorisedError('Missing or invalid role claim');
  }

  if (!email || typeof email !== 'string') {
    throw new UnauthorisedError('Missing or invalid email claim');
  }

  if (!tenantId || typeof tenantId !== 'string') {
    throw new UnauthorisedError('Missing or invalid tenantId claim');
  }

  return {
    actor: {
      type: 'user',
      userId: sub,
      userRole: role,
      email,
    },
    tenantId,
    customerId: claims[COGNITO_CUSTOM_ATTRIBUTES.CUSTOMER_ID] ?? null,
    requestId: event.requestContext.requestId,
    timestamp: new Date(),
  };
}

/**
 * Create context for system-triggered operations
 *
 * Creates a TenantContext with a SystemActor for background jobs, scheduled tasks,
 * or other system operations that aren't directly triggered by user requests.
 *
 * @param params - Parameters for creating the system context
 * @returns TenantContext with system actor
 *
 * @example
 * ```typescript
 * const context = createSystemContext({
 *   systemId: 'assessment-processor',
 *   tenantId: tenant.id,
 *   triggeredBy: userId, // Optional: if user initiated
 * });
 * ```
 */
export function createSystemContext(params: {
  systemId: string;
  tenantId: string;
  customerId?: string | null;
  triggeredBy?: string;
  jobId?: string;
}): TenantContext {
  // Validate required parameters
  if (!params.systemId || typeof params.systemId !== 'string') {
    throw new ValidationError('systemId is required and must be a non-empty string');
  }

  if (!params.tenantId || typeof params.tenantId !== 'string') {
    throw new ValidationError('tenantId is required and must be a non-empty string');
  }

  return {
    actor: {
      type: 'system',
      systemId: params.systemId,
      triggeredBy: params.triggeredBy,
      jobId: params.jobId,
    },
    tenantId: params.tenantId,
    customerId: params.customerId ?? null,
    requestId: randomUUID(),
    timestamp: new Date(),
  };
}

/**
 * Extract context from job queue message
 *
 * Convenience function for extracting context from SQS or other job queue messages.
 * Wraps createSystemContext with a job-specific interface.
 *
 * @param jobMessage - Job queue message with tenant and job information
 * @returns TenantContext with system actor
 *
 * @example
 * ```typescript
 * export const jobHandler = async (event: SQSEvent) => {
 *   const message = JSON.parse(event.Records[0].body);
 *   const context = extractJobContext(message);
 *   // Process job with context
 * };
 * ```
 */
export function extractJobContext(jobMessage: {
  tenantId: string;
  customerId?: string;
  userId?: string;
  jobId: string;
  jobType: string;
}): TenantContext {
  // Validate required fields from job message
  if (!jobMessage.jobId || typeof jobMessage.jobId !== 'string') {
    throw new ValidationError('Job message missing required field: jobId');
  }

  if (!jobMessage.jobType || typeof jobMessage.jobType !== 'string') {
    throw new ValidationError('Job message missing required field: jobType');
  }

  if (!jobMessage.tenantId || typeof jobMessage.tenantId !== 'string') {
    throw new ValidationError('Job message missing required field: tenantId');
  }

  return createSystemContext({
    systemId: jobMessage.jobType,
    tenantId: jobMessage.tenantId,
    customerId: jobMessage.customerId,
    triggeredBy: jobMessage.userId,
    jobId: jobMessage.jobId,
  });
}

/**
 * Type guard to check if an actor is a user actor
 *
 * @param actor - Actor to check
 * @returns True if actor is a UserActor
 */
export function isUserActor(actor: Actor): actor is UserActor {
  return actor.type === 'user';
}

/**
 * Type guard to check if an actor is a system actor
 *
 * @param actor - Actor to check
 * @returns True if actor is a SystemActor
 */
export function isSystemActor(actor: Actor): actor is SystemActor {
  return actor.type === 'system';
}

/**
 * Get a human-readable display name for an actor
 *
 * Used for logging and audit trails to identify who performed an operation.
 *
 * @param actor - Actor to get display name for
 * @returns Human-readable display name
 *
 * @example
 * ```typescript
 * const displayName = getActorDisplayName(context.actor);
 * // User: "john@example.com (customer_owner)"
 * // System: "System: assessment-processor"
 * ```
 */
export function getActorDisplayName(actor: Actor): string {
  if (isUserActor(actor)) {
    return `${actor.email} (${actor.userRole})`;
  }
  return `System: ${actor.systemId}`;
}

/**
 * Extract and resolve userId from TenantContext
 *
 * Resolves the Cognito sub (from JWT) to the database user ID.
 * Use this in services that require user-initiated operations.
 *
 * @param context - Tenant context to extract and resolve userId from
 * @returns The user's database ID
 * @throws UnauthorisedError if actor is not a user or user not found in database
 *
 * @example
 * ```typescript
 * const userId = await getUserIdFromContext(context);
 * await userAssessmentRepository.findResumable(context.tenantId, userId, flowId);
 * ```
 */
export async function getUserIdFromContext(context: TenantContext): Promise<string> {
  if (!isUserActor(context.actor)) {
    throw new UnauthorisedError('This operation requires a user context');
  }

  const cognitoSub = context.actor.userId;
  const user = await userRepository.findUserByCognitoSub(context.tenantId, cognitoSub);

  if (!user) {
    throw new UnauthorisedError('User not found in database');
  }

  return user.id;
}
