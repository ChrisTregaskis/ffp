/**
 * User role values
 *
 * Defines the hierarchical role system:
 * - system_admin: Platform administrator (highest privilege)
 * - customer_owner: Owner of a customer account (business)
 * - customer_admin: Administrator within a customer organisation
 * - programme_user: User accessing workout programmes (individual or customer user)
 *   - Individual users: customerId = null (cannot be invited)
 *   - Customer users: customerId present (can be invited)
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
