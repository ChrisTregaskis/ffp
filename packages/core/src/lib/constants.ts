import { customerStatusSchema } from '../schemas/customer.schema';
import { tenantTypeSchema } from '../schemas/tenant.schema';
import { userRoleSchema } from '../schemas/user.schema';

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
 * regular customer tenants!
 */
export const PLATFORM_TENANT_ID = 'platform';

/**
 * Placeholder tenant ID for system-level operations where no real tenant exists.
 * Used by routers (pre-auth routing) and cold start logging.
 */
export const SYSTEM_PLACEHOLDER_TENANT_ID = '00000000-0000-0000-8000-000000000000';

// Email validation pattern.
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

export const COGNITO_CUSTOM_ATTRIBUTES = {
  TENANT_ID: 'custom:tenantId',
  CUSTOMER_ID: 'custom:customerId',
  ROLE: 'custom:role',
} as const;

/**
 * Helper function to convert Zod enum values to uppercase constant object
 *
 * Transforms: { value: 'value' } => { VALUE: 'value' }
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
 * User role, Tenant type and Customer status constants - Derived from Zod schema (single source of truth)
 *
 * These constants are automatically derived from relevant schema, ie: userRoleSchema in ../schemas/user.schema.ts
 * Aim is to make it easier to stay in sync.
 *
 * Use these constants for programmatic comparisons (e.g., if (role === USER_ROLES.SYSTEM_ADMIN))
 * For typing, import relevant type ie: UserRole type from @ffp/core schemas
 */
export const USER_ROLES = createUppercaseConstants(userRoleSchema.enum);
export const TENANT_TYPES = createUppercaseConstants(tenantTypeSchema.enum);
export const CUSTOMER_STATUS = createUppercaseConstants(customerStatusSchema.enum);
