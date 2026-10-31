import { RouteKey, routes } from '@web/config/routes';
import type { RouteConfig } from '@web/config/routes';
import { ComingSoonPage } from '@web/pages/ComingSoonPage';
import { AssessmentAdminPrototypePage } from '@web/pages/dev/assessment-admin/AssessmentAdminPrototypePage';
import { AssessmentProgressComponentsPage } from '@web/pages/dev/AssessmentProgressComponentsPage';
import { AssessmentQuestionsComponentsPage } from '@web/pages/dev/AssessmentQuestionsComponentsPage';
import { AssessmentScreensComponentsPage } from '@web/pages/dev/AssessmentScreensComponentsPage';
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
import { TableComponentsPage } from '@web/pages/dev/TableComponentsPage';
import { TextComponentsPage } from '@web/pages/dev/TextComponentsPage';
import { ToastAlertComponentsPage } from '@web/pages/dev/ToastAlertComponentsPage';
import { AssessmentFlowEditPage } from '@web/pages/protected/admin/assessment-flow-edit';
import { AssessmentFlowListPage } from '@web/pages/protected/admin/assessment-flow-list';
import { AssessmentFlowPreviewPage } from '@web/pages/protected/admin/assessment-flow-preview';
import { AssessmentFlowScoringPage } from '@web/pages/protected/admin/assessment-flow-scoring';
import { AssessmentFlowStepsPage } from '@web/pages/protected/admin/assessment-flow-steps';
import { AssessmentTemplateEditPage } from '@web/pages/protected/admin/assessment-template-edit';
import { AssessmentTemplateListPage } from '@web/pages/protected/admin/assessment-template-list';
import { ExerciseTagsPage } from '@web/pages/protected/admin/exercise-tags';
import { LocationEditPage } from '@web/pages/protected/admin/location-edit';
import { LocationListPage } from '@web/pages/protected/admin/location-list';
import {
  MemberProgrammePage,
  MemberProgrammePhasePage,
} from '@web/pages/protected/admin/member-programme';
import { OrganisationEditPage } from '@web/pages/protected/admin/organisation-edit';
import { OrganisationListPage } from '@web/pages/protected/admin/organisation-list';
import { QuestionEditPage } from '@web/pages/protected/admin/question-edit';
import { QuestionListPage } from '@web/pages/protected/admin/question-list';
import {
  PhaseDetailPage,
  PhasesPage,
  TemplateDetailPage,
} from '@web/pages/protected/admin/template-detail';
import { TemplateListPage } from '@web/pages/protected/admin/template-list';
import { UserEditPage } from '@web/pages/protected/admin/user-edit';
import { UserListPage } from '@web/pages/protected/admin/user-list';
import { VideoEditPage } from '@web/pages/protected/admin/video-edit';
import { VideoLibraryPage } from '@web/pages/protected/admin/video-library';
import { VideoUploadPage } from '@web/pages/protected/admin/video-upload';
import { HomePage } from '@web/pages/protected/HomePage';
import { AssessmentOverviewPage } from '@web/pages/protected/programme-user/AssessmentOverviewPage';
import { AssessmentPage } from '@web/pages/protected/programme-user/AssessmentPage';
import { ProgrammePage } from '@web/pages/protected/programme-user/ProgrammePage';
import { ProgressPage } from '@web/pages/protected/programme-user/ProgressPage';
import { SessionPage } from '@web/pages/protected/programme-user/SessionPage';
import { ForgotPasswordPage } from '@web/pages/public/ForgotPasswordPage';
import { LoginPage } from '@web/pages/public/LoginPage';
import { SetPasswordPage } from '@web/pages/public/SetPasswordPage';
import { UnauthorizedPage } from '@web/pages/UnauthorizedPage';

import type { FC } from 'react';

/** A route's configuration with the page it renders. */
export interface AppRoute extends RouteConfig {
  pageComponent: FC;
}

