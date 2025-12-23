/**
 * User constants - Single source of truth for user-related enums
 *
 * These constants are shared between:
 * - @ffp/database: PostgreSQL enum definitions (pgEnum)
 * - @ffp/core: Zod validation schemas (z.enum)
 *
 * IMPORTANT: When adding new user roles:
 * 1. Update this file
 * 2. Run `pnpm db:generate` to create migration for enum changes
 * 3. Run `pnpm db:migrate` to apply changes
 * 4. Both database and Zod schemas will automatically use updated values
 */

/**
 * User role values
 *
 * Defines the hierarchical role system:
 * - system_admin: Platform administrator (highest privilege)
 * - customer_owner: Owner of a customer account (business)
 * - customer_admin: Administrator within a customer organisation
 * - program_user: User accessing workout programmes (individual or customer user)
 */
export const USER_ROLES = [
  'system_admin',
  'customer_owner',
  'customer_admin',
  'program_user',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Invitable roles - subset of roles that can be invited by admins
 *
 * system_admin is excluded as it requires special provisioning
 */
export const INVITABLE_ROLES = ['customer_owner', 'customer_admin', 'program_user'] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];
