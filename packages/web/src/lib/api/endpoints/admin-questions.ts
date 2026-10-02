import type {
  AdminQuestionDetail,
  CreateQuestionInput,
  PaginatedQuestionList,
  PaginationInput,
  UpdateQuestionInput,
} from '@ffp/core';
import { adminQuestionResponseSchema, paginatedQuestionListSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/questions';

/** Filter parameters for the question list endpoint */
export interface AdminQuestionFilterInput {
  search?: string;
  type?: string;
  isActive?: string;
}

/** Every verb requires the system_admin role, and every path resolves by publicId. */
export const adminQuestionsApi = {
  /** Lists questions with pagination, search, sort and type / status filters. */
  list: async (
    pagination: PaginationInput,
    filters: AdminQuestionFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedQuestionList> => {
    const params: Record<string, string | undefined> = {
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      sortBy: pagination.sortBy,
      sortDirection: pagination.sortDirection,
      search: filters.search,
      type: filters.type,
      isActive: filters.isActive,
    };

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(paginatedQuestionListSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** One question with where it is used and its linked video. */
  get: async (publicId: string): Promise<AdminQuestionDetail> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.get(path);

    const parsed = parseApiResponse(adminQuestionResponseSchema, response, {
      method: 'GET',
      path,
    });

    return parsed.question;
  },

  create: async (data: CreateQuestionInput): Promise<AdminQuestionDetail> => {
    const response = await ffpClient.post(basePath, data);

    const parsed = parseApiResponse(adminQuestionResponseSchema, response, {
      method: 'POST',
      path: basePath,
    });

    return parsed.question;
  },

  /** Partial update; `validation` is replaced whole, and `null` clears it. */
  update: async (publicId: string, data: UpdateQuestionInput): Promise<AdminQuestionDetail> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.put(path, data);

    const parsed = parseApiResponse(adminQuestionResponseSchema, response, { method: 'PUT', path });

    return parsed.question;
  },

  /** Deactivates a question (soft delete — the API has no hard delete). */
  deactivate: async (publicId: string): Promise<void> => {
    await ffpClient.delete(`${basePath}/${publicId}`);
  },
};
