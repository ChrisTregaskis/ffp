import { z } from 'zod';

export const createOrganisationRequestSchema = z.object({
  organisationName: z
    .string()
    .min(2, 'Organisation name is required')
    .max(255, 'Organisation name must not exceed 255 characters')
    .trim(),
});

export const createOrganisationResponseSchema = z.object({
  organisationId: z.guid(),
  organisationName: z.string(),
});

export const createLocationRequestSchema = z.object({
  locationName: z
    .string()
    .min(2, 'Location name is required')
    .max(255, 'Location name must not exceed 255 characters')
    .trim(),
});

export const createLocationResponseSchema = z.object({
  organisationId: z.guid(),
  locationId: z.guid(),
  locationName: z.string(),
  accountCode: z.string(),
});

export type CreateOrganisationInput = z.infer<typeof createOrganisationRequestSchema>;
export type CreateOrganisationResponse = z.infer<typeof createOrganisationResponseSchema>;
export type CreateLocationInput = z.infer<typeof createLocationRequestSchema>;
export type CreateLocationResponse = z.infer<typeof createLocationResponseSchema>;
