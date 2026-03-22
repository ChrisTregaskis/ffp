import { z } from 'zod';

import { LOCATION_STATUSES } from '@ffp/database/constants';

import { paginationInputSchema, createPaginatedResponseSchema } from './pagination.schema';

export const locationStatusSchema = z.enum(LOCATION_STATUSES);

export const locationAddressSchema = z
  .object({
    line1: z.string().max(255).optional(),
    line2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    county: z.string().max(100).optional(),
    postcode: z.string().max(10).optional(),
    country: z.string().max(100).optional(),
  })
  .nullable()
  .optional();

export const locationSchema = z.object({
  id: z.guid(),
  organisationId: z.guid(),
  name: z.string().min(1).max(255),
  accountCode: z.string().min(1).max(50),
  address: locationAddressSchema,
  status: locationStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Note: For admin API location creation, use createLocationSchema from admin.schema.ts
 */
export const insertLocationSchema = locationSchema
  .pick({
    name: true,
    accountCode: true,
    address: true,
  })
  .extend({
    status: locationSchema.shape.status.optional().default('active'),
  });

export const updateLocationSchema = locationSchema
  .pick({
    name: true,
    address: true,
    status: true,
  })
  .partial();

/** Query parameters for GET /admin/locations */
export const locationListQuerySchema = paginationInputSchema.extend({
  /** Free-text search across name and account code */
  search: z.string().optional(),
  /** Filter by location status */
  status: locationStatusSchema.optional(),
  /** Filter by organisation ID */
  organisationId: z.string().optional(),
});

/** Response schema for location list items */
export const locationListResponseSchema = locationSchema.pick({
  id: true,
  organisationId: true,
  name: true,
  accountCode: true,
  status: true,
  createdAt: true,
});

/** Response schema for location detail (full record) */
export const locationDetailResponseSchema = locationSchema;

/** Paginated response schema for GET /admin/locations */
export const paginatedLocationResponseSchema = createPaginatedResponseSchema(
  locationListResponseSchema
);

/** Filter parameters extracted from query (excludes pagination) */
export const locationFilterSchema = z.object({
  search: z.string().optional(),
  status: locationStatusSchema.optional(),
  organisationId: z.string().optional(),
});

export type LocationStatus = z.infer<typeof locationStatusSchema>;
export type LocationAddress = z.infer<typeof locationAddressSchema>;
export type Location = z.infer<typeof locationSchema>;
export type InsertLocationInput = z.infer<typeof insertLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationListQuery = z.infer<typeof locationListQuerySchema>;
export type LocationListResponse = z.infer<typeof locationListResponseSchema>;
export type LocationDetailResponse = z.infer<typeof locationDetailResponseSchema>;
export type LocationFilterInput = z.infer<typeof locationFilterSchema>;
