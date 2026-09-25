import { z } from 'zod';

import type {
  AssessmentFlowMetadata,
  AssessmentFlowWithStepsView,
  CreateAssessmentFlowInput,
  PaginatedAssessmentFlowList,
  PaginationInput,
  UpdateAssessmentFlowInput,
} from '@ffp/core';
import {
  assessmentFlowMetadataSchema,
  assessmentFlowWithStepsSchema,
  paginatedAssessmentFlowListSchema,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/assessment-flows';

/** Filter parameters for the assessment flow list endpoint */
export interface AdminAssessmentFlowFilterInput {
  search?: string;
  isActive?: string;
}

const flowResponseSchema = z.object({ flow: assessmentFlowMetadataSchema });

/** Every verb requires the system_admin role. */
export const adminAssessmentFlowsApi = {
  /** Lists assessment flows with pagination, search, sort and a status filter. */
  list: async (
    pagination: PaginationInput,
    filters: AdminAssessmentFlowFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedAssessmentFlowList> => {
    const params: Record<string, string | undefined> = {
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      sortBy: pagination.sortBy,
      sortDirection: pagination.sortDirection,
    };

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.isActive) {
      params.isActive = filters.isActive;
    }

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(paginatedAssessmentFlowListSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** One read serves both the metadata form and the step authoring page. */
  get: async (publicId: string): Promise<AssessmentFlowWithStepsView> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.get(path);

    return parseApiResponse(assessmentFlowWithStepsSchema, response, { method: 'GET', path });
  },

  /** Creates a new assessment flow (metadata only — steps are authored separately). */
  create: async (data: CreateAssessmentFlowInput): Promise<AssessmentFlowMetadata> => {
    const response = await ffpClient.post(basePath, data);

    const parsed = parseApiResponse(flowResponseSchema, response, {
      method: 'POST',
      path: basePath,
    });

    return parsed.flow;
  },

  /** Updates an assessment flow's metadata. */
  update: async (
    publicId: string,
    data: UpdateAssessmentFlowInput
  ): Promise<AssessmentFlowMetadata> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.put(path, data);

    const parsed = parseApiResponse(flowResponseSchema, response, { method: 'PUT', path });

    return parsed.flow;
  },

  /** Deactivates an assessment flow (soft delete — the API has no hard delete). */
  deactivate: async (publicId: string): Promise<void> => {
    await ffpClient.delete(`${basePath}/${publicId}`);
  },
};

// Re-export types for consumers
export type { AssessmentFlowMetadata, AssessmentFlowWithStepsView, PaginatedAssessmentFlowList };
