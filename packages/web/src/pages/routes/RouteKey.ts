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

  // Programme User Routes (for programme_user role)
  /** Fullscreen assessment flow (no app layout) */
  ASSESSMENT = 'assessment',
  /** Programme overview and calendar page */
  PROGRAMME_OVERVIEW = 'programme-overview',
  /** Progress and analytics page */
  PROGRESS = 'progress',
  /** Assessment overview with reassessment CTA */
  ASSESSMENT_OVERVIEW = 'assessment-overview',
  /** Full-screen session workout page (no app layout) */
  SESSION_WORKOUT = 'session-workout',
  // Customer Owner/Admin Routes (placeholders)
  /** Customer dashboard with KPIs and engagement graphs */
  CUSTOMER_DASHBOARD = 'customer-dashboard',
  /** User management page */
  USER_MANAGEMENT = 'user-management',
  /** Billing and usage page */
  BILLING_USAGE = 'billing-usage',
  /** Support and help page */
  SUPPORT_HELP = 'support-help',

  // System Admin Routes
  /** Admin organisations management page */
  ADMIN_ORGANISATIONS = 'admin-organisations',
  /** Admin organisation create page */
  ADMIN_ORGANISATION_CREATE = 'admin-organisation-create',
  /** Admin organisation edit page */
  ADMIN_ORGANISATION_EDIT = 'admin-organisation-edit',
  /** Admin locations management page */
  ADMIN_LOCATIONS = 'admin-locations',
  /** Admin location create page */
  ADMIN_LOCATION_CREATE = 'admin-location-create',
  /** Admin location edit page */
  ADMIN_LOCATION_EDIT = 'admin-location-edit',
  /** Admin users management page */
  ADMIN_USERS = 'admin-users',
  /** Admin assessments management page */
  ADMIN_ASSESSMENTS = 'admin-assessments',
  /** Admin session templates management page */
  ADMIN_TEMPLATES = 'admin-templates',
  /** Admin user create page */
  ADMIN_USER_CREATE = 'admin-user-create',
  /** Admin user edit page */
  ADMIN_USER_EDIT = 'admin-user-edit',
  /** Admin video library management page */
  ADMIN_VIDEOS = 'admin-videos',
  /** Admin programme template create page */
  ADMIN_TEMPLATE_CREATE = 'admin-template-create',
  /** Admin programme template detail page */
  ADMIN_TEMPLATE_DETAIL = 'admin-template-detail',
  /** Admin template phases list page */
  ADMIN_TEMPLATE_PHASES = 'admin-template-phases',
  /** Admin template phase detail page (sessions within a phase) */
  ADMIN_TEMPLATE_PHASE_DETAIL = 'admin-template-phase-detail',
  /** Admin video upload page */
  ADMIN_VIDEO_UPLOAD = 'admin-video-upload',
  /** Admin video edit page */
  ADMIN_VIDEO_EDIT = 'admin-video-edit',

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
  /** Assessment progress components showcase */
  COMPONENTS_ASSESSMENT_PROGRESS = 'components-assessment-progress',
  /** Assessment question components showcase */
  COMPONENTS_ASSESSMENT_QUESTIONS = 'components-assessment-questions',
  /** Assessment screen components showcase */
  COMPONENTS_ASSESSMENT_SCREENS = 'components-assessment-screens',
  /** Toast alert components showcase */
  COMPONENTS_TOAST_ALERT = 'components-toast-alert',
  /** Table components showcase */
  COMPONENTS_TABLE = 'components-table',

  // Discovery prototype routes (programme execution UX exploration)
  /** Programme discovery: session workout prototype */
  DISCOVERY_SESSION_WORKOUT = 'discovery-session-workout',
  /** Programme discovery: programme overview prototype */
  DISCOVERY_PROGRAMME_OVERVIEW = 'discovery-programme-overview',
  /** Programme discovery: dashboard prototype */
  DISCOVERY_DASHBOARD = 'discovery-dashboard',
  /** Programme discovery: progress page prototype */
  DISCOVERY_PROGRESS = 'discovery-progress',
}
