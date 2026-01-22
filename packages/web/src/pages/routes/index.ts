import type { UserRole } from '@ffp/core';

import { USER_ROLE } from '@web/constants/roles';
import { ComingSoonPage } from '@web/pages/ComingSoonPage';
import { AssessmentProgressComponentsPage } from '@web/pages/dev/AssessmentProgressComponentsPage';
import { ButtonComponentsPage } from '@web/pages/dev/ButtonComponentsPage';
import { CardComponentsPage } from '@web/pages/dev/CardComponentsPage';
import { ComponentsPage } from '@web/pages/dev/ComponentsPage';
import { ErrorBoundaryShowcasePage } from '@web/pages/dev/ErrorBoundaryShowcasePage';
import { FormComponentsPage } from '@web/pages/dev/FormComponentsPage';
import { IconComponentsPage } from '@web/pages/dev/IconComponentsPage';
import { LoadingSpinnerComponentsPage } from '@web/pages/dev/LoadingSpinnerComponentsPage';
import { LogoComponentsPage } from '@web/pages/dev/LogoComponentsPage';
import { MotionShowcasePage } from '@web/pages/dev/MotionShowcasePage';
import { StaticAlertComponentsPage } from '@web/pages/dev/StaticAlertComponentsPage';
import { TextComponentsPage } from '@web/pages/dev/TextComponentsPage';
import { HomePage } from '@web/pages/protected/HomePage';
import { AccountSettingsPage } from '@web/pages/protected/program-user/AccountSettingsPage';
import { ProgrammeOverviewPage } from '@web/pages/protected/program-user/ProgrammeOverviewPage';
import { ProgressPage } from '@web/pages/protected/program-user/ProgressPage';
import { TodayWorkoutPage } from '@web/pages/protected/program-user/TodayWorkoutPage';
import { ForgotPasswordPage } from '@web/pages/public/ForgotPasswordPage';
import { LoginPage } from '@web/pages/public/LoginPage';
import { SetPasswordPage } from '@web/pages/public/SetPasswordPage';
import { UnauthorizedPage } from '@web/pages/UnauthorizedPage';

import { RouteKey } from './RouteKey';

import type { FC } from 'react';

export { RouteKey };

/**
 * Configuration for a single application route.
 *
 * Defines all metadata needed for routing, navigation, and access control.
 */
export interface AppRoute {
  /** URL path for this route (e.g., '/', '/login') */
  path: string;
  /** Page is publicly accessible (no authentication required) */
  public?: boolean;
  /** Page component to render at this path */
  pageComponent: FC;
  /** Parent route key (for nested routes, future use) */
  parentRouteKey?: RouteKey;
  /** Display title for the route (used in navigation, page titles) */
  title?: string;
  /** If true, exclude from main navigation menu */
  excludeFromMainNavbar?: boolean;
  /** If true, exclude AppLayout wrapper (e.g., for fullscreen assessment pages) */
  excludeLayout?: boolean;
  /** Path to redirect to if page is not accessible */
  redirect?: string;
  /** If true, only available in development/staging (excluded in production) */
  devOnly?: boolean;
  /** Roles permitted to access this route (undefined = all authenticated users) */
  allowedRoles?: UserRole[];
}

/**
 * Maps route keys to their configuration. Ensures compile-time safety
 * when referencing routes throughout the application.
 */
export type RoutesConfig = Record<RouteKey, AppRoute>;

const componentsBasePath = '/components';

// Destructure user roles for easier reference
const PROGRAM_USER = USER_ROLE.PROGRAM_USER;
const CUSTOMER_OWNER = USER_ROLE.CUSTOMER_OWNER;
const CUSTOMER_ADMIN = USER_ROLE.CUSTOMER_ADMIN;
const SYSTEM_ADMIN = USER_ROLE.SYSTEM_ADMIN;

/**
 * Application routes configuration.
 *
 * Central source of truth for all application routes.
 * Add new routes here as features are implemented.
 *
 * Route Configuration Notes:
 * - Public routes: Set `public: true` (no auth required)
 * - Protected routes: Omit `public` or set `public: false` (auth required)
 * - Layout exclusions: Set `excludeLayout: true` for fullscreen pages (e.g., assessments)
 * - Navbar exclusions: Set `excludeFromMainNavbar: true` to hide from nav
 * - Dev-only routes: Set `devOnly: true` (excluded in production)
 */
