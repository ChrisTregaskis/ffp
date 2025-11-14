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

export const TENANT_TYPES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  PLATFORM: 'platform',
} as const;

export type TenantTypeType = (typeof TENANT_TYPES)[keyof typeof TENANT_TYPES];

export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
} as const;

export type TenantStatusType = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];
