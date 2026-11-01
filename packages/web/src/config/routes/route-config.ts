import type { UserRole } from '@ffp/core';

import type { IconName } from '@web/components/atoms';
import { USER_ROLE } from '@web/constants/roles';

import { RouteKey } from './route-key';

/**
 * Context-aware navigation item for routes that override the default sidebar.
 * Used for sub-pages
 */
export interface ContextNavItem {
  /** Display label */
  label: string;
  /** Icomoon icon name */
  icon: IconName;
  /** URL path to navigate to */
  path: string;
}

/**
 * Configuration for a single application route.
 *
 * Defines all metadata needed for routing, navigation, and access control. The page each
 * route renders is bound in `pages/routes`, so navigation code never imports a page.
 */
export interface RouteConfig {
  /** URL path for this route (e.g., '/', '/login') */
  path: string;
  /** Page is publicly accessible (no authentication required) */
  public?: boolean;
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
  /**
   * Context-aware sidebar navigation items (overrides default role-based nav when present).
   * Can be static items or a function that receives matched route params for dynamic paths.
   */
  contextNavItems?: ContextNavItem[] | ((params: Record<string, string>) => ContextNavItem[]);
}

/**
 * Maps route keys to their configuration. Ensures compile-time safety
 * when referencing routes throughout the application.
 */
export type RoutesConfig = Record<RouteKey, RouteConfig>;

const adminBasePath = '/admin';
const componentsBasePath = '/components';

// Destructure user roles for easier reference
const PROGRAMME_USER = USER_ROLE.PROGRAMME_USER;
const CUSTOMER_OWNER = USER_ROLE.CUSTOMER_OWNER;
const CUSTOMER_ADMIN = USER_ROLE.CUSTOMER_ADMIN;
const SYSTEM_ADMIN = USER_ROLE.SYSTEM_ADMIN;

