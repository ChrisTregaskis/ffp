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
export { assessmentsApi } from './endpoints';
export type {
  AssessmentResultsResponse,
  StartAssessmentResponse,
  SubmitAnswersPayload,
} from './endpoints';
