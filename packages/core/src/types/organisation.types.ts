/**
 * Organisation types derived from Zod schemas
 * Re-exports types from organisation.schema.ts to maintain schema-first architecture
 * This ensures runtime validation and compile-time types never drift apart
 */
export type { Organisation, OrganisationType } from '../schemas/organisation.schema';
