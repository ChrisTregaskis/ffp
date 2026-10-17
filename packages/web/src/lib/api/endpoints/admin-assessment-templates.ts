import { z } from 'zod';

import type {
  AdminAssessmentTemplateDetail,
  AssessmentTemplate,
  AssessmentTemplateListItem,
  CreateAssessmentTemplateRequest,
  PaginatedAssessmentTemplateList,
  PaginationInput,
  UpdateAssessmentTemplateInput,
} from '@ffp/core';
import {
  adminAssessmentTemplateDetailSchema,
  assessmentTemplateSchema,
  paginatedAssessmentTemplateListSchema,
} from '@ffp/core';

import { ffpClient, parseApiResponse, toListParams } from '../client';

const basePath = '/admin/assessment-templates';

/** The largest page the list endpoint serves */
const CATALOGUE_PAGE_SIZE = 100;

/** Filter parameters for the assessment template list endpoint */
export interface AdminAssessmentTemplateFilterInput {
  search?: string;
  isActive?: string;
}

const templateResponseSchema = z.object({ template: assessmentTemplateSchema });

/** Every verb requires the system_admin role. */
export const adminAssessmentTemplatesApi = {
  /** Lists assessment templates with pagination, search, sort and a status filter. */
  list: async (
    pagination: PaginationInput,
    filters: AdminAssessmentTemplateFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedAssessmentTemplateList> => {
    const response = await ffpClient.get(basePath, {
      params: toListParams(pagination, filters),
      signal,
    });

    return parseApiResponse(paginatedAssessmentTemplateListSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /**
   * Every template, active or not, for the readers that resolve a step's link by
   * UUID. Walks the paginated list rather than a second, unpaginated endpoint.
   */
  listAll: async (signal?: AbortSignal): Promise<AssessmentTemplateListItem[]> => {
    const templates: AssessmentTemplateListItem[] = [];

    for (let page = 1; ; page++) {
      const { data, pagination } = await adminAssessmentTemplatesApi.list(
        { page, pageSize: CATALOGUE_PAGE_SIZE, sortBy: 'name', sortDirection: 'asc' },
        {},
        signal
      );

      templates.push(...data);

      if (page >= pagination.totalPages) {
        return templates;
      }
    }
  },

  /** The template, its questions as stored, and the flows that use it. */
  get: async (publicId: string): Promise<AdminAssessmentTemplateDetail> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.get(path);

    return parseApiResponse(adminAssessmentTemplateDetailSchema, response, {
      method: 'GET',
      path,
    });
  },

  /** Creates a template with no questions; they are assigned once it exists. */
  create: async (data: CreateAssessmentTemplateRequest): Promise<AssessmentTemplate> => {
    const response = await ffpClient.post(basePath, data);

    return parseApiResponse(templateResponseSchema, response, {
      method: 'POST',
      path: basePath,
    }).template;
  },

  /** Updates a template's name, description or status. */
  update: async (
    publicId: string,
    data: UpdateAssessmentTemplateInput
  ): Promise<AssessmentTemplate> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(templateResponseSchema, response, { method: 'PUT', path }).template;
  },

  /** Deactivates a template (soft delete — the API has no hard delete). */
  deactivate: async (publicId: string): Promise<void> => {
    await ffpClient.delete(`${basePath}/${publicId}`);
  },
};

export type { AdminAssessmentTemplateDetail, PaginatedAssessmentTemplateList };
