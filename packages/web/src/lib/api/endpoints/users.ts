import { userProfileResponseSchema, type UserProfileResponse } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/user';

/**
 * User API methods
 */
export const usersApi = {
  /**
   * Get the authenticated user's profile (firstName, lastName, email, role)
   */
  getMe: async (signal?: AbortSignal): Promise<UserProfileResponse> => {
    const path = `${basePath}/me`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(userProfileResponseSchema, response, { method: 'GET', path });
  },
};

// Re-export types for consumers
export type { UserProfileResponse };
