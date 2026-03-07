export { ApiError, BaseHttpClient, FFPClient, ffpClient } from './client';
export type {
  ApiErrorResponse,
  ClientConfig,
  ErrorInterceptor,
  HttpMethod,
  RequestConfig,
  RequestContext,
  RequestInterceptor,
  ResponseInterceptor,
} from './client';

// Endpoint exports
export { adminVideosApi, assessmentsApi, programmesApi, videosApi } from './endpoints';
export type {
  ActiveProgrammeResponse,
  AssessmentFlow,
  AssessmentResultsResponse,
  AssessmentTemplate,
  CreateVideoInput,
  SaveProgressRequest,
  SaveProgressResponse,
  StartAssessmentResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  SignedVideoUrlResponse,
  VideoDetailResponse,
  VideoFilterInput,
  VideoListApiResponse,
  VideoListResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from './endpoints';
