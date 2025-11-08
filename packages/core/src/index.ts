// @ffp/core - Shared business logic, types, and utilities
// This package is imported by both @ffp/web and @ffp/functions

export * from './types';
export * from './lib';
export * from './utils';

// Domain exports
// export * from './users'; // TODO: Uncomment when user services are added
export * from './auth';

// Schemas (validation only - safe for browser)
export * from './schemas';

// Note: Admin domain is server-only and exported from @ffp/core/server
