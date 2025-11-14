export const APP_NAME = 'FFP - Fitness & Physiotherapy Platform';
export const APP_VERSION = '0.0.1';

/**
 * Platform tenant ID for system administrators
 *
 * System administrators don't belong to a specific customer tenant.
 * They use this special "platform" tenant ID which grants them access
 * to all tenants via RLS policy bypass.
 *
 * Note: This is a reserved tenant ID and should never be used for
 * regular customer tenants.
 */
export const PLATFORM_TENANT_ID = 'platform';

export const COGNITO_CUSTOM_ATTRIBUTES = {
  TENANT_ID: 'custom:tenantId',
  CUSTOMER_ID: 'custom:customerId',
  ROLE: 'custom:role',
} as const;

/**
 * User role constants
 *
 * IMPORTANT: Keep in sync with userRoleSchema in ../schemas/user.schema.ts
 * The Zod schema is the single source of truth for user roles.
 * Use these constants for programmatic access, UserRole type for typing.
 */
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  CUSTOMER_OWNER: 'customer_owner',
  CUSTOMER_ADMIN: 'customer_admin',
  CUSTOMER_USER: 'customer_user',
  INDIVIDUAL_USER: 'individual_user',
} as const;

/**
 * @deprecated Use UserRole from @ffp/core instead (derived from Zod schema)
 * This type is kept for backwards compatibility but will be removed in future.
 */
export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Tenant type constants
 *
 * IMPORTANT: Keep in sync with tenantTypeSchema in ../schemas/tenant.schema.ts
 * The Zod schema is the single source of truth for tenant types.
 * Use these constants for programmatic access, TenantType type for typing.
 */
export const TENANT_TYPES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  PLATFORM: 'platform',
} as const;

/**
 * @deprecated Use TenantType from @ffp/core instead (derived from Zod schema)
 * This type is kept for backwards compatibility but will be removed in future.
 */
export type TenantTypeType = (typeof TENANT_TYPES)[keyof typeof TENANT_TYPES];

/**
 * @deprecated TENANT_STATUS constants are not used in current database schema
 * Tenants do not have a status field. This will be removed in future.
 * If you need customer status, use CUSTOMER_STATUS instead.
 */
export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
} as const;

/**
 * @deprecated TenantStatusType is not used in current database schema
 * This type is kept for backwards compatibility but will be removed in future.
 */
export type TenantStatusType = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

/**
 * Customer status constants
 *
 * IMPORTANT: Keep in sync with customerStatusSchema in ../schemas/customer.schema.ts
 * The Zod schema is the single source of truth for customer status.
 * Use these constants for programmatic access, CustomerStatus type for typing.
 */
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
} as const;

/**
 * @deprecated Use CustomerStatus from @ffp/core instead (derived from Zod schema)
 * This type is kept for backwards compatibility but will be removed in future.
 */
export type CustomerStatusType = (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS];
