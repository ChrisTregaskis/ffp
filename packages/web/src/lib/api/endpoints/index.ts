export { adminVideosApi } from './admin-videos';
export type {
  CreateVideoInput,
  PaginatedAdminVideoResponse,
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
