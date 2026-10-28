import { locationStatusSchema } from '../schemas/location.schema';
import { organisationTypeSchema } from '../schemas/organisation.schema';
import { userRoleSchema } from '../schemas/user.schema';

// Defined in @ffp/database so its seeds can use it without importing core.
export { COGNITO_CUSTOM_ATTRIBUTES } from '@ffp/database/constants';

export const APP_NAME = 'FFP - Fitness & Physiotherapy Platform';
export const APP_VERSION = '0.0.1';

/**
 * Platform organisation ID for system administrators
 *
 * System administrators don't belong to a specific business organisation.
 * They use this special "platform" organisation ID which grants them access
 * to all organisations via RLS policy bypass.
 *
 * Note: This is a reserved organisation ID and should never be used for
 * regular business organisations!
 */
export const PLATFORM_ORGANISATION_ID = 'platform';

/**
 * Placeholder organisation ID for system-level operations where no real organisation exists.
 * Used by routers (pre-auth routing) and cold start logging.
 */
export const SYSTEM_PLACEHOLDER_ORGANISATION_ID = '00000000-0000-0000-8000-000000000000';

// Email validation pattern.
export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * The password rules, matching the user pool's policy in `sst.config.ts`. A password is only ever
 * set in the web app, straight against Cognito, so the web's requirement checklist, built from
 * these, is the only check ahead of it. Login never applies them.
 */

/** Minimum length */
export const PASSWORD_MIN_LENGTH = 8;

/** Maximum length: the longest password Cognito accepts */
export const PASSWORD_MAX_LENGTH = 256;

/**
 * Whitespace at the start or end, which the rules refuse: Cognito doesn't count it as special,
 * and a password manager or a retype can drop it, locking the member out
 */
export const PASSWORD_EDGE_WHITESPACE_PATTERN = /^\s|\s$/;

/** At least one uppercase letter (A-Z) */
export const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/;

/** At least one lowercase letter (a-z) */
export const PASSWORD_LOWERCASE_PATTERN = /[a-z]/;

/** At least one number (0-9) */
export const PASSWORD_NUMBER_PATTERN = /[0-9]/;

/**
 * At least one of the characters Cognito counts as special, or a space with other characters
 * either side. Other symbols (such as £) and accented letters don't count, so Cognito would
 * refuse a password whose only special character is one of them.
 */
export const PASSWORD_SPECIAL_CHAR_PATTERN = /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`=+-]|\S +\S/;

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
 * User role, Organisation type and Location status constants - Derived from Zod schema (single source of truth)
 *
 * These constants are automatically derived from relevant schema, ie: userRoleSchema in ../schemas/user.schema.ts
 * Aim is to make it easier to stay in sync.
 *
 * Use these constants for programmatic comparisons (e.g., if (role === USER_ROLES.SYSTEM_ADMIN))
 * For typing, import relevant type ie: UserRole type from @ffp/core schemas
 */
export const USER_ROLES = createUppercaseConstants(userRoleSchema.enum);
export const ORGANISATION_TYPES = createUppercaseConstants(organisationTypeSchema.enum);
export const LOCATION_STATUSES = createUppercaseConstants(locationStatusSchema.enum);
