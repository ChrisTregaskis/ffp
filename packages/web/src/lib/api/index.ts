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
export { assessmentsApi, programmesApi, videosApi } from './endpoints';
export type {
  ActiveProgrammeResponse,
  AssessmentFlow,
  AssessmentResultsResponse,
  AssessmentTemplate,
  SaveProgressRequest,
  SaveProgressResponse,
  StartAssessmentResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  VideoDetailResponse,
  VideoFilterInput,
  VideoListApiResponse,
  VideoListResponse,
} from './endpoints';
