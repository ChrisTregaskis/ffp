import { type z } from 'zod';

import type {
  CreateOrganisationInput,
  OrganisationDetailResponse,
  PaginationInput,
  UpdateOrganisationInput,
} from '@ffp/core';
import {
  createOrganisationResponseSchema,
  createPaginatedResponseSchema,
  organisationDetailResponseSchema,
  organisationListResponseSchema,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/organisations';

/** Paginated schema built inline (not exported from core) */
const paginatedOrganisationResponseSchema = createPaginatedResponseSchema(
  organisationListResponseSchema
);

/** Paginated organisation list response type */
export type PaginatedOrganisationResponse = z.infer<typeof paginatedOrganisationResponseSchema>;

/** Filter parameters for the organisation list endpoint */
export interface AdminOrganisationFilterInput {
  search?: string;
  status?: string;
}

/** These endpoints require system_admin role. */
export const adminOrganisationsApi = {
  /** Lists all organisations with pagination, search, and status filter. */
  list: async (
    pagination: PaginationInput,
    filters: AdminOrganisationFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedOrganisationResponse> => {
    const params: Record<string, string | undefined> = {
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      sortBy: pagination.sortBy,
      sortDirection: pagination.sortDirection,
    };

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(paginatedOrganisationResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** Retrieves a single organisation by ID. */
  get: async (id: string): Promise<OrganisationDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.get(path);

    return parseApiResponse(organisationDetailResponseSchema, response, { method: 'GET', path });
  },

  /** Creates a new organisation (tenant + organisation record). */
  create: async (
    data: CreateOrganisationInput
  ): Promise<z.infer<typeof createOrganisationResponseSchema>> => {
    const path = `${basePath}`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(createOrganisationResponseSchema, response, { method: 'POST', path });
  },

  /** Updates organisation details (name, status, settings). */
  update: async (
    id: string,
    data: UpdateOrganisationInput
  ): Promise<OrganisationDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(organisationDetailResponseSchema, response, { method: 'PUT', path });
  },
};

// Re-export types for consumers
export type { CreateOrganisationInput, UpdateOrganisationInput, OrganisationDetailResponse };
