/**
 * Tenant types - Re-exported from Zod schemas (single source of truth)
 *
 * The Zod schemas in ../schemas/tenant.schema.ts are the authoritative source
 * for Tenant types. This file re-exports them for backwards compatibility.
 *
 * Import from @ffp/core (root exports) or from this file - both work.
 */
export type {
  Tenant,
  TenantType,
  CreateTenantInput,
  UpdateTenantInput,
} from '../schemas/tenant.schema';
