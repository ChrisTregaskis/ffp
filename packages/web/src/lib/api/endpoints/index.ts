export { adminCustomersApi } from './admin-customers';
export type {
  AdminCustomerFilterInput,
  CreateCustomerInput,
  CustomerDetailResponse,
  PaginatedCustomerResponse,
  UpdateCustomerInput,
} from './admin-customers';

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
export type { ActiveProgrammeResponse } from './programmes';

export { videosApi } from './videos';
export type {
  SignedVideoUrlResponse,
  VideoDetailResponse,
  VideoFilterInput,
  VideoListApiResponse,
  VideoListResponse,
} from './videos';
