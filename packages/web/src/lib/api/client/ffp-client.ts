import { fetchAuthSession } from 'aws-amplify/auth';

import { createLogger } from '@web/lib/logger';

import { BaseHttpClient } from './base-client';
import { ApiError } from './errors';

import type { RequestContext } from './types';

const API_BASE_URL_RAW = import.meta.env.VITE_API_URL as string | undefined;

if (!API_BASE_URL_RAW) {
  throw new Error('VITE_API_URL environment variable is not set');
}

const API_BASE_URL: string = API_BASE_URL_RAW;

const logger = createLogger('FFPClient');

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

    this.addRequestInterceptor(this.authInterceptor);

    if (import.meta.env.DEV) {
      this.addRequestInterceptor(this.loggingRequestInterceptor);
      this.addResponseInterceptor(this.loggingResponseInterceptor);
    }
  }

  /**
   * Auth interceptor - adds Cognito JWT to requests
   */
  private authInterceptor = async (context: RequestContext): Promise<RequestContext> => {
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
  };

  /**
   * Development logging - request
   */
  private loggingRequestInterceptor = (context: RequestContext): RequestContext => {
    logger.debug(`${context.method} ${context.path}`, {
      url: context.url,
      headers: context.headers,
      ...(context.body ? { body: context.body } : {}),
    });

    return context;
  };

  /**
   * Development logging - response
   */
  private loggingResponseInterceptor = (response: Response, context: RequestContext): Response => {
    const logMethod = response.ok ? logger.debug : logger.warn;

    logMethod(`${context.method} ${context.path} → ${String(response.status)}`);

    return response;
  };
}

export const ffpClient = new FFPClient();
