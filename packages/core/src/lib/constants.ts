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
 *
 * Use these constants for programmatic comparisons (e.g., if (role === USER_ROLES.SYSTEM_ADMIN))
 * For typing, import UserRole type from @ffp/core schemas
 */
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  CUSTOMER_OWNER: 'customer_owner',
  CUSTOMER_ADMIN: 'customer_admin',
  CUSTOMER_USER: 'customer_user',
  INDIVIDUAL_USER: 'individual_user',
} as const;

/**
 * Tenant type constants
 *
 * IMPORTANT: Keep in sync with tenantTypeSchema in ../schemas/tenant.schema.ts
 * The Zod schema is the single source of truth for tenant types.
 *
 * Use these constants for programmatic comparisons (e.g., if (type === TENANT_TYPES.BUSINESS))
 * For typing, import TenantType type from @ffp/core schemas
 */
export const TENANT_TYPES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  PLATFORM: 'platform',
} as const;

/**
 * Customer status constants
 *
 * IMPORTANT: Keep in sync with customerStatusSchema in ../schemas/customer.schema.ts
 * The Zod schema is the single source of truth for customer status.
 *
 * Use these constants for programmatic comparisons (e.g., if (status === CUSTOMER_STATUS.ACTIVE))
 * For typing, import CustomerStatus type from @ffp/core schemas
 */
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
} as const;
