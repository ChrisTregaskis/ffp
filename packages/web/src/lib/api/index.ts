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
export { adminVideosApi, assessmentsApi, programmesApi } from './endpoints';
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
  UploadUrlRequest,
  UploadUrlResponse,
} from './endpoints';
