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
export {
  adminTagsApi,
  adminVideosApi,
  assessmentsApi,
  exercisesApi,
  programmesApi,
  sessionsApi,
  usersApi,
  videosApi,
} from './endpoints';
export type { PaginatedAdminVideoResponse } from './endpoints';
