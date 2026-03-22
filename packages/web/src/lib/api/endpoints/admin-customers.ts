/**
 * STUB: Customer API client — temporarily stubbed during organisation/location refactor.
 * Will be replaced by admin-locations.ts in FFP-523.
 *
 * These stubs prevent import crashes while the customer schemas have been
 * removed from @ffp/core but consumer code hasn't been updated yet.
 */

import type { PaginationInput } from '@ffp/core';

/** Stub filter input */
export interface AdminCustomerFilterInput {
  search?: string;
  status?: string;
}

/** Stub types — these will be removed in FFP-523 */
export type PaginatedCustomerResponse = { data: never[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } };
export type CreateCustomerInput = { customerName: string };
export type CustomerDetailResponse = Record<string, unknown>;
export type UpdateCustomerInput = Record<string, unknown>;

/** Stubbed API — all methods throw to surface if accidentally called */
export const adminCustomersApi = {
  list: async (
    pagination: PaginationInput,
    _filters: AdminCustomerFilterInput,
    _signal?: AbortSignal
  ): Promise<PaginatedCustomerResponse> => {
    // Return empty list instead of crashing
    return {
      data: [],
      pagination: {
        total: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0,
      },
    };
  },

  get: async (_id: string): Promise<CustomerDetailResponse> => {
    throw new Error('Customer API has been replaced — use location API');
  },

  create: async (_data: CreateCustomerInput): Promise<Record<string, unknown>> => {
    throw new Error('Customer API has been replaced — use organisation API');
  },

  update: async (_id: string, _data: UpdateCustomerInput): Promise<CustomerDetailResponse> => {
    throw new Error('Customer API has been replaced — use location API');
  },
};
