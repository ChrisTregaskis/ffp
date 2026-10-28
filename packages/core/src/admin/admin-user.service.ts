import { getDb, withAdminContext } from '@ffp/database';
import { levelForProgrammeSlug } from '@ffp/database/constants';

import { CognitoService } from '../lib/cognito';
import { ConflictError, InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import { describeErrorForLog } from '../lib/log-safe-error';
import { createLogger } from '../lib/logger';
import { getFullProgrammeDetailForUser } from '../programmes/programme.service';
import { buildPaginationMeta } from '../schemas/pagination.schema';
import {
  adminCreateUserInputSchema,
  adminUpdateUserInputSchema,
  userDetailResponseSchema,
  userFilterSchema,
  userListResponseSchema,
} from '../schemas/user.schema';

import {
  listUsers as listUsersInRepo,
  countUsers as countUsersInRepo,
  getUserByPublicId as getUserByPublicIdInRepo,
  getUserByEmail as getUserByEmailInRepo,
  createUser as createUserInRepo,
  updateUser as updateUserInRepo,
} from './admin-user.repository';
import { getLocationById as getLocationByIdInRepo } from './admin.repository';

import type { OrganisationContext } from '../lib/context';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';
import type { AdminProgrammeDetailResponse } from '../schemas/programme/programme.schema';
import type { UserListResponse, UserDetailResponse } from '../schemas/user.schema';

/**
 * List programme users with pagination, search, and location filter.
 * Uses admin context to bypass organisation RLS for cross-organisation visibility.
 */
export async function listUsersService(
  ctx: OrganisationContext,
  paginationInput: PaginationInput,
  rawFilters: { search?: string; locationId?: string; role?: string }
): Promise<{ data: UserListResponse[]; pagination: PaginationMeta }> {
  const filters = userFilterSchema.parse(rawFilters);
  const db = getDb();

  const { records, total } = await withAdminContext(db, async (tx) => {
    const records = await listUsersInRepo(tx, paginationInput, filters);
    const total = await countUsersInRepo(tx, filters);

    return { records, total };
  });

  const logger = createLogger(ctx);
  // The search text can be a member's name or email, so only whether one was given
  logger.info('Users listed', {
    action: 'users_listed',
    total,
    page: paginationInput.page,
    filters: {
      locationId: filters.locationId,
      hasSearch: filters.search !== undefined && filters.search !== '',
    },
  });

  return {
    data: records.map(({ programmeSlug, ...record }) =>
      userListResponseSchema.parse({
        ...record,
        programmeLevel: programmeSlug ? levelForProgrammeSlug(programmeSlug) : null,
      })
    ),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/**
 * Get a single programme user by public ID. Throws NotFoundError if not found.
 * Uses admin context to bypass organisation RLS for cross-organisation visibility.
 */
export async function getUserService(
  ctx: OrganisationContext,
  publicId: string
): Promise<UserDetailResponse> {
  const db = getDb();

  const user = await withAdminContext(db, async (tx) => {
    return await getUserByPublicIdInRepo(tx, publicId);
  });

  if (!user) {
    throw new NotFoundError('User', publicId);
  }

  const logger = createLogger(ctx);
  logger.info('User retrieved', {
    action: 'user_retrieved',
    publicId,
  });

  return userDetailResponseSchema.parse(user);
}

/**
 * A member's current programme with every phase in full. The user is found under admin context,
 * then the programme is read under the user's own organisation (taken from their row, never
 * the request), so no member table below `programmes` needs an admin bypass.
 * Throws NotFoundError when the user or their programme does not exist.
 */
export async function getUserProgrammeService(
  ctx: OrganisationContext,
  publicId: string
): Promise<AdminProgrammeDetailResponse> {
  const user = await withAdminContext(getDb(), async (tx) => {
    return await getUserByPublicIdInRepo(tx, publicId);
  });

  if (!user) {
    throw new NotFoundError('User', publicId);
  }

  const detail = await getFullProgrammeDetailForUser(user.organisationId, user.id);

  const logger = createLogger(ctx);
  logger.info('User programme retrieved', {
    action: 'user_programme_retrieved',
    publicId,
    organisationId: user.organisationId,
  });

  return detail;
}

/**
 * Create a programme user with Cognito provisioning.
 *
 * Orchestrates:
 * 1. Validate input
 * 2. Verify location exists (derive organisationId)
 * 3. Check email uniqueness
 * 4. Create Cognito user with custom attributes
 * 5. Create DB record with cognitoSub
 * 6. Rollback Cognito user if DB insert fails
 */
export async function createUserService(
  ctx: OrganisationContext,
  input: unknown
): Promise<UserDetailResponse> {
  const validated = adminCreateUserInputSchema.parse(input);
  const logger = createLogger(ctx);
  const db = getDb();

  // Step 1: Verify location exists and get organisationId
  const location = await withAdminContext(db, async (tx) => {
    return await getLocationByIdInRepo(tx, validated.locationId);
  });

  if (!location) {
    throw new ValidationError('Location not found', { locationId: validated.locationId });
  }

  const organisationId = location.organisationId;

  // Step 2: Check email uniqueness
  const existingUser = await withAdminContext(db, async (tx) => {
    return await getUserByEmailInRepo(tx, validated.email);
  });

  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  // Step 3: Create Cognito user
  logger.info('Creating Cognito user', {
    action: 'cognito_user_creating',
    locationId: validated.locationId,
    organisationId,
  });

  let cognitoSub: string;

  try {
    const cognitoResponse = await CognitoService.inviteUser({
      email: validated.email,
      firstName: validated.firstName,
      lastName: validated.lastName,
      organisationId,
      locationId: validated.locationId,
      role: 'programme_user',
    });

    cognitoSub = cognitoResponse.User?.Username ?? '';

    if (!cognitoSub) {
      throw new InternalServerError('Cognito user creation did not return a username');
    }
  } catch (cognitoError) {
    // Surface Cognito-specific errors as user-friendly messages
    if (cognitoError instanceof Error && cognitoError.name === 'UsernameExistsException') {
      throw new ConflictError('A user with this email already exists in the authentication system');
    }

    if (cognitoError instanceof Error && cognitoError.name === 'AccessDeniedException') {
      logger.error('Cognito permission denied — check Lambda IAM policy', {
        action: 'cognito_access_denied',
        ...describeErrorForLog(cognitoError),
      });
      throw new InternalServerError('Unable to create user — service configuration error');
    }

    logger.error('Unexpected Cognito error during user creation', {
      action: 'cognito_unexpected_error',
      ...describeErrorForLog(cognitoError),
    });
    throw new InternalServerError('Unable to create user — an unexpected error occurred');
  }

  logger.info('Cognito user created', {
    action: 'cognito_user_created',
    cognitoSub,
  });

  // Step 4: Create DB record, rolling the Cognito user back only if the insert fails
  let user: Awaited<ReturnType<typeof createUserInRepo>>;

  try {
    user = await withAdminContext(db, async (tx) => {
      return await createUserInRepo(tx, {
        organisationId,
        email: validated.email,
        cognitoSub,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: 'programme_user',
        locationId: validated.locationId,
        phone: validated.phone,
        dateOfBirth: validated.dateOfBirth,
      });
    });
  } catch (dbError) {
    // Rollback: delete Cognito user if DB insert fails
    logger.error('DB insert failed, rolling back Cognito user', {
      action: 'cognito_user_rollback',
      cognitoSub,
      ...describeErrorForLog(dbError),
    });

    try {
      await CognitoService.deleteUser(validated.email);
      logger.info('Cognito user rolled back successfully', {
        action: 'cognito_user_rollback_success',
        cognitoSub,
      });
    } catch (rollbackError) {
      // An operator finds the orphaned login by this sub (its Cognito username)
      logger.error('Cognito rollback failed — orphaned Cognito user', {
        action: 'cognito_user_rollback_failed',
        cognitoSub,
        rollbackError: describeErrorForLog(rollbackError),
      });
    }

    throw dbError;
  }

  logger.info('Programme user created', {
    action: 'user_created',
    userId: user.id,
    cognitoSub,
    locationId: validated.locationId,
    organisationId,
  });

  return userDetailResponseSchema.parse(user);
}

/**
 * Update a programme user. Throws NotFoundError if not found.
 * Uses admin context to bypass organisation RLS for cross-organisation visibility.
 */
export async function updateUserService(
  ctx: OrganisationContext,
  userId: string,
  input: unknown
): Promise<UserDetailResponse> {
  const validated = adminUpdateUserInputSchema.parse(input);
  const db = getDb();

  const updated = await withAdminContext(db, async (tx) => {
    return await updateUserInRepo(tx, userId, validated);
  });

  if (!updated) {
    throw new NotFoundError('User', userId);
  }

  const logger = createLogger(ctx);
  logger.info('User updated', {
    action: 'user_updated',
    userId: updated.id,
  });

  return userDetailResponseSchema.parse(updated);
}