const PAGE_COMPONENTS: Record<RouteKey, FC> = {
  [RouteKey.LOGIN]: LoginPage,
  [RouteKey.FORGOT_PASSWORD]: ForgotPasswordPage,
  [RouteKey.SET_PASSWORD]: SetPasswordPage,
  [RouteKey.UNAUTHORIZED]: UnauthorizedPage,
  [RouteKey.HOME]: HomePage,
  [RouteKey.ASSESSMENT]: AssessmentPage,
  [RouteKey.SESSION_WORKOUT]: SessionPage,
  [RouteKey.PROGRAMME_OVERVIEW]: ProgrammePage,
  [RouteKey.PROGRESS]: ProgressPage,
  [RouteKey.ASSESSMENT_OVERVIEW]: AssessmentOverviewPage,
  [RouteKey.CUSTOMER_DASHBOARD]: () =>
    ComingSoonPage({
      title: 'Customer Dashboard',
      description: 'View user KPIs and engagement graphs',
      icon: 'BarChart3',
    }),
  [RouteKey.USER_MANAGEMENT]: () =>
    ComingSoonPage({
      title: 'User Management',
      description: 'Manage users within your organisation',
      icon: 'Users',
    }),
  [RouteKey.BILLING_USAGE]: () =>
    ComingSoonPage({
      title: 'Billing & Usage',
      description: 'Manage billing and view usage statistics',
      icon: 'CreditCard',
    }),
  [RouteKey.SUPPORT_HELP]: () =>
    ComingSoonPage({
      title: 'Support & Help',
      description: 'Get help and support for your organisation',
      icon: 'HelpCircle',
    }),
  [RouteKey.ADMIN_ORGANISATIONS]: OrganisationListPage,
  [RouteKey.ADMIN_ORGANISATION_CREATE]: OrganisationEditPage,
  [RouteKey.ADMIN_ORGANISATION_EDIT]: OrganisationEditPage,
  [RouteKey.ADMIN_LOCATIONS]: LocationListPage,
  [RouteKey.ADMIN_LOCATION_CREATE]: LocationEditPage,
  [RouteKey.ADMIN_LOCATION_EDIT]: LocationEditPage,
  [RouteKey.ADMIN_USERS]: UserListPage,
  [RouteKey.ADMIN_USER_CREATE]: UserEditPage,
  [RouteKey.ADMIN_USER_EDIT]: UserEditPage,
  [RouteKey.ADMIN_USER_PROGRAMME]: MemberProgrammePage,
  [RouteKey.ADMIN_USER_PROGRAMME_PHASE]: MemberProgrammePhasePage,
  [RouteKey.ADMIN_ASSESSMENTS]: AssessmentFlowListPage,
  [RouteKey.ADMIN_ASSESSMENT_FLOW_CREATE]: AssessmentFlowEditPage,
  [RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT]: AssessmentFlowEditPage,
  [RouteKey.ADMIN_ASSESSMENT_FLOW_STEPS]: AssessmentFlowStepsPage,
  [RouteKey.ADMIN_ASSESSMENT_FLOW_PREVIEW]: AssessmentFlowPreviewPage,
  [RouteKey.ADMIN_ASSESSMENT_FLOW_SCORING]: AssessmentFlowScoringPage,
  [RouteKey.ADMIN_ASSESSMENT_TEMPLATES]: AssessmentTemplateListPage,
  [RouteKey.ADMIN_ASSESSMENT_TEMPLATE_CREATE]: AssessmentTemplateEditPage,
  [RouteKey.ADMIN_ASSESSMENT_TEMPLATE_EDIT]: AssessmentTemplateEditPage,
  [RouteKey.ADMIN_QUESTIONS]: QuestionListPage,
  [RouteKey.ADMIN_QUESTION_CREATE]: QuestionEditPage,
  [RouteKey.ADMIN_QUESTION_EDIT]: QuestionEditPage,
  [RouteKey.ADMIN_TEMPLATES]: TemplateListPage,
  [RouteKey.ADMIN_TEMPLATE_CREATE]: TemplateDetailPage,
  [RouteKey.ADMIN_TEMPLATE_DETAIL]: TemplateDetailPage,
  [RouteKey.ADMIN_TEMPLATE_PHASES]: PhasesPage,
  [RouteKey.ADMIN_TEMPLATE_PHASE_DETAIL]: PhaseDetailPage,
  [RouteKey.ADMIN_VIDEOS]: VideoLibraryPage,
  [RouteKey.ADMIN_EXERCISE_TAGS]: ExerciseTagsPage,
  [RouteKey.ADMIN_VIDEO_UPLOAD]: VideoUploadPage,
  [RouteKey.ADMIN_VIDEO_EDIT]: VideoEditPage,
  [RouteKey.COMPONENTS]: ComponentsPage,
  [RouteKey.COMPONENTS_FORM]: FormComponentsPage,
  [RouteKey.COMPONENTS_ICON]: IconComponentsPage,
  [RouteKey.COMPONENTS_TEXT]: TextComponentsPage,
  [RouteKey.COMPONENTS_BUTTON]: ButtonComponentsPage,
  [RouteKey.COMPONENTS_LOGO]: LogoComponentsPage,
  [RouteKey.COMPONENTS_LOADING_SPINNER]: LoadingSpinnerComponentsPage,
  [RouteKey.COMPONENTS_CARD]: CardComponentsPage,
  [RouteKey.COMPONENTS_MOTION]: MotionShowcasePage,
  [RouteKey.COMPONENTS_STATIC_ALERT]: StaticAlertComponentsPage,
  [RouteKey.COMPONENTS_ERROR_BOUNDARY]: ErrorBoundaryShowcasePage,
  [RouteKey.COMPONENTS_ASSESSMENT_PROGRESS]: AssessmentProgressComponentsPage,
  [RouteKey.COMPONENTS_ASSESSMENT_QUESTIONS]: AssessmentQuestionsComponentsPage,
  [RouteKey.COMPONENTS_ASSESSMENT_SCREENS]: AssessmentScreensComponentsPage,
  [RouteKey.COMPONENTS_TOAST_ALERT]: ToastAlertComponentsPage,
  [RouteKey.COMPONENTS_TABLE]: TableComponentsPage,
  [RouteKey.COMPONENTS_ASSESSMENT_ADMIN]: AssessmentAdminPrototypePage,
};

/** Every route bound to its page, for the router. */
export const appRoutes = Object.fromEntries(
  Object.values(RouteKey).map((key) => [
    key,
    { ...routes[key], pageComponent: PAGE_COMPONENTS[key] },
  ])
) as Record<RouteKey, AppRoute>;
