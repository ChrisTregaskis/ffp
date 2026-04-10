export { adminLocationsApi } from './admin-locations';
export type {
  AdminLocationFilterInput,
  CreateLocationMutationInput,
  PaginatedLocationResponse,
} from './admin-locations';
export type {
  CreateLocationInput,
  LocationDetailResponse,
  UpdateLocationInput,
} from './admin-locations';

export { adminOrganisationsApi } from './admin-organisations';
export type {
  AdminOrganisationFilterInput,
  CreateOrganisationInput,
  OrganisationDetailResponse,
  PaginatedOrganisationResponse,
  UpdateOrganisationInput,
} from './admin-organisations';

export { adminProgrammeTemplatesApi } from './admin-programme-templates';
export { adminExercisesApi, adminPhasesApi, adminSessionsApi } from './admin-template-hierarchy';
export type {
  CreateExerciseRequest,
  CreatePhaseRequest,
  CreateSessionRequest,
  ExerciseResponse,
  PhaseResponse,
  ReorderExercisesRequest,
  ReorderPhasesRequest,
  ReorderSessionsRequest,
  SessionResponse,
  UpdateExerciseRequest,
  UpdatePhaseRequest,
  UpdateSessionRequest,
} from './admin-template-hierarchy';
export type {
  AdminTemplateFilterInput,
  CreateProgrammeTemplateInput,
  PaginatedTemplateListResponse,
  TemplateDetailResponse,
  UpdateProgrammeTemplateInput,
} from './admin-programme-templates';

export { adminUsersApi } from './admin-users';
export type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUserFilterInput,
  PaginatedUserResponse,
  UserDetailResponse as AdminUserDetailResponse,
} from './admin-users';

export { adminVideosApi } from './admin-videos';
export type {
  CreateVideoInput,
  PaginatedAdminVideoResponse,
  UpdateVideoInput,
  UploadUrlRequest,
  UploadUrlResponse,
} from './admin-videos';

export { assessmentsApi } from './assessments';

export { exercisesApi } from './exercises';
export type { ToggleExerciseCompletionResponse } from './exercises';
export type {
  AssessmentFlow,
  AssessmentResultsResponse,
  AssessmentTemplate,
  SaveProgressRequest,
  SaveProgressResponse,
  StartAssessmentResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
} from './assessments';

export { programmesApi } from './programmes';

export { sessionsApi } from './sessions';
export type { StartSessionRequest, StartSessionResponse, SessionStatusResponse } from './sessions';
export type {
  ActiveProgrammeResponse,
  ProgrammeDetailResponse,
  ProgressSummaryResponse,
} from './programmes';

export { usersApi } from './users';
export type { UserProfileResponse } from './users';

export { videosApi } from './videos';
export type {
  SignedVideoUrlResponse,
  VideoDetailResponse,
  VideoFilterInput,
  VideoListApiResponse,
  VideoListResponse,
} from './videos';
