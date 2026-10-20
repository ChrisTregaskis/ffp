import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  PaginationInput,
  UserDetailResponse,
} from '@ffp/core';
import { paginatedUserResponseSchema, userDetailResponseSchema } from '@ffp/core';

import { assertUuidPathParam, ffpClient, parseApiResponse, toListParams } from '../client';

import type { z } from 'zod';

const basePath = '/admin/users';

/** Paginated user list response type */
export type PaginatedUserResponse = z.infer<typeof paginatedUserResponseSchema>;

/** Filter parameters for the user list endpoint */
export interface AdminUserFilterInput {
  search?: string;
  locationId?: string;
  role?: string;
}

/** These endpoints require system_admin role. */
export const adminUsersApi = {
  /** Lists all users with pagination, search, location, and role filters. */
  list: async (
    pagination: PaginationInput,
    filters: AdminUserFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedUserResponse> => {
    const response = await ffpClient.get(basePath, {
      params: toListParams(pagination, filters),
      signal,
    });

    return parseApiResponse(paginatedUserResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** Retrieves a single user by ID with location details. */
  get: async (id: string): Promise<UserDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.get(path);

    return parseApiResponse(userDetailResponseSchema, response, { method: 'GET', path });
  },

  /** Creates a programme user (Cognito + DB). */
  create: async (data: AdminCreateUserInput): Promise<UserDetailResponse> => {
    const path = basePath;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(userDetailResponseSchema, response, { method: 'POST', path });
  },

  /** Updates user details (firstName, lastName, phone, dateOfBirth). */
  update: async (id: string, data: AdminUpdateUserInput): Promise<UserDetailResponse> => {
    const checkedId = assertUuidPathParam(id, 'PUT /admin/users/{id}');
    const path = `${basePath}/${checkedId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(userDetailResponseSchema, response, { method: 'PUT', path });
  },
};

// Re-export types for consumers
export type { AdminCreateUserInput, AdminUpdateUserInput, UserDetailResponse };
