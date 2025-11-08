import { setRLSContext } from '@ffp/database';
import { users } from '@ffp/database/schema';

import { CognitoService } from '../lib/cognito';
import { isUserActor } from '../lib/context';
import { ForbiddenError, ValidationError } from '../lib/errors';
import { Logger } from '../lib/logger';
import { type RequestContext } from '../lib/request-context';
import { type InviteUserInput } from '../schemas/user.schema';

/**
 * Response from invite user operation
 */
export interface InviteUserResponse {
  message: string;
  userId: string;
  email: string;
}

/**
 * Invite a new user to the platform
 *
 * Creates both Cognito user (with temporary password) and database record.
 * If database insert fails, rolls back Cognito user creation.
 *
 * @param ctx - Request context with tenant information
 * @param input - User invitation data
 * @returns Invitation response with user details
 * @throws {ForbiddenError} If user lacks required role
 * @throws {BadRequestError} If system admin doesn't provide tenant/customer IDs
 */
export async function inviteUserService(
  ctx: RequestContext,
  input: InviteUserInput
): Promise<InviteUserResponse> {
  const logger = new Logger(ctx.tenantContext);

  logger.info('Invite user request', {
    role: isUserActor(ctx.tenantContext.actor) ? ctx.tenantContext.actor.userRole : 'system',
    targetRole: input.role,
  });

  // Validate role: customer_owner OR system_admin
  if (!isUserActor(ctx.tenantContext.actor)) {
    throw new ForbiddenError('Only authenticated users can invite other users');
  }

  if (
    ctx.tenantContext.actor.userRole !== 'customer_owner' &&
    ctx.tenantContext.actor.userRole !== 'system_admin'
  ) {
    logger.warn('Unauthorised invite attempt', {
      userId: ctx.tenantContext.actor.userId,
      role: ctx.tenantContext.actor.userRole,
    });

    throw new ForbiddenError('Only business owners or system admins can invite users');
  }

  // Determine target tenant/customer based on role
  let targetTenantId: string;
  let targetCustomerId: string;

  if (ctx.tenantContext.actor.userRole === 'system_admin') {
    // System admin must provide tenant and customer in request
    if (!input.tenantId || !input.customerId) {
      throw new ValidationError(
        'System admins must provide tenantId and customerId when inviting users'
      );
    }
    targetTenantId = input.tenantId;
    targetCustomerId = input.customerId;

    logger.info('System admin inviting user to tenant', {
      targetTenantId,
      targetCustomerId,
    });
  } else {
    // Customer owner uses their own tenant/customer from JWT
    if (!ctx.tenantId || !ctx.customerId) {
      throw new ValidationError('Customer owner context missing tenantId or customerId');
    }
    targetTenantId = ctx.tenantId;
    targetCustomerId = ctx.customerId;

    logger.info('Customer owner inviting user to their tenant', {
      targetTenantId,
      targetCustomerId,
    });
  }

  let newUserId: string;

  try {
    // Create user in Cognito with temporary password
    const cognitoResult = await CognitoService.inviteUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      tenantId: targetTenantId,
      customerId: targetCustomerId,
      role: input.role,
    });

    // Validate Cognito response
    if (!cognitoResult.User?.Username) {
      throw new Error('Cognito failed to return user information');
    }

    newUserId = cognitoResult.User.Username;

    logger.info('Cognito user created', { newUserId });

    // Store user in database with RLS context
    try {
      await ctx.db.transaction(async (tx) => {
        // Set RLS context for tenant isolation
        await setRLSContext(tx, targetTenantId, ctx.userId);

        await tx.insert(users).values({
          tenantId: targetTenantId,
          customerId: targetCustomerId,
          email: input.email,
          cognitoSub: newUserId,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
        });
      });

      logger.info('Database user record created', { newUserId });
    } catch (dbError) {
      // CRITICAL: Rollback Cognito user if database insert fails
      logger.error('Database insert failed, rolling back Cognito user', {
        newUserId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });

      await CognitoService.deleteUser(newUserId);

      throw dbError;
    }
  } catch (error) {
    logger.error('Invite user failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }

  logger.info('User invited successfully', {
    newUserId,
    tenantId: targetTenantId,
    customerId: targetCustomerId,
    role: input.role,
    inviterRole: isUserActor(ctx.tenantContext.actor) ? ctx.tenantContext.actor.userRole : 'system',
  });

  return {
    message: 'User invited successfully. They will receive an email with temporary password.',
    userId: newUserId,
    email: input.email,
  };
}
