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
import { ForgotPasswordPage } from '@web/pages/public/ForgotPasswordPage';
import { LoginPage } from '@web/pages/public/LoginPage';
import { SetPasswordPage } from '@web/pages/public/SetPasswordPage';

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
}

/**
 * Type-safe routes configuration.
 *
 * Maps route keys to their configuration. Ensures compile-time safety
 * when referencing routes throughout the application.
 */
export type RoutesConfig = Record<RouteKey, AppRoute>;

const componentsBasePath = '/components';

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
  [RouteKey.HOME]: {
    path: '/',
    pageComponent: HomePage,
    title: 'Dashboard',
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
};
