export enum RouteKey {
  /** Public login route */
  LOGIN = 'login',
  /** Public forgot password route */
  FORGOT_PASSWORD = 'forgot-password',
  /** Public set password route for invited users */
  SET_PASSWORD = 'set-password',
  /** Unauthorised access page (shown when user lacks role permissions) */
  UNAUTHORIZED = 'unauthorized',
  /** Protected home/dashboard route */
  HOME = 'home',

  // Programme User Routes (for program_user role)
  /** Today's workout/activity page */
  TODAY_WORKOUT = 'today-workout',
  /** Programme overview and calendar page */
  PROGRAMME_OVERVIEW = 'programme-overview',
  /** Progress and analytics page */
  PROGRESS = 'progress',
  /** Account settings page */
  ACCOUNT_SETTINGS = 'account-settings',

  // Customer Owner/Admin Routes (placeholders)
  /** Customer dashboard with KPIs and engagement graphs */
  CUSTOMER_DASHBOARD = 'customer-dashboard',
  /** User management page */
  USER_MANAGEMENT = 'user-management',
  /** Billing and usage page */
  BILLING_USAGE = 'billing-usage',
  /** Support and help page */
  SUPPORT_HELP = 'support-help',

  // System Admin Routes (placeholders)
  /** Admin customers management page */
  ADMIN_CUSTOMERS = 'admin-customers',
  /** Admin users management page */
  ADMIN_USERS = 'admin-users',
  /** Admin assessments management page */
  ADMIN_ASSESSMENTS = 'admin-assessments',
  /** Admin session templates management page */
  ADMIN_TEMPLATES = 'admin-templates',
  /** Admin video library management page */
  ADMIN_VIDEOS = 'admin-videos',

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
  /** Error boundary components showcase */
  COMPONENTS_ERROR_BOUNDARY = 'components-error-boundary',
}
