// @ffp/core - Shared business logic, types, and utilities
// This package is imported by both @ffp/web and @ffp/functions

// Schemas (validation + types - single source of truth)
// All types (User, UserRole, Organisation, OrganisationType, Location, LocationStatus, etc.)
// are exported from schemas - Zod schemas are the authoritative source
export * from './schemas';

// Utilities and constants
export * from './lib';
export * from './utils';

// Note: Admin domain is server-only and exported from @ffp/core/server
