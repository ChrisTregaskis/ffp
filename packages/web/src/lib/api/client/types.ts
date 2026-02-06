import type { ApiError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  /** HTTP method */
  method: HttpMethod;
  /** Request path (appended to baseUrl) */
  path: string;
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** AbortController signal for cancellation */
  signal?: AbortSignal;
  /** Skip auth token (for public endpoints) */
  skipAuth?: boolean;
}

export interface RequestContext extends RequestConfig {
  /** Full URL after base URL applied */
  url: string;
  /** Merged headers including defaults */
  headers: Record<string, string>;
}

export type RequestInterceptor = (
  context: RequestContext
) => RequestContext | Promise<RequestContext>;

export type ResponseInterceptor = (
  response: Response,
  context: RequestContext
) => Response | Promise<Response>;

export type ErrorInterceptor = (
  error: ApiError,
  context: RequestContext
) => Promise<Response> | never;

export interface ClientConfig {
  /** Base URL for all requests */
  baseUrl: string;
  /** Default headers for all requests */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}
