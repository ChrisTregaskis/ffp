import type { DbClient } from '@ffp/database';
import { tenants, customers } from '@ffp/database/schema';

import { generateRandomAlphanumeric } from '../lib/random';

/**
 * Generate a unique account code from business name
 *
 * Creates a sanitised account code in the format: PREFIXRRRR
 * where PREFIX is exactly 4 characters derived from the business name
 * (uppercase, alphanumeric only, padded with zeros if needed)
 * and RRRR is a random 4-character alphanumeric suffix for uniqueness.
 *
 * @param businessName - The business name to generate code from
 * @returns Unique account code (e.g., "ACMEF2R8", "ALF0A3B9", "PI00M7K4")
 *
 * @example
 * ```typescript
 * generateAccountCode("Acme Physiotherapy") // Returns: "ACMEF2R8"
 * generateAccountCode("ALF") // Returns: "ALF0A3B9"
 * generateAccountCode("PI") // Returns: "PI00M7K4"
 * ```
 */
function generateAccountCode(businessName: string): string {
  // Extract alphanumeric characters and convert to uppercase
  const sanitized = businessName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Create exactly 4-character prefix, padding with zeros if needed
  const prefix = sanitized.substring(0, 4).padEnd(4, '0');

  // Generate random 4-character alphanumeric suffix
  const suffix = generateRandomAlphanumeric(4);

  return `${prefix}${suffix}`;
}

/**
 * Result of creating a new business
 */
export interface CreateBusinessResult {
  tenantId: string;
  customerId: string;
  accountCode: string;
}

/**
 * Create a new business tenant and customer record
 *
 * This operation creates both a tenant and customer record in a single
 * transaction. No RLS context is needed as this is a privileged operation
 * performed by super admins.
 *
 * @param db - Database client with privileged access
 * @param businessName - Name of the business organisation
 * @returns Object containing tenantId, customerId, and accountCode
 *
 * @example
 * ```typescript
 * const result = await createBusiness(db, "Acme Physiotherapy");
 * // Returns: { tenantId: "...", customerId: "...", accountCode: "ACME-A4F2" }
 * ```
 */
export async function createBusiness(
  db: DbClient,
  businessName: string
): Promise<CreateBusinessResult> {
  return await db.transaction(async (tx) => {
    // Create tenant record (type='business')
    const [tenant] = await tx
      .insert(tenants)
      .values({
        type: 'business',
        name: businessName,
      })
      .returning();

    // Generate unique account code
    const accountCode = generateAccountCode(businessName);

    // Create customer record linked to tenant
    const [customer] = await tx
      .insert(customers)
      .values({
        tenantId: tenant.id,
        name: businessName,
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
}
