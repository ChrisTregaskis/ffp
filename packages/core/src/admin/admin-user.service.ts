import { getDb, withAdminContext } from '@ffp/database';

import { CognitoService } from '../lib/cognito';
import { ConflictError, InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import { createLogger } from '../lib/logger';
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
  getUserById as getUserByIdInRepo,
  getUserByEmail as getUserByEmailInRepo,
  createUser as createUserInRepo,
  updateUser as updateUserInRepo,
} from './admin-user.repository';
import { getCustomerById as getCustomerByIdInRepo } from './admin.repository';

import type { TenantContext } from '../lib/context';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';
import type { UserListResponse, UserDetailResponse } from '../schemas/user.schema';

/**
 * List programme users with pagination, search, and customer filter.
 * Uses admin context to bypass tenant RLS for cross-tenant visibility.
 */
export async function listUsersService(
  ctx: TenantContext,
  paginationInput: PaginationInput,
  rawFilters: { search?: string; customerId?: string }
): Promise<{ data: UserListResponse[]; pagination: PaginationMeta }> {
  const filters = userFilterSchema.parse(rawFilters);
  const db = getDb();

  const { records, total } = await withAdminContext(db, async (tx) => {
    const records = await listUsersInRepo(tx, paginationInput, filters);
    const total = await countUsersInRepo(tx, filters);

    return { records, total };
  });

  const logger = createLogger(ctx);
  logger.info('Users listed', {
    action: 'users_listed',
    total,
    page: paginationInput.page,
    filters,
  });

  return {
    data: records.map((record) => userListResponseSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/**
 * Get a single programme user by ID. Throws NotFoundError if not found.
 * Uses admin context to bypass tenant RLS for cross-tenant visibility.
 */
export async function getUserService(
  ctx: TenantContext,
  userId: string
): Promise<UserDetailResponse> {
  const db = getDb();

  const user = await withAdminContext(db, async (tx) => {
    return await getUserByIdInRepo(tx, userId);
  });

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  const logger = createLogger(ctx);
  logger.info('User retrieved', {
    action: 'user_retrieved',
    userId,
  });

  return userDetailResponseSchema.parse(user);
}

/**
 * Create a programme user with Cognito provisioning.
 *
 * Orchestrates:
 * 1. Validate input
 * 2. Verify customer exists (derive tenantId)
 * 3. Check email uniqueness
 * 4. Create Cognito user with custom attributes
 * 5. Create DB record with cognitoSub
 * 6. Rollback Cognito user if DB insert fails
 */
export async function createUserService(
  ctx: TenantContext,
  input: unknown
): Promise<UserDetailResponse> {
  const validated = adminCreateUserInputSchema.parse(input);
  const logger = createLogger(ctx);
  const db = getDb();

  // Step 1: Verify customer exists and get tenantId
  const customer = await withAdminContext(db, async (tx) => {
    return await getCustomerByIdInRepo(tx, validated.customerId);
  });

  if (!customer) {
    throw new ValidationError('Customer not found', { customerId: validated.customerId });
  }

  const tenantId = customer.tenantId;

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
    email: validated.email,
    customerId: validated.customerId,
    tenantId,
  });

  let cognitoSub: string;

  try {
    const cognitoResponse = await CognitoService.inviteUser({
      email: validated.email,
      firstName: validated.firstName,
      lastName: validated.lastName,
      tenantId,
      customerId: validated.customerId,
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
        error: cognitoError.message,
      });
      throw new InternalServerError('Unable to create user — service configuration error');
    }

    throw cognitoError;
  }

  logger.info('Cognito user created', {
    action: 'cognito_user_created',
    cognitoSub,
  });

  // Step 4: Create DB record (with rollback on failure)
  try {
    const user = await withAdminContext(db, async (tx) => {
      return await createUserInRepo(tx, {
        tenantId,
        email: validated.email,
        cognitoSub,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: 'programme_user',
        customerId: validated.customerId,
        phone: validated.phone,
        dateOfBirth: validated.dateOfBirth,
      });
    });

    logger.info('Programme user created', {
      action: 'user_created',
      userId: user.id,
      email: validated.email,
      customerId: validated.customerId,
      tenantId,
    });

    return userDetailResponseSchema.parse(user);
  } catch (dbError) {
    // Rollback: delete Cognito user if DB insert fails
    logger.error('DB insert failed, rolling back Cognito user', {
      action: 'cognito_user_rollback',
      cognitoSub,
      error: dbError instanceof Error ? dbError.message : 'Unknown error',
    });

    try {
      await CognitoService.deleteUser(validated.email);
      logger.info('Cognito user rolled back successfully', {
        action: 'cognito_user_rollback_success',
        cognitoSub,
      });
    } catch (rollbackError) {
      logger.error('Cognito rollback failed — orphaned Cognito user', {
        action: 'cognito_user_rollback_failed',
        cognitoSub,
        email: validated.email,
        rollbackError: rollbackError instanceof Error ? rollbackError.message : 'Unknown error',
      });
    }

    throw dbError;
  }
}

/**
 * Update a programme user. Throws NotFoundError if not found.
 * Uses admin context to bypass tenant RLS for cross-tenant visibility.
 */
export async function updateUserService(
  ctx: TenantContext,
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
