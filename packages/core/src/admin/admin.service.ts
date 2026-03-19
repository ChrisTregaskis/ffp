import { getDb } from '@ffp/database';

import { NotFoundError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import {
  customerListResponseSchema,
  customerDetailResponseSchema,
  updateCustomerSchema,
  customerFilterSchema,
} from '../schemas/customer.schema';
import { buildPaginationMeta } from '../schemas/pagination.schema';

import {
  createCustomer as createCustomerInRepo,
  listCustomers as listCustomersInRepo,
  countCustomers as countCustomersInRepo,
  getCustomerById as getCustomerByIdInRepo,
  updateCustomer as updateCustomerInRepo,
} from './admin.repository';

import type { TenantContext } from '../lib/context';
import type { RequestContext } from '../lib/request-context';
import type { CreateCustomerInput, CreateCustomerResponse } from '../schemas/admin.schema';
import type { CustomerListResponse, CustomerDetailResponse } from '../schemas/customer.schema';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';

/**
 * Create a new customer tenant and customer record
 *
 * This is a privileged operation that bypasses RLS. The handler
 * should validate that the requesting user has system_admin role.
 */
export async function createCustomerService(
  ctx: RequestContext,
  input: CreateCustomerInput
): Promise<CreateCustomerResponse> {
  const logger = createLogger(ctx.tenantContext);

  logger.info('Starting customer creation', {
    customerName: input.customerName,
  });

  const result = await createCustomerInRepo(ctx.db, input.customerName);

  logger.info('Customer created successfully', {
    tenantId: result.tenantId,
    customerId: result.customerId,
    accountCode: result.accountCode,
  });

  return {
    tenantId: result.tenantId,
    customerId: result.customerId,
    customerName: input.customerName,
  };
}

/**
 * List customers with pagination, search, and status filter.
 */
export async function listCustomersService(
  ctx: TenantContext,
  paginationInput: PaginationInput,
  rawFilters: { search?: string; status?: string }
): Promise<{ data: CustomerListResponse[]; pagination: PaginationMeta }> {
  const filters = customerFilterSchema.parse(rawFilters);
  const db = getDb();

  const [records, total] = await Promise.all([
    listCustomersInRepo(db, paginationInput, filters),
    countCustomersInRepo(db, filters),
  ]);

  const logger = createLogger(ctx);
  logger.info('Customers listed', {
    action: 'customers_listed',
    total,
    page: paginationInput.page,
    filters,
  });

  return {
    data: records.map((record) => customerListResponseSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/**
 * Get a single customer by ID. Throws NotFoundError if not found.
 */
export async function getCustomerService(
  ctx: TenantContext,
  customerId: string
): Promise<CustomerDetailResponse> {
  const db = getDb();
  const customer = await getCustomerByIdInRepo(db, customerId);

  if (!customer) {
    throw new NotFoundError('Customer', customerId);
  }

  const logger = createLogger(ctx);
  logger.info('Customer retrieved', {
    action: 'customer_retrieved',
    customerId,
  });

  return customerDetailResponseSchema.parse(customer);
}

/**
 * Update a customer record. Throws NotFoundError if not found.
 */
export async function updateCustomerService(
  ctx: TenantContext,
  customerId: string,
  input: unknown
): Promise<CustomerDetailResponse> {
  const validated = updateCustomerSchema.parse(input);
  const db = getDb();

  const updated = await updateCustomerInRepo(db, customerId, validated);

  if (!updated) {
    throw new NotFoundError('Customer', customerId);
  }

  const logger = createLogger(ctx);
  logger.info('Customer updated', {
    action: 'customer_updated',
    customerId: updated.id,
    status: updated.status,
  });

  return customerDetailResponseSchema.parse(updated);
}
