/**
 * Server-only exports for @ffp/core
 *
 * This module exports Node.js-specific functionality (database connections, RLS utilities)
 * that should ONLY be used in server-side code (@ffp/functions, not @ffp/web).
 *
 * Import using: import { db, withRLS } from '@ffp/core/server';
 */

export * from './lib/database';
