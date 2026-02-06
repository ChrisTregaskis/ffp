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
