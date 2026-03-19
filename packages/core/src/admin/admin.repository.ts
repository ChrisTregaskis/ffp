import { and, eq, or, ilike, count, type Column, type SQL } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import { tenants, customers } from '@ffp/database/schema';
import type { Customer as CustomerRecord } from '@ffp/database/schema';

import { applyPagination } from '../lib/pagination';
import { generateRandomAlphanumeric } from '../lib/random';

import type { CustomerFilterInput, UpdateCustomerInput } from '../schemas/customer.schema';
import type { PaginationInput } from '../schemas/pagination.schema';

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
function generateAccountCode(customerName: string): string {
  // Extract alphanumeric characters and convert to uppercase
  const sanitized = customerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Create exactly 6-character prefix, padding with zeros if needed
  const prefix = sanitized.substring(0, 6).padEnd(6, '0');

  // Generate random 4-character alphanumeric suffix
  const suffix = generateRandomAlphanumeric(4);

  return `${prefix}-${suffix}`;
}

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
export async function createCustomer(
  db: DbClient,
  customerName: string
): Promise<CreateCustomerResult> {
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
}

/** Columns available for sorting on the customer list */
const CUSTOMER_SORTABLE_COLUMNS: Partial<Record<string, Column>> = {
  name: customers.name,
  accountCode: customers.accountCode,
  status: customers.status,
  createdAt: customers.createdAt,
};

/** Builds WHERE conditions from customer filter parameters */
function buildCustomerFilterConditions(filters: CustomerFilterInput): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(or(ilike(customers.name, pattern), ilike(customers.accountCode, pattern)));
  }

  if (filters.status) {
    conditions.push(eq(customers.status, filters.status));
  }

  return conditions;
}

/**
 * List customers with pagination, search, and status filter.
 * No RLS — system_admin operates cross-tenant.
 */
export async function listCustomers(
  db: DbClient,
  paginationInput: PaginationInput,
  filters: CustomerFilterInput
): Promise<CustomerRecord[]> {
  const conditions = buildCustomerFilterConditions(filters);

  const query = db
    .select()
    .from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .$dynamic();

  return await applyPagination(query, paginationInput, CUSTOMER_SORTABLE_COLUMNS);
}

/**
 * Count customers matching filter conditions (for pagination metadata).
 */
export async function countCustomers(db: DbClient, filters: CustomerFilterInput): Promise<number> {
  const conditions = buildCustomerFilterConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0].count;
}

/**
 * Get a single customer by ID, or null if not found.
 */
export async function getCustomerById(
  db: DbClient,
  customerId: string
): Promise<CustomerRecord | null> {
  const records = await db.select().from(customers).where(eq(customers.id, customerId));

  return records[0] ?? null;
}

/**
 * Update a customer record. Returns the updated record or null if not found.
 */
export async function updateCustomer(
  db: DbClient,
  customerId: string,
  data: UpdateCustomerInput
): Promise<CustomerRecord | null> {
  const records = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, customerId))
    .returning();

  return records[0] ?? null;
}
