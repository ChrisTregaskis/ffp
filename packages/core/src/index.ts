// @ffp/core - Shared business logic, types, and utilities
// This package is imported by both @ffp/web and @ffp/functions

export * from './types';
export * from './lib';
export * from './utils';

// Schemas (validation only - safe for browser)
export * from './schemas';

// Note: Admin domain is server-only and exported from @ffp/core/server
