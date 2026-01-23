import { fetchAuthSession } from 'aws-amplify/auth';

import { BaseHttpClient } from './base-client';
import { ApiError } from './errors';

import type { RequestContext } from './types';

const API_BASE_URL_RAW = import.meta.env.VITE_API_URL as string | undefined;

if (!API_BASE_URL_RAW) {
  throw new Error('VITE_API_URL environment variable is not set');
}

const API_BASE_URL: string = API_BASE_URL_RAW;

/**
 * FFP API Client
 *
 * @description Extends BaseHttpClient with:
 * - Cognito JWT authentication
 * - FFP-specific error handling
 * - Development logging
 */
export class FFPClient extends BaseHttpClient {
  constructor() {
    super({
      baseUrl: API_BASE_URL,
      defaultHeaders: {
        'X-Client-Version': (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0',
      },
    });

    // Register auth interceptor
    this.addRequestInterceptor(this.authInterceptor.bind(this));

    // Register logging interceptor in development
    if (import.meta.env.DEV) {
      this.addRequestInterceptor(this.loggingRequestInterceptor.bind(this));
      this.addResponseInterceptor(this.loggingResponseInterceptor.bind(this));
    }
  }

  /**
   * Auth interceptor - adds Cognito JWT to requests
   */
  private async authInterceptor(context: RequestContext): Promise<RequestContext> {
    // Skip auth for public endpoints
    if (context.skipAuth) {
      return context;
    }

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new ApiError(
          401,
          'NO_AUTH_TOKEN',
          'No authentication token available. Please sign in.'
        );
      }

      return {
        ...context,
        headers: {
          ...context.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    } catch (error) {
      if (ApiError.isApiError(error)) {
        throw error;
      }

      throw new ApiError(
        401,
        'AUTH_SESSION_ERROR',
        'Failed to retrieve authentication session. Please sign in again.'
      );
    }
  }

  /**
   * Development logging - request
   */
  private loggingRequestInterceptor(context: RequestContext): RequestContext {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`%c[API] ${context.method} ${context.path}`, 'color: #4a9eff');
    // eslint-disable-next-line no-console
    console.log('URL:', context.url);
    // eslint-disable-next-line no-console
    console.log('Headers:', context.headers);
    if (context.body) {
      // eslint-disable-next-line no-console
      console.log('Body:', context.body);
    }
    // eslint-disable-next-line no-console
    console.groupEnd();

    return context;
  }

  /**
   * Development logging - response
   */
  private loggingResponseInterceptor(response: Response, context: RequestContext): Response {
    const colour = response.ok ? '#4caf50' : '#f44336';

    // eslint-disable-next-line no-console
    console.log(
      `%c[API] ${context.method} ${context.path} → ${String(response.status)}`,
      `color: ${colour}`
    );

    return response;
  }
}

export const ffpClient = new FFPClient();
