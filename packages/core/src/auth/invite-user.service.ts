import { setRLSContext, withAdminContext } from '@ffp/database';
import { users } from '@ffp/database/schema';

import { getLocationById } from '../admin/admin.repository';
import { CognitoService } from '../lib/cognito';
import { isUserActor } from '../lib/context';
import { ForbiddenError, ValidationError } from '../lib/errors';
import { describeErrorForLog } from '../lib/log-safe-error';
import { createLogger } from '../lib/logger';
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
 * Refuse an organisation and location that don't belong together before any login is created:
 * the user's composite key would refuse the insert anyway, but only after the Cognito invite.
 */
async function assertLocationInOrganisation(
  ctx: RequestContext,
  organisationId: string,
  locationId: string
): Promise<void> {
  const location = await withAdminContext(ctx.db, async (tx) => getLocationById(tx, locationId));

  if (location?.organisationId !== organisationId) {
    throw new ValidationError('The location does not belong to the organisation', {
      organisationId,
      locationId,
    });
  }
}

/**
 * Invite a new user to the platform
 *
 * Creates both Cognito user (with temporary password) and database record.
 * If database insert fails, rolls back Cognito user creation.
 *
 * @param ctx - Request context with organisation information
 * @param input - User invitation data
 * @returns Invitation response with user details
 * @throws {ForbiddenError} If user lacks required role
 * @throws {ValidationError} If system admin doesn't provide organisation/location IDs, or names a
 *   location outside the organisation
 */
export async function inviteUserService(
  ctx: RequestContext,
  input: InviteUserInput
): Promise<InviteUserResponse> {
  const logger = createLogger(ctx.organisationContext);

  logger.info('Invite user request', {
    role: isUserActor(ctx.organisationContext.actor)
      ? ctx.organisationContext.actor.userRole
      : 'system',
    targetRole: input.role,
  });

  // Validate role: customer_owner OR system_admin
  if (!isUserActor(ctx.organisationContext.actor)) {
    throw new ForbiddenError('Only authenticated users can invite other users');
  }

  if (
    ctx.organisationContext.actor.userRole !== 'customer_owner' &&
    ctx.organisationContext.actor.userRole !== 'system_admin'
  ) {
    logger.warn('Unauthorised invite attempt', {
      userId: ctx.organisationContext.actor.userId,
      role: ctx.organisationContext.actor.userRole,
    });

    throw new ForbiddenError('Only business owners or system admins can invite users');
  }

  // Determine target organisation/location based on role
  let targetOrganisationId: string;
  let targetLocationId: string;

  if (ctx.organisationContext.actor.userRole === 'system_admin') {
    // System admin must provide organisation and location in request
    if (!input.organisationId || !input.locationId) {
      throw new ValidationError(
        'System admins must provide organisationId and locationId when inviting users'
      );
    }

    targetOrganisationId = input.organisationId;
    targetLocationId = input.locationId;

    await assertLocationInOrganisation(ctx, targetOrganisationId, targetLocationId);

    logger.info('System admin inviting user to organisation', {
      targetOrganisationId,
      targetLocationId,
    });
  } else {
    // Customer owner uses their own organisation/location from JWT
    if (!ctx.organisationId || !ctx.locationId) {
      throw new ValidationError('Customer owner context missing organisationId or locationId');
    }

    targetOrganisationId = ctx.organisationId;
    targetLocationId = ctx.locationId;

    logger.info('Customer owner inviting user to their organisation', {
      targetOrganisationId,
      targetLocationId,
    });
  }

  let newUserId: string;

  try {
    // Create user in Cognito with temporary password
    const cognitoResult = await CognitoService.inviteUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      organisationId: targetOrganisationId,
      locationId: targetLocationId,
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
        // Set RLS context for organisation isolation
        await setRLSContext(tx, targetOrganisationId, ctx.userId);

        await tx.insert(users).values({
          organisationId: targetOrganisationId,
          locationId: targetLocationId,
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
        ...describeErrorForLog(dbError),
      });

      await CognitoService.deleteUser(newUserId);

      throw dbError;
    }
  } catch (error) {
    logger.error('Invite user failed', describeErrorForLog(error));

    throw error;
  }

  logger.info('User invited successfully', {
    newUserId,
    organisationId: targetOrganisationId,
    locationId: targetLocationId,
    role: input.role,
    inviterRole: isUserActor(ctx.organisationContext.actor)
      ? ctx.organisationContext.actor.userRole
      : 'system',
  });

  return {
    message: 'User invited successfully. They will receive an email with temporary password.',
    userId: newUserId,
    email: input.email,
  };
}