/**
 * Application routes configuration.
 *
 * Central source of truth for all application routes.
 * Add a route here, then bind its page in `pages/routes`.
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
    title: 'Sign In',
    excludeFromMainNavbar: true,
  },
  [RouteKey.FORGOT_PASSWORD]: {
    path: '/forgot-password',
    public: true,
    title: 'Forgot Password',
    excludeFromMainNavbar: true,
  },
  [RouteKey.SET_PASSWORD]: {
    path: '/set-password',
    public: true,
    title: 'Set Password',
    excludeFromMainNavbar: true,
  },
  [RouteKey.UNAUTHORIZED]: {
    path: '/unauthorized',
    title: 'Access Denied',
    excludeFromMainNavbar: true,
    excludeLayout: true,
  },
  [RouteKey.HOME]: {
    path: '/',
    title: 'Home',
    // No allowedRoles - accessible to all authenticated users, HomePage handles role-based redirects
  },

  // Programme User Routes (for programme_user role)
  [RouteKey.ASSESSMENT]: {
    path: '/assessment',
    title: 'Assessment',
    allowedRoles: [PROGRAMME_USER],
    excludeLayout: true,
    excludeFromMainNavbar: true,
  },
  [RouteKey.SESSION_WORKOUT]: {
    path: '/programme/session/:phaseId/:templateSessionId',
    title: 'Session Workout',
    allowedRoles: [PROGRAMME_USER],
    excludeLayout: true,
    excludeFromMainNavbar: true,
  },
  [RouteKey.PROGRAMME_OVERVIEW]: {
    path: '/programme-overview',
    title: 'Programme Overview',
    allowedRoles: [PROGRAMME_USER],
  },
  [RouteKey.PROGRESS]: {
    path: '/progress',
    title: 'Progress',
    allowedRoles: [PROGRAMME_USER],
  },
  [RouteKey.ASSESSMENT_OVERVIEW]: {
    path: '/assessment-overview',
    title: 'Assessment',
    allowedRoles: [PROGRAMME_USER],
  },
  // Customer Owner/Admin Routes (placeholders)
  [RouteKey.CUSTOMER_DASHBOARD]: {
    path: '/dashboard',
    title: 'Dashboard',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },
  [RouteKey.USER_MANAGEMENT]: {
    path: '/users',
    title: 'User Management',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },
  [RouteKey.BILLING_USAGE]: {
    path: '/billing',
    title: 'Billing & Usage',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },
  [RouteKey.SUPPORT_HELP]: {
    path: '/support',
    title: 'Support & Help',
    allowedRoles: [CUSTOMER_OWNER, CUSTOMER_ADMIN],
  },

  // System Admin Routes (placeholders)
  [RouteKey.ADMIN_ORGANISATIONS]: {
    path: `${adminBasePath}/organisations`,
    title: 'Organisations',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_ORGANISATION_CREATE]: {
    path: `${adminBasePath}/organisations/create`,
    title: 'Create Organisation',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Organisations',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/organisations`,
      },
    ],
  },
  [RouteKey.ADMIN_ORGANISATION_EDIT]: {
    path: `${adminBasePath}/organisations/:id`,
    title: 'Edit Organisation',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Organisations',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/organisations`,
      },
    ],
  },
  [RouteKey.ADMIN_LOCATIONS]: {
    path: `${adminBasePath}/locations`,
    title: 'Locations',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_LOCATION_CREATE]: {
    path: `${adminBasePath}/locations/create`,
    title: 'Create Location',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Locations',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/locations`,
      },
    ],
  },
  [RouteKey.ADMIN_LOCATION_EDIT]: {
    path: `${adminBasePath}/locations/:id`,
    title: 'Edit Location',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Locations',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/locations`,
      },
    ],
  },
  [RouteKey.ADMIN_USERS]: {
    path: `${adminBasePath}/users`,
    title: 'Users',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_USER_CREATE]: {
    path: `${adminBasePath}/users/create`,
    title: 'Create User',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Users', icon: 'ArrowLeft', path: `${adminBasePath}/users` },
    ],
  },
  [RouteKey.ADMIN_USER_EDIT]: {
    path: `${adminBasePath}/users/:id`,
    title: 'Edit User',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Users', icon: 'ArrowLeft', path: `${adminBasePath}/users` },
    ],
  },
  [RouteKey.ADMIN_USER_PROGRAMME]: {
    path: `${adminBasePath}/users/:id/programme`,
    title: 'Member Programme',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Users', icon: 'ArrowLeft', path: `${adminBasePath}/users` },
    ],
  },
  [RouteKey.ADMIN_USER_PROGRAMME_PHASE]: {
    path: `${adminBasePath}/users/:id/programme/phases/:phaseId`,
    title: 'Programme Phase',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: (params) => [
      {
        label: 'Back to Programme',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/users/${params.id}/programme`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENTS]: {
    path: `${adminBasePath}/assessments`,
    title: 'Assessments',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_ASSESSMENT_FLOW_CREATE]: {
    path: `${adminBasePath}/assessments/create`,
    title: 'Create Assessment Flow',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Flows',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessments`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT]: {
    path: `${adminBasePath}/assessments/:publicId`,
    title: 'Edit Assessment Flow',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Flows',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessments`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENT_FLOW_STEPS]: {
    path: `${adminBasePath}/assessments/:publicId/steps`,
    title: 'Assessment Flow Steps',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Flows',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessments`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENT_FLOW_PREVIEW]: {
    path: `${adminBasePath}/assessments/:publicId/preview`,
    title: 'Assessment Flow Preview',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Flows',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessments`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENT_FLOW_SCORING]: {
    path: `${adminBasePath}/assessments/:publicId/scoring`,
    title: 'Assessment Flow Scoring',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Flows',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessments`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENT_TEMPLATES]: {
    path: `${adminBasePath}/assessment-templates`,
    title: 'Assessment Templates',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_ASSESSMENT_TEMPLATE_CREATE]: {
    path: `${adminBasePath}/assessment-templates/create`,
    title: 'Create Assessment Template',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Templates',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessment-templates`,
      },
    ],
  },
  [RouteKey.ADMIN_ASSESSMENT_TEMPLATE_EDIT]: {
    path: `${adminBasePath}/assessment-templates/:publicId`,
    title: 'Edit Assessment Template',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Assessment Templates',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/assessment-templates`,
      },
    ],
  },
  [RouteKey.ADMIN_QUESTIONS]: {
    path: `${adminBasePath}/questions`,
    title: 'Question Bank',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_QUESTION_CREATE]: {
    path: `${adminBasePath}/questions/create`,
    title: 'Create Question',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Question Bank', icon: 'ArrowLeft', path: `${adminBasePath}/questions` },
    ],
  },
  [RouteKey.ADMIN_QUESTION_EDIT]: {
    path: `${adminBasePath}/questions/:publicId`,
    title: 'Edit Question',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Question Bank', icon: 'ArrowLeft', path: `${adminBasePath}/questions` },
    ],
  },
  [RouteKey.ADMIN_TEMPLATES]: {
    path: `${adminBasePath}/templates`,
    title: 'Programme Templates',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_TEMPLATE_CREATE]: {
    path: `${adminBasePath}/templates/create`,
    title: 'Create Template',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      {
        label: 'Back to Programme Templates',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/templates`,
      },
    ],
  },
  [RouteKey.ADMIN_TEMPLATE_DETAIL]: {
    path: `${adminBasePath}/templates/:id`,
    title: 'Template Detail',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: (params) => [
      {
        label: 'Back to Programme Templates',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/templates`,
      },
      {
        label: 'Template Details',
        icon: 'FileText',
        path: `${adminBasePath}/templates/${params.id}`,
      },
      {
        label: 'Phases',
        icon: 'ClipboardList',
        path: `${adminBasePath}/templates/${params.id}/phases`,
      },
    ],
  },
  [RouteKey.ADMIN_TEMPLATE_PHASES]: {
    path: `${adminBasePath}/templates/:id/phases`,
    title: 'Template Phases',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: (params) => [
      {
        label: 'Back to Programme Templates',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/templates`,
      },
      {
        label: 'Template Details',
        icon: 'FileText',
        path: `${adminBasePath}/templates/${params.id}`,
      },
      {
        label: 'Phases',
        icon: 'ClipboardList',
        path: `${adminBasePath}/templates/${params.id}/phases`,
      },
    ],
  },
  [RouteKey.ADMIN_TEMPLATE_PHASE_DETAIL]: {
    path: `${adminBasePath}/templates/:id/phases/:phaseId`,
    title: 'Phase Detail',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: (params) => [
      {
        label: 'Back to Phases',
        icon: 'ArrowLeft',
        path: `${adminBasePath}/templates/${params.id}/phases`,
      },
    ],
  },
  [RouteKey.ADMIN_VIDEOS]: {
    path: `${adminBasePath}/videos`,
    title: 'Exercises',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_EXERCISE_TAGS]: {
    path: `${adminBasePath}/exercise-tags`,
    title: 'Exercise Tags',
    allowedRoles: [SYSTEM_ADMIN],
  },
  [RouteKey.ADMIN_VIDEO_UPLOAD]: {
    path: `${adminBasePath}/videos/upload`,
    title: 'Upload Video',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Exercises', icon: 'ArrowLeft', path: `${adminBasePath}/videos` },
    ],
  },
  [RouteKey.ADMIN_VIDEO_EDIT]: {
    path: `${adminBasePath}/videos/:id`,
    title: 'Edit Video',
    allowedRoles: [SYSTEM_ADMIN],
    excludeFromMainNavbar: true,
    contextNavItems: [
      { label: 'Back to Exercises', icon: 'ArrowLeft', path: `${adminBasePath}/videos` },
    ],
  },

  // Development-only routes (component showcase)
  [RouteKey.COMPONENTS]: {
    path: componentsBasePath,
    public: true,
    title: 'Component Showcase',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_FORM]: {
    path: `${componentsBasePath}/form`,
    public: true,
    title: 'Form Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ICON]: {
    path: `${componentsBasePath}/icon`,
    public: true,
    title: 'Icon Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_TEXT]: {
    path: `${componentsBasePath}/text`, // Includes Title Component
    public: true,
    title: 'Text Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_BUTTON]: {
    path: `${componentsBasePath}/button`,
    public: true,
    title: 'Button Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_LOGO]: {
    path: `${componentsBasePath}/logo`,
    public: true,
    title: 'Logo Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_LOADING_SPINNER]: {
    path: `${componentsBasePath}/loading-spinner`,
    public: true,
    title: 'Loading Spinner Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_CARD]: {
    path: `${componentsBasePath}/card`,
    public: true,
    title: 'Card Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_MOTION]: {
    path: `${componentsBasePath}/motion`,
    public: true,
    title: 'Motion Showcase',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_STATIC_ALERT]: {
    path: `${componentsBasePath}/static-alert`,
    public: true,
    title: 'Static Alert Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ERROR_BOUNDARY]: {
    path: `${componentsBasePath}/error-boundary`,
    public: true,
    title: 'Error Boundary',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ASSESSMENT_PROGRESS]: {
    path: `${componentsBasePath}/assessment-progress`,
    public: true,
    title: 'Assessment Progress Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ASSESSMENT_QUESTIONS]: {
    path: `${componentsBasePath}/assessment-questions`,
    public: true,
    title: 'Assessment Question Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_ASSESSMENT_SCREENS]: {
    path: `${componentsBasePath}/assessment-screens`,
    public: true,
    title: 'Assessment Screen Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_TOAST_ALERT]: {
    path: `${componentsBasePath}/toast-alert`,
    public: true,
    title: 'Toast Alert Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
  [RouteKey.COMPONENTS_TABLE]: {
    path: `${componentsBasePath}/table`,
    public: true,
    title: 'Table Components',
    excludeFromMainNavbar: true,
    devOnly: true,
  },
};
