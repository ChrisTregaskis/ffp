import { and, eq, or, ilike, count, type Column, type SQL } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import { organisations, locations } from '@ffp/database/schema';
import type {
  Organisation as OrganisationRecord,
  Location as LocationRecord,
} from '@ffp/database/schema';

import { applyPagination, escapeLikePattern } from '../lib/pagination';
import { generateRandomAlphanumeric } from '../lib/random';

import type { LocationFilterInput, UpdateLocationInput } from '../schemas/location.schema';
import type { UpdateOrganisationInput } from '../schemas/organisation.schema';
import type { PaginationInput } from '../schemas/pagination.schema';

/**
 * Generate a unique account code from location name
 *
 * Creates a sanitised account code in the format: PREFIXRRRR
 * where PREFIX is exactly 6 characters derived from the location name
 * (uppercase, alphanumeric only, padded with zeros if needed)
 * and RRRR is a random 4-character alphanumeric suffix for uniqueness.
 *
 * @param locationName - The location name to generate code from
 * @returns Unique account code (e.g., "SUNSHI-F2R8", "ALF000-A3B9", "PI0000-M7K4")
 */
function generateAccountCode(locationName: string): string {
  // Extract alphanumeric characters and convert to uppercase
  const sanitized = locationName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Create exactly 6-character prefix, padding with zeros if needed
  const prefix = sanitized.substring(0, 6).padEnd(6, '0');

  // Generate random 4-character alphanumeric suffix
  const suffix = generateRandomAlphanumeric(4);

  return `${prefix}-${suffix}`;
}

/**
 * Result of creating a new organisation
 */
export interface CreateOrganisationResult {
  organisationId: string;
  name: string;
}

/**
 * Create a new organisation record
 *
 * This operation creates an organisation (type='business', status='active').
 * No RLS context is needed as this is a privileged operation performed by super admins.
 *
 * @param db - Database client with privileged access
 * @param organisationName - Name of the organisation
 * @returns Object containing organisationId and name
 */
export async function createOrganisation(
  db: DbClient,
  organisationName: string
): Promise<CreateOrganisationResult> {
  const [organisation] = await db
    .insert(organisations)
    .values({
      type: 'business',
      name: organisationName,
      status: 'active',
    })
    .returning();

  return {
    organisationId: organisation.id,
    name: organisation.name,
  };
}

/**
 * Result of creating a new location
 */
export interface CreateLocationResult {
  organisationId: string;
  locationId: string;
  accountCode: string;
}

/**
 * Create a new location under an existing organisation
 *
 * This operation creates a location record linked to an existing organisation.
 * No RLS context is needed as this is a privileged operation performed by super admins.
 *
 * @param db - Database client with privileged access
 * @param organisationId - ID of the parent organisation
 * @param locationName - Name of the location
 * @returns Object containing organisationId, locationId, and accountCode
 */
export async function createLocation(
  db: DbClient,
  organisationId: string,
  locationName: string
): Promise<CreateLocationResult> {
  // Generate unique account code
  const accountCode = generateAccountCode(locationName);

  const [location] = await db
    .insert(locations)
    .values({
      organisationId,
      name: locationName,
      accountCode,
      status: 'active',
    })
    .returning();

  return {
    organisationId,
    locationId: location.id,
    accountCode: location.accountCode,
  };
}

/**
 * List organisations with pagination and search.
 * No RLS — system_admin operates cross-organisation.
 */
export async function listOrganisations(
  db: DbClient,
  paginationInput: PaginationInput,
  filters: { search?: string; status?: string }
): Promise<OrganisationRecord[]> {
  const conditions: (SQL | undefined)[] = [];

  if (filters.search) {
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    conditions.push(ilike(organisations.name, pattern));
  }

  if (filters.status) {
    conditions.push(eq(organisations.status, filters.status as OrganisationRecord['status']));
  }

  const ORGANISATION_SORTABLE_COLUMNS: Partial<Record<string, Column>> = {
    name: organisations.name,
    status: organisations.status,
    createdAt: organisations.createdAt,
  };

  const query = db
    .select()
    .from(organisations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .$dynamic();

  return await applyPagination(query, paginationInput, ORGANISATION_SORTABLE_COLUMNS);
}

/**
 * Count organisations matching filter conditions (for pagination metadata).
 */
export async function countOrganisations(
  db: DbClient,
  filters: { search?: string; status?: string }
): Promise<number> {
  const conditions: (SQL | undefined)[] = [];

  if (filters.search) {
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    conditions.push(ilike(organisations.name, pattern));
  }

  if (filters.status) {
    conditions.push(eq(organisations.status, filters.status as OrganisationRecord['status']));
  }

  const result = await db
    .select({ count: count() })
    .from(organisations)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0].count;
}

/**
 * Get a single organisation by ID, or null if not found.
 */
export async function getOrganisationById(
  db: DbClient,
  organisationId: string
): Promise<OrganisationRecord | null> {
  const records = await db.select().from(organisations).where(eq(organisations.id, organisationId));

  return records[0] ?? null;
}

/**
 * Update an organisation record. Returns the updated record or null if not found.
 */
export async function updateOrganisation(
  db: DbClient,
  organisationId: string,
  data: UpdateOrganisationInput
): Promise<OrganisationRecord | null> {
  const records = await db
    .update(organisations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organisations.id, organisationId))
    .returning();

  return records[0] ?? null;
}

/** Columns available for sorting on the location list */
const LOCATION_SORTABLE_COLUMNS: Partial<Record<string, Column>> = {
  name: locations.name,
  accountCode: locations.accountCode,
  status: locations.status,
  createdAt: locations.createdAt,
};

/** Builds WHERE conditions from location filter parameters */
function buildLocationFilterConditions(filters: LocationFilterInput): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [];

  if (filters.search) {
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    conditions.push(or(ilike(locations.name, pattern), ilike(locations.accountCode, pattern)));
  }

  if (filters.status) {
    conditions.push(eq(locations.status, filters.status));
  }

  if (filters.organisationId) {
    conditions.push(eq(locations.organisationId, filters.organisationId));
  }

  return conditions;
}

/**
 * List locations with pagination, search, and status filter.
 * No RLS — system_admin operates cross-organisation.
 */
export async function listLocations(
  db: DbClient,
  paginationInput: PaginationInput,
  filters: LocationFilterInput
): Promise<LocationRecord[]> {
  const conditions = buildLocationFilterConditions(filters);

  const query = db
    .select()
    .from(locations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .$dynamic();

  return await applyPagination(query, paginationInput, LOCATION_SORTABLE_COLUMNS);
}

/**
 * Count locations matching filter conditions (for pagination metadata).
 */
export async function countLocations(db: DbClient, filters: LocationFilterInput): Promise<number> {
  const conditions = buildLocationFilterConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(locations)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0].count;
}

/**
 * Get a single location by ID, or null if not found.
 */
export async function getLocationById(
  db: DbClient,
  locationId: string
): Promise<LocationRecord | null> {
  const records = await db.select().from(locations).where(eq(locations.id, locationId));

  return records[0] ?? null;
}

/**
 * Update a location record. Returns the updated record or null if not found.
 */
export async function updateLocation(
  db: DbClient,
  locationId: string,
  data: UpdateLocationInput
): Promise<LocationRecord | null> {
  const records = await db
    .update(locations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(locations.id, locationId))
    .returning();

  return records[0] ?? null;
}
