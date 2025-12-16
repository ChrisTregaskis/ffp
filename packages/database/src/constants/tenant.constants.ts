/**
 * Tenant constants - Single source of truth for tenant-related enums
 *
 * These constants are shared between:
 * - @ffp/database: PostgreSQL enum definitions (pgEnum)
 * - @ffp/core: Zod validation schemas (z.enum)
 *
 * IMPORTANT: When adding new tenant types:
 * 1. Update this file
 * 2. Run `pnpm db:generate` to create migration for enum changes
 * 3. Run `pnpm db:migrate` to apply changes
 * 4. Both database and Zod schemas will automatically use updated values
 */

/**
 * Tenant type values
 *
 * Defines the three types of tenants:
 * - individual: Single user account (physiotherapy client)
 * - business: Organisation with multiple sub-customers (clinics, gyms)
 * - platform: System platform tenant for super admins (internal use only)
 */
export const TENANT_TYPES = ['individual', 'business', 'platform'] as const;

export type TenantType = (typeof TENANT_TYPES)[number];
