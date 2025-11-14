/**
 * User types - Re-exported from Zod schemas (single source of truth)
 *
 * The Zod schemas in ../schemas/user.schema.ts are the authoritative source
 * for User types. This file re-exports them for backwards compatibility.
 *
 * Import from @ffp/core (root exports) or from this file - both work.
 */
export type { User, UserRole, CreateUserInput, JwtUserClaims } from '../schemas/user.schema';
