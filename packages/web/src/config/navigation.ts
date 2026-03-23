import { matchPath } from 'react-router-dom';

import type { UserRole } from '@ffp/core';

import type { IconName } from '@web/components/Icon/types';
import { USER_ROLE } from '@web/constants/roles';
import type { ContextNavItem } from '@web/pages/routes';
import { routes } from '@web/pages/routes';
import { RouteKey } from '@web/pages/routes/RouteKey';

export type { ContextNavItem } from '@web/pages/routes';

/** Resolve context nav items for the current path, supporting both static and dynamic (function) forms */
export const getContextNavItems = (pathname: string): ContextNavItem[] | undefined => {
  for (const route of Object.values(routes)) {
    if (!route.contextNavItems) {
      continue;
    }

    const match = matchPath(route.path, pathname);

    if (match) {
      if (typeof route.contextNavItems === 'function') {
        return route.contextNavItems(match.params as Record<string, string>);
      }

      return route.contextNavItems;
    }
  }

  return undefined;
};

// Destructure user roles for easier reference
const PROGRAMME_USER = USER_ROLE.PROGRAMME_USER;
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
 * Get navigation items filtered by user role.
 *
 * Nav item arrays are defined inside this function (rather than at module scope)
 * to avoid a circular dependency: routes/index.ts imports ContextNavItem from here,
 * and this file imports routes — eagerly accessing routes at module init would fail.
 *
 * @param userRole - The current user's role
 * @param onLogout - Logout handler function
 * @returns Filtered navigation items for the user's role
 */
export const getNavigationItems = (userRole: UserRole, onLogout: () => void): NavItem[] => {
  // Programme User navigation
  const programmeUserNavItems: NavItem[] = [
    {
      key: RouteKey.HOME,
      label: 'Home',
      icon: 'Home',
      path: routes[RouteKey.HOME].path,
      roles: [PROGRAMME_USER],
      section: 'main',
    },
    {
      key: RouteKey.TODAY_WORKOUT,
      label: "Today's Workout",
      icon: 'Calendar',
      path: routes[RouteKey.TODAY_WORKOUT].path,
      roles: [PROGRAMME_USER],
      section: 'main',
    },
    {
      key: RouteKey.PROGRAMME_OVERVIEW,
      label: 'Programme Overview',
      icon: 'Activity',
      path: routes[RouteKey.PROGRAMME_OVERVIEW].path,
      roles: [PROGRAMME_USER],
      section: 'main',
    },
    {
      key: RouteKey.PROGRESS,
      label: 'Progress',
      icon: 'TrendingUp',
      path: routes[RouteKey.PROGRESS].path,
      roles: [PROGRAMME_USER],
      section: 'main',
    },
  ];

  // Customer Owner/Admin navigation
  const customerAdminNavItems: NavItem[] = [
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

  // System Admin navigation
  const systemAdminNavItems: NavItem[] = [
    {
      key: RouteKey.ADMIN_ORGANISATIONS,
      label: 'Organisations',
      icon: 'Building',
      path: routes[RouteKey.ADMIN_ORGANISATIONS].path,
      roles: [SYSTEM_ADMIN],
      section: 'main',
    },
    {
      key: RouteKey.ADMIN_LOCATIONS,
      label: 'Locations',
      icon: 'Location',
      path: routes[RouteKey.ADMIN_LOCATIONS].path,
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
      label: 'Programme Templates',
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

  // Footer navigation (common across all roles)
  const footerNavItems: NavItem[] = [
    {
      key: RouteKey.ACCOUNT_SETTINGS,
      label: 'Account Settings',
      icon: 'Settings',
      path: routes[RouteKey.ACCOUNT_SETTINGS].path,
      roles: [PROGRAMME_USER, CUSTOMER_OWNER, CUSTOMER_ADMIN, SYSTEM_ADMIN],
      section: 'footer',
    },
  ];

  let mainNavItems: NavItem[] = [];

  // Determine which main navigation items to show based on role
  if (userRole === PROGRAMME_USER) {
    mainNavItems = programmeUserNavItems;
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
    roles: [PROGRAMME_USER, CUSTOMER_OWNER, CUSTOMER_ADMIN, SYSTEM_ADMIN],
    section: 'footer',
    onClick: onLogout,
  };

  return [...filteredMainItems, ...filteredFooterItems, logoutItem];
};
