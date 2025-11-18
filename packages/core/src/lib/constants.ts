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

/**
 * Validation regex patterns used across the application.
 *
 * Centralised constants to ensure consistency and maintainability.
 */

/**
 * Email validation pattern.
 *
 * Matches standard email format: name@domain.tld
 * Case-insensitive matching.
 */
export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Password requirement patterns matching Cognito default policy.
 */

/** At least one uppercase letter (A-Z) */
export const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/;

/** At least one lowercase letter (a-z) */
export const PASSWORD_LOWERCASE_PATTERN = /[a-z]/;

/** At least one number (0-9) */
export const PASSWORD_NUMBER_PATTERN = /[0-9]/;

/** At least one special character (non-alphanumeric) */
export const PASSWORD_SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9]/;

/**
 * Combined password validation pattern.
 *
 * Requires:
 * - At least 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export const PASSWORD_FULL_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Password minimum length requirement
 */
export const PASSWORD_MIN_LENGTH = 8;

import { customerStatusSchema } from '../schemas/customer.schema';
import { tenantTypeSchema } from '../schemas/tenant.schema';
import { userRoleSchema } from '../schemas/user.schema';

export const COGNITO_CUSTOM_ATTRIBUTES = {
  TENANT_ID: 'custom:tenantId',
  CUSTOMER_ID: 'custom:customerId',
  ROLE: 'custom:role',
} as const;

/**
 * Helper function to convert Zod enum values to uppercase constant object
 *
 * Transforms: { value: 'value' } => { VALUE: 'value' }
 *
 * @param enumObj - Zod enum object with lowercase keys
 * @returns Object with uppercase keys and original values
 */
function createUppercaseConstants<T extends Record<string, string>>(
  enumObj: T
): { [K in keyof T as Uppercase<K & string>]: T[K] } {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(enumObj)) {
    result[key.toUpperCase()] = value;
  }
  return result as { [K in keyof T as Uppercase<K & string>]: T[K] };
}

/**
 * User role constants - Derived from Zod schema (single source of truth)
 *
 * These constants are automatically derived from userRoleSchema in ../schemas/user.schema.ts
 * This ensures they always stay in sync - no manual synchronisation needed.
 *
 * Use these constants for programmatic comparisons (e.g., if (role === USER_ROLES.SYSTEM_ADMIN))
 * For typing, import UserRole type from @ffp/core schemas
 *
 * @example
 * ```typescript
 * import { USER_ROLES, type UserRole } from '@ffp/core';
 *
 * const role: UserRole = 'system_admin';
 * if (role === USER_ROLES.SYSTEM_ADMIN) {
 *   // Grant admin access
 * }
 * ```
 */
export const USER_ROLES = createUppercaseConstants(userRoleSchema.enum);

/**
 * Tenant type constants - Derived from Zod schema (single source of truth)
 *
 * These constants are automatically derived from tenantTypeSchema in ../schemas/tenant.schema.ts
 * This ensures they always stay in sync - no manual synchronisation needed.
 *
 * Use these constants for programmatic comparisons (e.g., if (type === TENANT_TYPES.BUSINESS))
 * For typing, import TenantType type from @ffp/core schemas
 *
 * @example
 * ```typescript
 * import { TENANT_TYPES, type TenantType } from '@ffp/core';
 *
 * const type: TenantType = 'business';
 * if (type === TENANT_TYPES.BUSINESS) {
 *   // Handle business tenant
 * }
 * ```
 */
export const TENANT_TYPES = createUppercaseConstants(tenantTypeSchema.enum);

/**
 * Customer status constants - Derived from Zod schema (single source of truth)
 *
 * These constants are automatically derived from customerStatusSchema in ../schemas/customer.schema.ts
 * This ensures they always stay in sync - no manual synchronisation needed.
 *
 * Use these constants for programmatic comparisons (e.g., if (status === CUSTOMER_STATUS.ACTIVE))
 * For typing, import CustomerStatus type from @ffp/core schemas
 *
 * @example
 * ```typescript
 * import { CUSTOMER_STATUS, type CustomerStatus } from '@ffp/core';
 *
 * const status: CustomerStatus = 'active';
 * if (status === CUSTOMER_STATUS.ACTIVE) {
 *   // Allow access
 * }
 * ```
 */
export const CUSTOMER_STATUS = createUppercaseConstants(customerStatusSchema.enum);
