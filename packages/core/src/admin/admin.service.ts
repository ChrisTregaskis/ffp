import { getDb, withAdminContext } from '@ffp/database';

import { NotFoundError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import {
  locationListResponseSchema,
  locationDetailResponseSchema,
  updateLocationSchema,
  locationFilterSchema,
} from '../schemas/location.schema';
import {
  organisationListResponseSchema,
  organisationDetailResponseSchema,
  updateOrganisationSchema,
} from '../schemas/organisation.schema';
import { buildPaginationMeta } from '../schemas/pagination.schema';

import {
  createOrganisation as createOrganisationInRepo,
  createLocation as createLocationInRepo,
  listOrganisations as listOrganisationsInRepo,
  countOrganisations as countOrganisationsInRepo,
  getOrganisationById as getOrganisationByIdInRepo,
  getOrganisationByPublicId as getOrganisationByPublicIdInRepo,
  updateOrganisation as updateOrganisationInRepo,
  listLocations as listLocationsInRepo,
  countLocations as countLocationsInRepo,
  getLocationByPublicId as getLocationByPublicIdInRepo,
  updateLocation as updateLocationInRepo,
} from './admin.repository';

import type { OrganisationContext } from '../lib/context';
import type { RequestContext } from '../lib/request-context';
import type {
  CreateOrganisationInput,
  CreateOrganisationResponse,
  CreateLocationInput,
  CreateLocationResponse,
} from '../schemas/admin.schema';
import type { LocationListResponse, LocationDetailResponse } from '../schemas/location.schema';
import type {
  OrganisationListResponse,
  OrganisationDetailResponse,
} from '../schemas/organisation.schema';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';

/**
 * Create a new organisation
 *
 * This is a privileged operation that bypasses RLS. The handler
 * should validate that the requesting user has system_admin role.
 */
export async function createOrganisationService(
  ctx: RequestContext,
  input: CreateOrganisationInput
): Promise<CreateOrganisationResponse> {
  const logger = createLogger(ctx.organisationContext);

  logger.info('Starting organisation creation', {
    organisationName: input.organisationName,
  });

  const db = getDb();
  const result = await withAdminContext(db, async (tx) => {
    return await createOrganisationInRepo(tx, input.organisationName);
  });

  logger.info('Organisation created successfully', {
    organisationId: result.organisationId,
  });

  return {
    organisationId: result.organisationId,
    organisationName: input.organisationName,
  };
}

/**
 * List organisations with pagination and search.
 * Uses admin context to bypass RLS for cross-organisation visibility.
 */
export async function listOrganisationsService(
  ctx: OrganisationContext,
  paginationInput: PaginationInput,
  rawFilters: { search?: string; status?: string }
): Promise<{ data: OrganisationListResponse[]; pagination: PaginationMeta }> {
  const db = getDb();

  const { records, total } = await withAdminContext(db, async (tx) => {
    const records = await listOrganisationsInRepo(tx, paginationInput, rawFilters);
    const total = await countOrganisationsInRepo(tx, rawFilters);

    return { records, total };
  });

  const logger = createLogger(ctx);
  logger.info('Organisations listed', {
    action: 'organisations_listed',
    total,
    page: paginationInput.page,
    filters: rawFilters,
  });

  return {
    data: records.map((record) => organisationListResponseSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/**
 * Get a single organisation by public ID. Throws NotFoundError if not found.
 * Uses admin context to bypass RLS for cross-organisation visibility.
 */
export async function getOrganisationService(
  ctx: OrganisationContext,
  publicId: string
): Promise<OrganisationDetailResponse> {
  const db = getDb();

  const organisation = await withAdminContext(db, async (tx) => {
    return await getOrganisationByPublicIdInRepo(tx, publicId);
  });

  if (!organisation) {
    throw new NotFoundError('Organisation', publicId);
  }

  const logger = createLogger(ctx);
  logger.info('Organisation retrieved', {
    action: 'organisation_retrieved',
    publicId,
  });

  return organisationDetailResponseSchema.parse(organisation);
}

/**
 * Update an organisation record. Throws NotFoundError if not found.
 * Uses admin context to bypass RLS for cross-organisation visibility.
 */
export async function updateOrganisationService(
  ctx: OrganisationContext,
  organisationId: string,
  input: unknown
): Promise<OrganisationDetailResponse> {
  const validated = updateOrganisationSchema.parse(input);
  const db = getDb();

  const updated = await withAdminContext(db, async (tx) => {
    return await updateOrganisationInRepo(tx, organisationId, validated);
  });

  if (!updated) {
    throw new NotFoundError('Organisation', organisationId);
  }

  const logger = createLogger(ctx);
  logger.info('Organisation updated', {
    action: 'organisation_updated',
    organisationId: updated.id,
    status: updated.status,
  });

  return organisationDetailResponseSchema.parse(updated);
}

/**
 * Create a new location under an existing organisation
 *
 * This is a privileged operation that bypasses RLS. The handler
 * should validate that the requesting user has system_admin role.
 */
export async function createLocationService(
  ctx: RequestContext,
  organisationId: string,
  input: CreateLocationInput
): Promise<CreateLocationResponse> {
  const logger = createLogger(ctx.organisationContext);

  // Verify organisation exists
  const db = getDb();
  const organisation = await withAdminContext(db, async (tx) => {
    return await getOrganisationByIdInRepo(tx, organisationId);
  });

  if (!organisation) {
    throw new NotFoundError('Organisation', organisationId);
  }

  logger.info('Starting location creation', {
    organisationId,
    locationName: input.locationName,
  });

  const result = await withAdminContext(db, async (tx) => {
    return await createLocationInRepo(tx, organisationId, input.locationName);
  });

  logger.info('Location created successfully', {
    organisationId: result.organisationId,
    locationId: result.locationId,
    accountCode: result.accountCode,
  });

  return {
    organisationId: result.organisationId,
    locationId: result.locationId,
    locationName: input.locationName,
    accountCode: result.accountCode,
  };
}

/**
 * List locations with pagination, search, and status filter.
 * Uses admin context to bypass RLS for cross-organisation visibility.
 */
export async function listLocationsService(
  ctx: OrganisationContext,
  paginationInput: PaginationInput,
  rawFilters: { search?: string; status?: string; organisationId?: string }
): Promise<{ data: LocationListResponse[]; pagination: PaginationMeta }> {
  const filters = locationFilterSchema.parse(rawFilters);
  const db = getDb();

  const { records, total } = await withAdminContext(db, async (tx) => {
    const records = await listLocationsInRepo(tx, paginationInput, filters);
    const total = await countLocationsInRepo(tx, filters);

    return { records, total };
  });

  const logger = createLogger(ctx);
  logger.info('Locations listed', {
    action: 'locations_listed',
    total,
    page: paginationInput.page,
    filters,
  });

  return {
    data: records.map((record) => locationListResponseSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/**
 * Get a single location by public ID. Throws NotFoundError if not found.
 * Uses admin context to bypass RLS for cross-organisation visibility.
 */
export async function getLocationService(
  ctx: OrganisationContext,
  publicId: string
): Promise<LocationDetailResponse> {
  const db = getDb();

  const location = await withAdminContext(db, async (tx) => {
    return await getLocationByPublicIdInRepo(tx, publicId);
  });

  if (!location) {
    throw new NotFoundError('Location', publicId);
  }

  const logger = createLogger(ctx);
  logger.info('Location retrieved', {
    action: 'location_retrieved',
    publicId,
  });

  return locationDetailResponseSchema.parse(location);
}

/**
 * Update a location record. Throws NotFoundError if not found.
 * Uses admin context to bypass RLS for cross-organisation visibility.
 */
export async function updateLocationService(
  ctx: OrganisationContext,
  locationId: string,
  input: unknown
): Promise<LocationDetailResponse> {
  const validated = updateLocationSchema.parse(input);
  const db = getDb();

  const updated = await withAdminContext(db, async (tx) => {
    return await updateLocationInRepo(tx, locationId, validated);
  });

  if (!updated) {
    throw new NotFoundError('Location', locationId);
  }

  const logger = createLogger(ctx);
  logger.info('Location updated', {
    action: 'location_updated',
    locationId: updated.id,
    status: updated.status,
  });

  return locationDetailResponseSchema.parse(updated);
}
