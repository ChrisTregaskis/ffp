import { type z } from 'zod';

import type {
  CreateLocationInput,
  LocationDetailResponse,
  PaginationInput,
  UpdateLocationInput,
} from '@ffp/core';
import {
  createLocationResponseSchema,
  createPaginatedResponseSchema,
  locationDetailResponseSchema,
  locationListResponseSchema,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/locations';

/** Paginated schema built inline (not exported from core) */
const paginatedLocationResponseSchema = createPaginatedResponseSchema(locationListResponseSchema);

/** Paginated location list response type */
export type PaginatedLocationResponse = z.infer<typeof paginatedLocationResponseSchema>;

/** Filter parameters for the location list endpoint */
export interface AdminLocationFilterInput {
  search?: string;
  status?: string;
  organisationId?: string;
}

/** Input for creating a location under an organisation */
export interface CreateLocationMutationInput {
  organisationId: string;
  data: CreateLocationInput;
}

/** These endpoints require system_admin role. */
export const adminLocationsApi = {
  /** Lists all locations with pagination, search, status, and organisation filters. */
  list: async (
    pagination: PaginationInput,
    filters: AdminLocationFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedLocationResponse> => {
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

    if (filters.organisationId) {
      params.organisationId = filters.organisationId;
    }

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(paginatedLocationResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** Retrieves a single location by ID. */
  get: async (id: string): Promise<LocationDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.get(path);

    return parseApiResponse(locationDetailResponseSchema, response, { method: 'GET', path });
  },

  /** Creates a new location under an organisation. */
  create: async (
    organisationId: string,
    data: CreateLocationInput
  ): Promise<z.infer<typeof createLocationResponseSchema>> => {
    const path = `/admin/organisations/${organisationId}/locations`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(createLocationResponseSchema, response, { method: 'POST', path });
  },

  /** Updates location details (name, status, address). */
  update: async (id: string, data: UpdateLocationInput): Promise<LocationDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(locationDetailResponseSchema, response, { method: 'PUT', path });
  },
};

// Re-export types for consumers
export type { CreateLocationInput, UpdateLocationInput, LocationDetailResponse };
