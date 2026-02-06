import type { UserRole } from '@ffp/core';

import { USER_ROLE } from '@web/constants/roles';
import { createLogger } from '@web/lib/logger';
import { RouteKey } from '@web/pages/routes/RouteKey';

const logger = createLogger('RBAC');

/**
 * Check if a user's role is in the list of allowed roles for a route.
 *
 * @param userRole - The current user's role
 * @param allowedRoles - Array of roles permitted to access the route
 * @returns True if user has permission, false otherwise
 */
export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

/**
 * Get the home page path for a given user role.
 * Different roles have different default landing pages.
 *
 * @param role - The user's role
 * @returns The route key for the user's home page
 */
export const getRoleHomePath = (role: UserRole): RouteKey => {
  switch (role) {
    case USER_ROLE.PROGRAMME_USER:
      // Programme users see the standard home page
      return RouteKey.HOME;

    case USER_ROLE.CUSTOMER_OWNER:
    case USER_ROLE.CUSTOMER_ADMIN:
      // Customer admins/owners see the customer dashboard
      return RouteKey.CUSTOMER_DASHBOARD;

    case USER_ROLE.SYSTEM_ADMIN:
      // System admins see the customers management page
      return RouteKey.ADMIN_CUSTOMERS;

    default:
      // Fallback to standard home page for any unknown roles
      return RouteKey.HOME;
  }
};

/**
 * Log unauthorised access attempts for security monitoring.
 * Currently, this logs to console. In future, this will integrate
 * with analytics/monitoring services (CloudWatch, Sentry, etc.).
 *
 * @param userId - The ID of the user who attempted access
 * @param attemptedPath - The path the user tried to access
 * @param userRole - The user's role
 */
export const logUnauthorisedAccess = (
  userId: string,
  attemptedPath: string,
  userRole: UserRole
): void => {
  logger.warn('Unauthorised access attempt', {
    userId,
    userRole,
    attemptedPath,
  });
};
