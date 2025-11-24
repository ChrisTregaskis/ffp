import { userRoleSchema } from '@ffp/core';

/**
 * User role constants for use throughout the web application.
 * Single source of truth derived from core schema.
 */
export const USER_ROLE = {
  PROGRAM_USER: userRoleSchema.enum.program_user,
  CUSTOMER_OWNER: userRoleSchema.enum.customer_owner,
  CUSTOMER_ADMIN: userRoleSchema.enum.customer_admin,
  SYSTEM_ADMIN: userRoleSchema.enum.system_admin,
} as const;
