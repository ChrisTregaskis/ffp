import type { DbClient } from '@ffp/database';
import { tenants, customers } from '@ffp/database/schema';

import { generateRandomAlphanumeric } from '../lib/random';

/**
 * Generate a unique account code from customer name
 *
 * Creates a sanitised account code in the format: PREFIXRRRR
 * where PREFIX is exactly 6 characters derived from the customer name
 * (uppercase, alphanumeric only, padded with zeros if needed)
 * and RRRR is a random 4-character alphanumeric suffix for uniqueness.
 *
 * Note: "customer" represents a business/care home organisation in the system.
 *
 * @param customerName - The customer name to generate code from
 * @returns Unique account code (e.g., "SUNSHI-F2R8", "ALF000-A3B9", "PI0000-M7K4")
 *
 * @example
 * ```typescript
 * generateAccountCode("Sunshine Physiotherapy") // Returns: "SUNSHI-F2R8"
 * generateAccountCode("ALF") // Returns: "ALF000-A3B9"
 * generateAccountCode("PI") // Returns: "PI0000-M7K4"
 * ```
 */
const generateAccountCode = (customerName: string): string => {
  // Extract alphanumeric characters and convert to uppercase
  const sanitized = customerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Create exactly 6-character prefix, padding with zeros if needed
  const prefix = sanitized.substring(0, 6).padEnd(6, '0');

  // Generate random 4-character alphanumeric suffix
  const suffix = generateRandomAlphanumeric(4);

  return `${prefix}-${suffix}`;
};

/**
 * Result of creating a new customer
 */
export interface CreateCustomerResult {
  tenantId: string;
  customerId: string;
  accountCode: string;
}

/**
 * Create a new customer tenant and customer record
 *
 * This operation creates both a tenant and customer record in a single
 * transaction. No RLS context is needed as this is a privileged operation
 * performed by super admins.
 *
 * Note: "customer" represents a business/care home organisation in the system.
 *
 * @param db - Database client with privileged access
 * @param customerName - Name of the customer organisation
 * @returns Object containing tenantId, customerId, and accountCode
 *
 * @example
 * ```typescript
 * const result = await createCustomer(db, "Acme Physiotherapy");
 * // Returns: { tenantId: "...", customerId: "...", accountCode: "ACME-A4F2" }
 * ```
 */
export const createCustomer = async (
  db: DbClient,
  customerName: string
): Promise<CreateCustomerResult> => {
  return await db.transaction(async (tx) => {
    // Create tenant record (type='business')
    const [tenant] = await tx
      .insert(tenants)
      .values({
        type: 'business',
        name: customerName,
      })
      .returning();

    // Generate unique account code
    const accountCode = generateAccountCode(customerName);

    // Create customer record linked to tenant
    const [customer] = await tx
      .insert(customers)
      .values({
        tenantId: tenant.id,
        name: customerName,
        accountCode,
        status: 'active',
      })
      .returning();

    return {
      tenantId: tenant.id,
      customerId: customer.id,
      accountCode: customer.accountCode,
    };
  });
};
