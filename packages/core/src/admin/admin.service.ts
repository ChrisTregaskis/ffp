import { Logger } from '../lib/logger';

import { createBusiness as createBusinessInRepo } from './admin.repository';

import type { RequestContext } from '../lib/request-context';
import type { CreateBusinessInput, CreateBusinessResponse } from '../schemas/admin.schema';

/**
 * Create a new business tenant and customer
 *
 * Orchestrates the business creation process:
 * 1. Validates input (handled by Zod schema at handler level)
 * 2. Creates tenant and customer records via repository
 * 3. Logs the operation with admin context
 * 4. Returns tenant and customer identifiers
 *
 * This is a privileged operation that bypasses RLS. The handler
 * should validate that the requesting user has system_admin role.
 *
 * @param ctx - Request context containing database client and tenant context
 * @param input - Validated business creation input
 * @returns Object containing tenantId, customerId, and businessName
 *
 * @example
 * ```typescript
 * const ctx = createRequestContext(adminContext);
 * const result = await createBusinessService(ctx, {
 *   businessName: "Acme Physiotherapy"
 * });
 * ```
 */
export async function createBusinessService(
  ctx: RequestContext,
  input: CreateBusinessInput
): Promise<CreateBusinessResponse> {
  const logger = new Logger(ctx.tenantContext);

  logger.info('Starting business creation', {
    businessName: input.businessName,
  });

  try {
    // Create business via repository (transaction-based)
    const result = await createBusinessInRepo(ctx.db, input.businessName);

    logger.info('Business created successfully', {
      tenantId: result.tenantId,
      customerId: result.customerId,
      accountCode: result.accountCode,
    });

    return {
      tenantId: result.tenantId,
      customerId: result.customerId,
      businessName: input.businessName,
    };
  } catch (error) {
    logger.error('Failed to create business', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}
