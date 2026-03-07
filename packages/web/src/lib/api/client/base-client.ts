import { ApiError } from './errors';

import type {
  ClientConfig,
  ErrorInterceptor,
  RequestConfig,
  RequestContext,
  RequestInterceptor,
  ResponseInterceptor,
} from './types';

/**
 * Base HTTP client with interceptor pipeline
 *
 * @description Provides a foundation for HTTP requests with:
 * - Request/response/error interceptors (e.g. auth, logging, retries)
 * - Automatic JSON handling
 * - Query parameter serialisation
 * - AbortController support
 * - Timeout handling
 *
 */
export abstract class BaseHttpClient {
  protected readonly baseUrl: string;
  protected readonly defaultHeaders: Record<string, string>;
  protected readonly timeout: number;

  protected readonly requestInterceptors: RequestInterceptor[] = [];
  protected readonly responseInterceptors: ResponseInterceptor[] = [];
  protected readonly errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? 30000; // 30 seconds default
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Build URL with query parameters
   */
  protected buildUrl(path: string, params?: RequestConfig['params']): string {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Run request through interceptor pipeline
   */
  protected async runRequestInterceptors(context: RequestContext): Promise<RequestContext> {
    let result = context;

    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }

    return result;
  }

  /**
   * Run response through interceptor pipeline
   */
  protected async runResponseInterceptors(
    response: Response,
    context: RequestContext
  ): Promise<Response> {
    let result = response;

    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result, context);
    }

    return result;
  }

  /**
   * Run error through interceptor pipeline
   */
  protected async runErrorInterceptors(
    error: ApiError,
    context: RequestContext
  ): Promise<Response> {
    for (const interceptor of this.errorInterceptors) {
      try {
        return await interceptor(error, context);
      } catch {
        // Interceptor didn't handle, continue to next
        continue;
      }
    }

    // No interceptor handled the error, re-throw
    throw error;
  }

  /**
   * Core request method
   */
  protected async request<T>(config: RequestConfig): Promise<T> {
    const url = this.buildUrl(config.path, config.params);

    // Build initial context
    let context: RequestContext = {
      ...config,
      url,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
      },
    };

    // Run request interceptors
    context = await this.runRequestInterceptors(context);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    // Merge signals if caller provided one
    const signal = config.signal
      ? this.mergeAbortSignals(config.signal, controller.signal)
      : controller.signal;

    try {
      const response = await fetch(context.url, {
        method: context.method,
        headers: context.headers,
        body: context.body ? JSON.stringify(context.body) : undefined,
        signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        const error = await ApiError.fromResponse(response);
        const retryResponse = await this.runErrorInterceptors(error, context);

        return this.parseResponse<T>(retryResponse);
      }

      // Run response interceptors
      const processedResponse = await this.runResponseInterceptors(response, context);

      return this.parseResponse<T>(processedResponse);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw ApiError.timeoutError();
      }

      throw ApiError.networkError(error as Error);
    }
  }

  /**
   * Parse response body as JSON
   */
  protected async parseResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();

    // Handle empty response
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * Merge multiple AbortSignals
   */
  private mergeAbortSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }

      signal.addEventListener(
        'abort',
        () => {
          controller.abort();
        },
        { once: true }
      );
    }

    return controller.signal;
  }

  get<T = unknown>(path: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ method: 'GET', path, ...config });
  }

  post<T = unknown>(path: string, body?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, ...config });
  }

  put<T = unknown>(path: string, body?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, ...config });
  }

  patch<T = unknown>(path: string, body?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, ...config });
  }

  delete<T = unknown>(path: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, ...config });
  }
}
