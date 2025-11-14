// @ffp/core - Shared business logic, types, and utilities
// This package is imported by both @ffp/web and @ffp/functions

// Schemas (validation + types - single source of truth)
// User, Tenant, and Customer types are exported from here
export * from './schemas';

// Utilities and constants
export * from './lib';
export * from './utils';

// Note: Admin domain is server-only and exported from @ffp/core/server
// Note: Types are also available via './types/*' for backwards compatibility
