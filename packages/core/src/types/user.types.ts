/**
 * User types derived from Zod schemas
 * Re-exports types from user.schema.ts to maintain schema-first architecture
 * This ensures runtime validation and compile-time types never drift apart
 */
export type { User, UserRole } from '../schemas/user.schema';
