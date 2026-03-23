/**
 * User role values
 *
 * Defines the hierarchical role system:
 * - system_admin: Platform administrator (highest privilege)
 * - customer_owner: Owner of a location account (business)
 * - customer_admin: Administrator within an organisation
 * - programme_user: User accessing workout programmes (individual or location user)
 *   - Individual users: locationId = null (cannot be invited)
 *   - Location users: locationId present (can be invited)
 */
export const USER_ROLES = [
  'system_admin',
  'customer_owner',
  'customer_admin',
  'programme_user',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Invitable roles - subset of roles that can be invited by admins
 *
 * system_admin is excluded as it requires special provisioning
 */
export const INVITABLE_ROLES = ['customer_owner', 'customer_admin', 'programme_user'] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];
