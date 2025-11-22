import type { UserRole } from '@ffp/core';

import type { IconName } from '@web/components/Icon/types';
import { USER_ROLE } from '@web/constants/roles';
import { routes } from '@web/pages/routes';
import { RouteKey } from '@web/pages/routes/RouteKey';

// Destructure user roles for easier reference
const INDIVIDUAL_USER = USER_ROLE.INDIVIDUAL_USER;
const CUSTOMER_USER = USER_ROLE.CUSTOMER_USER;
const CUSTOMER_OWNER = USER_ROLE.CUSTOMER_OWNER;
const CUSTOMER_ADMIN = USER_ROLE.CUSTOMER_ADMIN;
const SYSTEM_ADMIN = USER_ROLE.SYSTEM_ADMIN;

/**
 * Navigation item configuration
 */
export interface NavItem {
  /** Unique key for the navigation item */
  key: RouteKey;
  /** Display label for the navigation item */
  label: string;
  /** Icomoon icon name */
  icon: IconName;
  /** URL path (derived from routes config) */
  path: string;
  /** User roles that can see this navigation item */
  roles: UserRole[];
  /** Section of the navigation (main content or footer) */
  section: 'main' | 'footer';
  /** Optional click handler (for actions like logout) */
  onClick?: () => void;
}

/**
 * Individual User Navigation Items
 * Visible to: individual_user, customer_user
 */
export const individualUserNavItems: NavItem[] = [
  {
    key: RouteKey.HOME,
    label: 'Home',
    icon: 'Home',
    path: routes[RouteKey.HOME].path,
    roles: [INDIVIDUAL_USER, CUSTOMER_USER],
    section: 'main',
  },
  {
    key: RouteKey.TODAY_WORKOUT,
    label: "Today's Workout",
    icon: 'Calendar',
    path: routes[RouteKey.TODAY_WORKOUT].path,
    roles: [INDIVIDUAL_USER, CUSTOMER_USER],
    section: 'main',
  },
  {
    key: RouteKey.PROGRAMME_OVERVIEW,
    label: 'Programme Overview',
    icon: 'Activity',
    path: routes[RouteKey.PROGRAMME_OVERVIEW].path,
    roles: [INDIVIDUAL_USER, CUSTOMER_USER],
    section: 'main',
  },
  {
    key: RouteKey.PROGRESS,
    label: 'Progress',
    icon: 'TrendingUp',
    path: routes[RouteKey.PROGRESS].path,
    roles: [INDIVIDUAL_USER, CUSTOMER_USER],
    section: 'main',
  },
];

/**
 * Customer Owner/Admin Navigation Items
 * Visible to: customer_owner, customer_admin
 */
export const customerAdminNavItems: NavItem[] = [
  {
    key: RouteKey.CUSTOMER_DASHBOARD,
    label: 'Dashboard',
    icon: 'BarChart3',
    path: routes[RouteKey.CUSTOMER_DASHBOARD].path,
    roles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.USER_MANAGEMENT,
    label: 'User Management',
    icon: 'Users',
    path: routes[RouteKey.USER_MANAGEMENT].path,
    roles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.BILLING_USAGE,
    label: 'Billing & Usage',
    icon: 'CreditCard',
    path: routes[RouteKey.BILLING_USAGE].path,
    roles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.SUPPORT_HELP,
    label: 'Support & Help',
    icon: 'HelpCircle',
    path: routes[RouteKey.SUPPORT_HELP].path,
    roles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
    section: 'main',
  },
];

/**
 * System Admin Navigation Items
 * Visible to: system_admin
 */
export const systemAdminNavItems: NavItem[] = [
  {
    key: RouteKey.ADMIN_CUSTOMERS,
    label: 'Customers',
    icon: 'Building',
    path: routes[RouteKey.ADMIN_CUSTOMERS].path,
    roles: [SYSTEM_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.ADMIN_USERS,
    label: 'Users',
    icon: 'Users',
    path: routes[RouteKey.ADMIN_USERS].path,
    roles: [SYSTEM_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.ADMIN_ASSESSMENTS,
    label: 'Assessments',
    icon: 'ClipboardList',
    path: routes[RouteKey.ADMIN_ASSESSMENTS].path,
    roles: [SYSTEM_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.ADMIN_TEMPLATES,
    label: 'Session Templates',
    icon: 'FileText',
    path: routes[RouteKey.ADMIN_TEMPLATES].path,
    roles: [SYSTEM_ADMIN],
    section: 'main',
  },
  {
    key: RouteKey.ADMIN_VIDEOS,
    label: 'Video Library',
    icon: 'Video',
    path: routes[RouteKey.ADMIN_VIDEOS].path,
    roles: [SYSTEM_ADMIN],
    section: 'main',
  },
];

/**
 * Footer Navigation Items (common across all roles)
 * Account Settings and Logout
 */
export const footerNavItems: NavItem[] = [
  {
    key: RouteKey.ACCOUNT_SETTINGS,
    label: 'Account Settings',
    icon: 'Settings',
    path: routes[RouteKey.ACCOUNT_SETTINGS].path,
    roles: [INDIVIDUAL_USER, CUSTOMER_USER, CUSTOMER_OWNER, CUSTOMER_ADMIN, SYSTEM_ADMIN],
    section: 'footer',
  },
];

/**
 * Get navigation items filtered by user role
 * @param userRole - The current user's role
 * @param onLogout - Logout handler function
 * @returns Filtered navigation items for the user's role
 */
export const getNavigationItems = (userRole: UserRole, onLogout: () => void): NavItem[] => {
  let mainNavItems: NavItem[] = [];

  // Determine which main navigation items to show based on role
  if (userRole === INDIVIDUAL_USER || userRole === CUSTOMER_USER) {
    mainNavItems = individualUserNavItems;
  } else if (userRole === CUSTOMER_OWNER || userRole === CUSTOMER_ADMIN) {
    mainNavItems = customerAdminNavItems;
  } else {
    mainNavItems = systemAdminNavItems;
  }

  // Filter items by role (additional safety check)
  const filteredMainItems = mainNavItems.filter((item) => item.roles.includes(userRole));

  // Add footer items (filtered by role)
  const filteredFooterItems = footerNavItems.filter((item) => item.roles.includes(userRole));

  // Add logout item
  const logoutItem: NavItem = {
    key: 'logout' as RouteKey, // Special case: not a route
    label: 'Logout',
    icon: 'LogOut',
    path: '#', // No actual path for logout
    roles: [INDIVIDUAL_USER, CUSTOMER_USER, CUSTOMER_OWNER, CUSTOMER_ADMIN, SYSTEM_ADMIN],
    section: 'footer',
    onClick: onLogout,
  };

  return [...filteredMainItems, ...filteredFooterItems, logoutItem];
};
