import { z } from 'zod';

import type {
  CreateProgrammeTemplateInput,
  PaginationInput,
  TemplateDetailResponse,
  UpdateProgrammeTemplateInput,
} from '@ffp/core';
import { paginatedTemplateListResponseSchema, templateDetailResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/programme-templates';

/** Paginated programme template list response type */
export type PaginatedTemplateListResponse = z.infer<typeof paginatedTemplateListResponseSchema>;

/** Filter parameters for the programme template list endpoint */
export interface AdminTemplateFilterInput {
  search?: string;
  difficulty?: string;
  isActive?: string;
}

/** These endpoints require system_admin role. */
export const adminProgrammeTemplatesApi = {
  /** Lists all programme templates with pagination, search, and filters. */
  list: async (
    pagination: PaginationInput,
    filters: AdminTemplateFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedTemplateListResponse> => {
    const params: Record<string, string | undefined> = {
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      sortBy: pagination.sortBy,
      sortDirection: pagination.sortDirection,
    };

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.difficulty) {
      params.difficulty = filters.difficulty;
    }

    if (filters.isActive) {
      params.isActive = filters.isActive;
    }

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(paginatedTemplateListResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** Retrieves a single programme template with full hierarchy (phases, sessions, exercises). */
  get: async (id: string): Promise<TemplateDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.get(path);

    const parsed = parseApiResponse(
      z.object({ template: templateDetailResponseSchema }),
      response,
      { method: 'GET', path }
    );

    return parsed.template;
  },

  /** Creates a new programme template. */
  create: async (data: CreateProgrammeTemplateInput): Promise<TemplateDetailResponse> => {
    const path = basePath;
    const response = await ffpClient.post(path, data);

    const parsed = parseApiResponse(
      z.object({ template: templateDetailResponseSchema }),
      response,
      { method: 'POST', path }
    );

    return parsed.template;
  },

  /** Updates a programme template (partial update). */
  update: async (
    id: string,
    data: UpdateProgrammeTemplateInput
  ): Promise<TemplateDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.put(path, data);

    const parsed = parseApiResponse(
      z.object({ template: templateDetailResponseSchema }),
      response,
      { method: 'PUT', path }
    );

    return parsed.template;
  },

  /** Deactivates a programme template (sets isActive to false). */
  deactivate: async (id: string): Promise<TemplateDetailResponse> => {
    const path = `${basePath}/${id}/deactivate`;
    const response = await ffpClient.put(path, {});

    const parsed = parseApiResponse(
      z.object({ template: templateDetailResponseSchema }),
      response,
      { method: 'PUT', path }
    );

    return parsed.template;
  },
};

// Re-export types for consumers
export type { CreateProgrammeTemplateInput, UpdateProgrammeTemplateInput, TemplateDetailResponse };
