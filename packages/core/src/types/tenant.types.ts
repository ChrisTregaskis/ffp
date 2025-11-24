/**
 * Tenant types derived from Zod schemas
 * Re-exports types from tenant.schema.ts to maintain schema-first architecture
 * This ensures runtime validation and compile-time types never drift apart
 */
export type { Tenant, TenantType } from '../schemas/tenant.schema';
