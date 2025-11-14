import { z } from 'zod';

/**
 * Tenant type enumeration - Single source of truth for tenant types
 *
 * Defines the three types of tenants in the platform:
 * - individual: Single user account (physiotherapy client)
 * - business: Organisation with multiple sub-customers (clinics, gyms)
 * - platform: System platform tenant for super admins (internal use only)
 *
 * IMPORTANT: Keep PostgreSQL enum in @ffp/database/src/schema/tenants.ts in sync
 */
export const tenantTypeSchema = z.enum(['individual', 'business', 'platform']);

/**
 * TypeScript type derived from Zod schema
 * Use this across all packages for type-safe tenant type handling
 */
export type TenantType = z.infer<typeof tenantTypeSchema>;

/**
 * Tenant settings schema
 * Flexible JSON object for tenant-specific configuration
 */
export const tenantSettingsSchema = z.record(z.unknown()).default({});

/**
 * Full tenant schema representing a complete tenant record
 * Used for validation and type generation across the platform
 */
export const tenantSchema = z.object({
  id: z.string().uuid(),
  type: tenantTypeSchema,
  name: z.string().min(1).max(255),
  settings: tenantSettingsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * TypeScript type inferred from Zod schema
 * Single source of truth for Tenant type across all packages
 */
export type Tenant = z.infer<typeof tenantSchema>;

/**
 * Schema for creating a new tenant
 * Only includes fields that can be set during creation
 */
export const createTenantSchema = z.object({
  type: tenantTypeSchema,
  name: z.string().min(1).max(255),
  settings: tenantSettingsSchema.optional(),
});

/**
 * TypeScript type for tenant creation input
 */
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

/**
 * Schema for updating an existing tenant
 * All fields optional except those that shouldn't change
 */
export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  settings: tenantSettingsSchema.optional(),
});

/**
 * TypeScript type for tenant update input
 */
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
