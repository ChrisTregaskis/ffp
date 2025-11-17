/**
 * Enum of route keys for type-safe route references.
 *
 * Provides compile-time safety when referencing routes throughout the application.
 * Add new routes here as the application grows.
 */
export enum RouteKey {
  /** Public login route */
  LOGIN = 'login',
  /** Public forgot password route */
  FORGOT_PASSWORD = 'forgot-password',
  /** Protected home/dashboard route */
  HOME = 'home',

  // Development-only component showcase routes (excluded in production)
  /** Component showcase landing page */
  COMPONENTS = 'components',
  /** Form components showcase */
  COMPONENTS_FORM = 'components-form',
  /** Icon components showcase */
  COMPONENTS_ICON = 'components-icon',
  /** Text & Title components showcase */
  COMPONENTS_TEXT = 'components-text',
  /** Button components showcase */
  COMPONENTS_BUTTON = 'components-button',
  /** Logo components showcase */
  COMPONENTS_LOGO = 'components-logo',
  /** Loading spinner components showcase */
  COMPONENTS_LOADING_SPINNER = 'components-loading-spinner',
  /** Card components showcase */
  COMPONENTS_CARD = 'components-card',
  /** Motion animation showcase */
  COMPONENTS_MOTION = 'components-motion',
  /** Static alert components showcase */
  COMPONENTS_STATIC_ALERT = 'components-static-alert',
}
