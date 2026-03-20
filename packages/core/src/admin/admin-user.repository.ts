import { and, eq, or, ilike, inArray, count, type Column, type SQL } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import { USER_ROLES, type UserRole } from '@ffp/database/constants';
import { users, customers, type NewUser } from '@ffp/database/schema';

import { formatDateOnly } from '../lib/date';
import { InternalServerError } from '../lib/errors';
import { applyPagination, escapeLikePattern } from '../lib/pagination';

import type { PaginationInput } from '../schemas/pagination.schema';
import type { UserFilterInput, AdminUpdateUserInput } from '../schemas/user.schema';

/** Columns available for sorting on the admin user list */
const USER_SORTABLE_COLUMNS: Partial<Record<string, Column>> = {
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  createdAt: users.createdAt,
};

/** Row type returned by list query (user fields + customerName from join) */
export interface UserWithCustomerName {
  id: string;
  tenantId: string;
  email: string;
  cognitoSub: string;
  firstName: string;
  lastName: string;
  role: string;
  customerId: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerName: string | null;
}

/** Input for creating a user record in the database */
export interface CreateUserDbInput {
  tenantId: string;
  email: string;
  cognitoSub: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  customerId: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
}

/** Builds WHERE conditions from user filter parameters */
function buildUserFilterConditions(filters: UserFilterInput): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [];

  if (filters.search) {
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    conditions.push(
      or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern)
      )
    );
  }

  if (filters.customerId) {
    conditions.push(eq(users.customerId, filters.customerId));
  }

  if (filters.role) {
    const roles = filters.role
      .split(',')
      .map((r) => r.trim())
      .filter((r): r is UserRole => (USER_ROLES as readonly string[]).includes(r));

    if (roles.length === 1) {
      conditions.push(eq(users.role, roles[0]));
    } else if (roles.length > 1) {
      conditions.push(inArray(users.role, roles));
    }
  }

  return conditions;
}

/**
 * List users with pagination, search, and customer filter.
 * Joins customers table for customerName.
 */
export async function listUsers(
  db: DbClient,
  paginationInput: PaginationInput,
  filters: UserFilterInput
): Promise<UserWithCustomerName[]> {
  const conditions = buildUserFilterConditions(filters);

  const query = db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      cognitoSub: users.cognitoSub,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      customerId: users.customerId,
      profileImageUrl: users.profileImageUrl,
      phone: users.phone,
      dateOfBirth: users.dateOfBirth,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      customerName: customers.name,
    })
    .from(users)
    .leftJoin(customers, eq(users.customerId, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .$dynamic();

  return (await applyPagination(
    query,
    paginationInput,
    USER_SORTABLE_COLUMNS
  )) as UserWithCustomerName[];
}

/**
 * Count users matching filter conditions (for pagination metadata).
 */
export async function countUsers(db: DbClient, filters: UserFilterInput): Promise<number> {
  const conditions = buildUserFilterConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0].count;
}

/**
 * Get a single user by ID with customer name. Returns null if not found.
 */
export async function getUserById(
  db: DbClient,
  userId: string
): Promise<UserWithCustomerName | null> {
  const records = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      cognitoSub: users.cognitoSub,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      customerId: users.customerId,
      profileImageUrl: users.profileImageUrl,
      phone: users.phone,
      dateOfBirth: users.dateOfBirth,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      customerName: customers.name,
    })
    .from(users)
    .leftJoin(customers, eq(users.customerId, customers.id))
    .where(eq(users.id, userId));

  const record = records[0] as UserWithCustomerName | undefined;

  return record ?? null;
}

/**
 * Find a user by email (for duplicate check). Returns the user record or null.
 */
export async function getUserByEmail(
  db: DbClient,
  email: string
): Promise<{ id: string; email: string } | null> {
  const records = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return records[0] ?? null;
}

/**
 * Insert a new user record. Returns the created record with customer name.
 */
export async function createUser(
  db: DbClient,
  data: CreateUserDbInput
): Promise<UserWithCustomerName> {
  const [inserted] = await db
    .insert(users)
    .values({
      tenantId: data.tenantId,
      email: data.email,
      cognitoSub: data.cognitoSub,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      customerId: data.customerId,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ? formatDateOnly(data.dateOfBirth) : null,
    })
    .returning();

  // Re-fetch with customer name join
  const result = await getUserById(db, inserted.id);

  if (!result) {
    throw new InternalServerError('Failed to fetch newly created user');
  }

  return result;
}

/**
 * Update a user record. Returns the updated record with customer name, or null if not found.
 */
export async function updateUser(
  db: DbClient,
  userId: string,
  data: AdminUpdateUserInput
): Promise<UserWithCustomerName | null> {
  const setData: Partial<NewUser> = { updatedAt: new Date() };

  if (data.firstName !== undefined) {
    setData.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    setData.lastName = data.lastName;
  }

  if (data.phone !== undefined) {
    setData.phone = data.phone;
  }

  if (data.dateOfBirth !== undefined) {
    setData.dateOfBirth = data.dateOfBirth ? formatDateOnly(data.dateOfBirth) : null;
  }

  const records = await db.update(users).set(setData).where(eq(users.id, userId)).returning();

  if (!records[0]) {
    return null;
  }

  // Re-fetch with customer name join
  return await getUserById(db, records[0].id);
}
