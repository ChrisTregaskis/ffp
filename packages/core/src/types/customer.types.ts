/**
 * Customer types - Re-exported from Zod schemas (single source of truth)
 *
 * The Zod schemas in ../schemas/customer.schema.ts are the authoritative source
 * for Customer types. This file re-exports them for backwards compatibility.
 *
 * Import from @ffp/core (root exports) or from this file - both work.
 */
export type {
  Customer,
  CustomerStatus,
  CustomerAddress,
  InsertCustomerInput,
  UpdateCustomerInput,
} from '../schemas/customer.schema';
