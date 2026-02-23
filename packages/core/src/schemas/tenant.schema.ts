import { z } from 'zod';

import { TENANT_TYPES } from '@ffp/database/constants';

export const tenantTypeSchema = z.enum(TENANT_TYPES);

/**
 * Tenant settings schema
 * Flexible JSON object for tenant-specific configuration
 */
export const tenantSettingsSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Full tenant schema representing a complete tenant record
 * Used for validation and type generation across the platform
 */
export const tenantSchema = z.object({
  id: z.guid(),
  type: tenantTypeSchema,
  name: z.string().min(1).max(255),
  settings: tenantSettingsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTenantSchema = tenantSchema.pick({
  type: true,
  name: true,
  settings: true,
});

export const updateTenantSchema = tenantSchema
  .pick({
    name: true,
    settings: true,
  })
  .partial();

export type TenantType = z.infer<typeof tenantTypeSchema>;
export type Tenant = z.infer<typeof tenantSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
