import { Logger } from '../lib/logger';

import { createCustomer as createCustomerInRepo } from './admin.repository';

import type { RequestContext } from '../lib/request-context';
import type { CreateCustomerInput, CreateCustomerResponse } from '../schemas/admin.schema';

/**
 * Create a new customer tenant and customer record
 *
 * Orchestrates the customer creation process:
 * 1. Validates input (handled by Zod schema at handler level)
 * 2. Creates tenant and customer records via repository
 * 3. Logs the operation with admin context
 * 4. Returns tenant and customer identifiers
 *
 * This is a privileged operation that bypasses RLS. The handler
 * should validate that the requesting user has system_admin role.
 *
 * Note: "customer" represents a business/care home organisation in the system.
 *
 * @param ctx - Request context containing database client and tenant context
 * @param input - Validated customer creation input
 * @returns Object containing tenantId, customerId, and customerName
 *
 * @example
 * ```typescript
 * const ctx = createRequestContext(adminContext);
 * const result = await createCustomerService(ctx, {
 *   customerName: "Acme Physiotherapy"
 * });
 * ```
 */
export async function createCustomerService(
  ctx: RequestContext,
  input: CreateCustomerInput
): Promise<CreateCustomerResponse> {
  const logger = new Logger(ctx.tenantContext);

  logger.info('Starting customer creation', {
    customerName: input.customerName,
  });

  try {
    // Create customer via repository (transaction-based)
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
  } catch (error) {
    logger.error('Failed to create customer', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}
