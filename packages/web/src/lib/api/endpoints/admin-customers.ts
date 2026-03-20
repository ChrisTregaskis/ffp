import { type z } from 'zod';

import type {
  CreateCustomerInput,
  CustomerDetailResponse,
  PaginationInput,
  UpdateCustomerInput,
} from '@ffp/core';
import {
  createCustomerResponseSchema,
  customerDetailResponseSchema,
  paginatedCustomerResponseSchema,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/customers';

/** Paginated customer list response type */
export type PaginatedCustomerResponse = z.infer<typeof paginatedCustomerResponseSchema>;

/** Filter parameters for the customer list endpoint */
export interface AdminCustomerFilterInput {
  search?: string;
  status?: string;
}

/** These endpoints require system_admin role. */
export const adminCustomersApi = {
  /** Lists all customers with pagination, search, and status filter. */
  list: async (
    pagination: PaginationInput,
    filters: AdminCustomerFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedCustomerResponse> => {
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

    return parseApiResponse(paginatedCustomerResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** Retrieves a single customer by ID. */
  get: async (id: string): Promise<CustomerDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.get(path);

    return parseApiResponse(customerDetailResponseSchema, response, { method: 'GET', path });
  },

  /** Creates a new customer organisation (tenant + customer record). */
  create: async (
    data: CreateCustomerInput
  ): Promise<z.infer<typeof createCustomerResponseSchema>> => {
    const path = '/admin/create-customer';
    const response = await ffpClient.post(path, data);

    return parseApiResponse(createCustomerResponseSchema, response, { method: 'POST', path });
  },

  /** Updates customer details (name, address, status). */
  update: async (id: string, data: UpdateCustomerInput): Promise<CustomerDetailResponse> => {
    const path = `${basePath}/${id}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(customerDetailResponseSchema, response, { method: 'PUT', path });
  },
};

// Re-export types for consumers
export type { CreateCustomerInput, UpdateCustomerInput, CustomerDetailResponse };