export const routes: RoutesConfig = {
  // Production routes
  [RouteKey.LOGIN]: {
    path: '/login',
    public: true,
    pageComponent: LoginPage,
    title: 'Sign In',
    excludeFromMainNavbar: true,
  },
  [RouteKey.FORGOT_PASSWORD]: {
    path: '/forgot-password',
    public: true,
    pageComponent: ForgotPasswordPage,
    title: 'Forgot Password',
    excludeFromMainNavbar: true,
  },
  [RouteKey.SET_PASSWORD]: {
    path: '/set-password',
    public: true,
    pageComponent: SetPasswordPage,
    title: 'Set Password',
    excludeFromMainNavbar: true,
  },
  [RouteKey.UNAUTHORIZED]: {
    path: '/unauthorized',
    pageComponent: UnauthorizedPage,
    title: 'Access Denied',
    excludeFromMainNavbar: true,
    excludeLayout: true,
  },
  [RouteKey.HOME]: {
    path: '/',
    pageComponent: HomePage,
    title: 'Home',
    // No allowedRoles - accessible to all authenticated users, HomePage handles role-based redirects
  },

  // Programme User Routes (for program_user role)
  [RouteKey.TODAY_WORKOUT]: {
    path: '/today-workout',
    pageComponent: TodayWorkoutPage,
    title: "Today's Workout",
    allowedRoles: [PROGRAM_USER],
  },
  [RouteKey.PROGRAMME_OVERVIEW]: {
    path: '/programme-overview',
    pageComponent: ProgrammeOverviewPage,
    title: 'Programme Overview',
    allowedRoles: [PROGRAM_USER],
  },
  [RouteKey.PROGRESS]: {
    path: '/progress',
    pageComponent: ProgressPage,
    title: 'Progress',
    allowedRoles: [PROGRAM_USER],
  },
  [RouteKey.ACCOUNT_SETTINGS]: {
    path: '/account-settings',
    pageComponent: AccountSettingsPage,
    title: 'Account Settings',
    allowedRoles: [PROGRAM_USER, CUSTOMER_OWNER, CUSTOMER_ADMIN, SYSTEM_ADMIN],
  },

  // Customer Owner/Admin Routes (placeholders)
  [RouteKey.CUSTOMER_DASHBOARD]: {
    path: '/dashboard',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Customer Dashboard',
        description: 'View user KPIs and engagement graphs',
        icon: 'BarChart3',
      }),
    title: 'Dashboard',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },
  [RouteKey.USER_MANAGEMENT]: {
    path: '/users',
    pageComponent: () =>
      ComingSoonPage({
        title: 'User Management',
        description: 'Manage users within your organisation',
        icon: 'Users',
      }),
    title: 'User Management',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },
  [RouteKey.BILLING_USAGE]: {
    path: '/billing',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Billing & Usage',
        description: 'Manage billing and view usage statistics',
        icon: 'CreditCard',
      }),
    title: 'Billing & Usage',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },
  [RouteKey.SUPPORT_HELP]: {
    path: '/support',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Support & Help',
        description: 'Get help and support for your organisation',
        icon: 'HelpCircle',
      }),
    title: 'Support & Help',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },

  // System Admin Routes (placeholders)
  [RouteKey.ADMIN_CUSTOMERS]: {
    path: '/admin/customers',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Customers',
        description: 'Manage customer organisations',
        icon: 'Building',
      }),
    title: 'Customers',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_USERS]: {
    path: '/admin/users',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Users',
        description: 'Manage all users across the platform',
        icon: 'Users',
      }),
    title: 'Users',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_ASSESSMENTS]: {
    path: '/admin/assessments',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Assessments',
        description: 'Manage assessment templates and configurations',
        icon: 'ClipboardList',
      }),
    title: 'Assessments',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_TEMPLATES]: {
    path: '/admin/templates',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Session Templates',
        description: 'Manage workout session templates',
        icon: 'FileText',
      }),
    title: 'Session Templates',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_VIDEOS]: {
    path: '/admin/videos',
    pageComponent: () =>
      ComingSoonPage({
        title: 'Video Library',
        description: 'Manage exercise video library',
        icon: 'Video',
      }),
    title: 'Video Library',
    allowedRoles: [SYSTEM_ADMIN],
  },

  // Development-only routes (component showcase)
  [RouteKey.COMPONENTS]: {
    path: componentsBasePath,
    public: true,
    pageComponent: ComponentsPage,
    title: 'Component Showcase',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_FORM]: {
    path: `${componentsBasePath}/form`,
    public: true,
    pageComponent: FormComponentsPage,
    title: 'Form Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ICON]: {
    path: `${componentsBasePath}/icon`,
    public: true,
    pageComponent: IconComponentsPage,
    title: 'Icon Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_TEXT]: {
    path: `${componentsBasePath}/text`, // Includes Title Component
    public: true,
    pageComponent: TextComponentsPage,
    title: 'Text Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_BUTTON]: {
    path: `${componentsBasePath}/button`,
    public: true,
    pageComponent: ButtonComponentsPage,
    title: 'Button Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_LOGO]: {
    path: `${componentsBasePath}/logo`,
    public: true,
    pageComponent: LogoComponentsPage,
    title: 'Logo Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_LOADING_SPINNER]: {
    path: `${componentsBasePath}/loading-spinner`,
    public: true,
    pageComponent: LoadingSpinnerComponentsPage,
    title: 'Loading Spinner Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_CARD]: {
    path: `${componentsBasePath}/card`,
    public: true,
    pageComponent: CardComponentsPage,
    title: 'Card Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_MOTION]: {
    path: `${componentsBasePath}/motion`,
    public: true,
    pageComponent: MotionShowcasePage,
    title: 'Motion Showcase',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_STATIC_ALERT]: {
    path: `${componentsBasePath}/static-alert`,
    public: true,
    pageComponent: StaticAlertComponentsPage,
    title: 'Static Alert Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ERROR_BOUNDARY]: {
    path: `${componentsBasePath}/error-boundary`,
    public: true,
    pageComponent: ErrorBoundaryShowcasePage,
    title: 'Error Boundary',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ASSESSMENT_PROGRESS]: {
    path: `${componentsBasePath}/assessment-progress`,
    public: true,
    pageComponent: AssessmentProgressComponentsPage,
    title: 'Assessment Progress Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
};
