import { z } from 'zod';

import { ORGANISATION_TYPES, ORGANISATION_STATUSES } from '@ffp/database/constants';

export const organisationTypeSchema = z.enum(ORGANISATION_TYPES);
export const organisationStatusSchema = z.enum(ORGANISATION_STATUSES);

/**
 * Organisation settings schema
 * Flexible JSON object for organisation-specific configuration
 */
export const organisationSettingsSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Full organisation schema representing a complete organisation record
 * Used for validation and type generation across the platform
 */
export const organisationSchema = z.object({
  id: z.guid(),
  type: organisationTypeSchema,
  name: z.string().min(1).max(255),
  status: organisationStatusSchema,
  settings: organisationSettingsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createOrganisationSchema = organisationSchema.pick({
  name: true,
});

export const updateOrganisationSchema = organisationSchema
  .pick({
    name: true,
    status: true,
    settings: true,
  })
  .partial();

/** Response schema for organisation list items */
export const organisationListResponseSchema = organisationSchema.pick({
  id: true,
  name: true,
  status: true,
  createdAt: true,
});

/** Response schema for organisation detail (full record) */
export const organisationDetailResponseSchema = organisationSchema;

export type OrganisationType = z.infer<typeof organisationTypeSchema>;
export type OrganisationStatus = z.infer<typeof organisationStatusSchema>;
export type Organisation = z.infer<typeof organisationSchema>;
export type InsertOrganisationInput = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
export type OrganisationListResponse = z.infer<typeof organisationListResponseSchema>;
export type OrganisationDetailResponse = z.infer<typeof organisationDetailResponseSchema>;
