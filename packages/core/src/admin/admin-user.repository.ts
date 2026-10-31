import { and, desc, eq, or, ilike, inArray, count, sql, type Column, type SQL } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import type { ProgrammeStatus, UserRole } from '@ffp/database/constants';
import {
  users,
  locations,
  programmes,
  processJobs,
  programmeTemplates,
  type NewUser,
} from '@ffp/database/schema';

import {
  GENERATE_USER_KEY,
  latestProgrammeGenerationFailed,
} from '../jobs/programme-generation-failure';
import { formatDateOnly } from '../lib/date';
import { InternalServerError } from '../lib/errors';
import {
  applyPagination,
  escapeLikePattern,
  NEWEST_FIRST,
  withDefaultSort,
} from '../lib/pagination';
import { isCurrentProgramme } from '../programmes/current-programme';

import type { PaginationInput } from '../schemas/pagination.schema';
import type { UserFilterInput, AdminUpdateUserInput } from '../schemas/user.schema';

/** Columns available for sorting on the admin user list */
const USER_SORTABLE_COLUMNS: Partial<Record<string, Column | Column[]>> = {
  firstName: users.firstName,
  lastName: users.lastName,
  fullName: [users.lastName, users.firstName],
  email: users.email,
  createdAt: users.createdAt,
};

/** Row type returned by list query (user fields + locationName from join) */
export interface UserWithLocationName {
  id: string;
  publicId: string;
  organisationId: string;
  email: string;
  cognitoSub: string;
  firstName: string;
  lastName: string;
  role: string;
  locationId: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: Date;
  updatedAt: Date;
  locationName: string | null;
}

/** Shared column selection for user queries that join location name */
const userWithLocationColumns = {
  id: users.id,
  publicId: users.publicId,
  organisationId: users.organisationId,
  email: users.email,
  cognitoSub: users.cognitoSub,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  locationId: users.locationId,
  profileImageUrl: users.profileImageUrl,
  phone: users.phone,
  dateOfBirth: users.dateOfBirth,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  locationName: locations.name,
};

/** Input for creating a user record in the database */
export interface CreateUserDbInput {
  organisationId: string;
  email: string;
  cognitoSub: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  locationId: string;
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

  if (filters.locationId) {
    conditions.push(eq(users.locationId, filters.locationId));
  }

  if (filters.role) {
    conditions.push(inArray(users.role, filters.role));
  }

  return conditions;
}

/** A user list row: the user, their location name and their current programme */
export interface UserListRow extends UserWithLocationName {
  programmeName: string | null;
  programmeSlug: string | null;
  programmeStatus: ProgrammeStatus | null;
  generationFailed: boolean;
}

/**
 * List users with pagination, search, and location filter, each with their location name and
 * current programme. Programme columns need the admin read bypass on `programmes`; without it
 * the join silently comes back empty.
 */
export async function listUsers(
  db: DbClient,
  paginationInput: PaginationInput,
  filters: UserFilterInput
): Promise<UserListRow[]> {
  const conditions = buildUserFilterConditions(filters);

  // The id breaks a tie on creation time, as in the programme read
  const currentProgramme = db
    .select({
      status: programmes.status,
      programmeTemplateId: programmes.programmeTemplateId,
    })
    .from(programmes)
    .where(
      and(
        eq(programmes.userId, users.id),
        eq(programmes.organisationId, users.organisationId),
        isCurrentProgramme
      )
    )
    .orderBy(desc(programmes.createdAt), desc(programmes.id))
    .limit(1)
    .as('current_programme');

  const generationFailed = latestProgrammeGenerationFailed(
    sql`${processJobs.organisationId} = ${users.organisationId}
      and ${processJobs.payload}->>${GENERATE_USER_KEY} = ${users.id}::text`
  );

  const query = db
    .select({
      ...userWithLocationColumns,
      programmeName: programmeTemplates.name,
      programmeSlug: programmeTemplates.slug,
      programmeStatus: currentProgramme.status,
      generationFailed: generationFailed.as('generation_failed'),
    })
    .from(users)
    .leftJoin(locations, eq(users.locationId, locations.id))
    .leftJoinLateral(currentProgramme, sql`true`)
    .leftJoin(programmeTemplates, eq(programmeTemplates.id, currentProgramme.programmeTemplateId))
    .where(and(...conditions))
    .$dynamic();

  return (await applyPagination(
    query,
    withDefaultSort(paginationInput, USER_SORTABLE_COLUMNS, NEWEST_FIRST),
    USER_SORTABLE_COLUMNS,
    users.id
  )) as UserListRow[];
}

/**
 * Count users matching filter conditions (for pagination metadata).
 */
export async function countUsers(db: DbClient, filters: UserFilterInput): Promise<number> {
  const conditions = buildUserFilterConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(users)
    .where(and(...conditions));

  return result[0].count;
}

/**
 * Get a single user by ID with location name. Returns null if not found.
 */
export async function getUserById(
  db: DbClient,
  userId: string
): Promise<UserWithLocationName | null> {
  const records = await db
    .select(userWithLocationColumns)
    .from(users)
    .leftJoin(locations, eq(users.locationId, locations.id))
    .where(eq(users.id, userId));

  const record = records[0] as UserWithLocationName | undefined;

  return record ?? null;
}

/**
 * Get a single user by public ID with location name. Returns null if not found.
 */
export async function getUserByPublicId(
  db: DbClient,
  publicId: string
): Promise<UserWithLocationName | null> {
  const records = await db
    .select(userWithLocationColumns)
    .from(users)
    .leftJoin(locations, eq(users.locationId, locations.id))
    .where(eq(users.publicId, publicId));

  const record = records[0] as UserWithLocationName | undefined;

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
 * Insert a new user record. Returns the created record with location name.
 */
export async function createUser(
  db: DbClient,
  data: CreateUserDbInput
): Promise<UserWithLocationName> {
  const [inserted] = await db
    .insert(users)
    .values({
      organisationId: data.organisationId,
      email: data.email,
      cognitoSub: data.cognitoSub,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      locationId: data.locationId,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ? formatDateOnly(data.dateOfBirth) : null,
    })
    .returning();

  // Re-fetch with location name join
  const result = await getUserById(db, inserted.id);

  if (!result) {
    throw new InternalServerError('Failed to fetch newly created user');
  }

  return result;
}

/**
 * Update a user record. Returns the updated record with location name, or null if not found.
 */
export async function updateUser(
  db: DbClient,
  userId: string,
  data: AdminUpdateUserInput
): Promise<UserWithLocationName | null> {
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

  // Re-fetch with location name join
  return await getUserById(db, records[0].id);
}
