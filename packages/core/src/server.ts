/**
 * Server-only exports for @ffp/core
 *
 * This module exports Node.js-specific functionality that should ONLY be used
 * in server-side code (@ffp/functions, not @ffp/web):
 * - Database connections and utilities
 *  - Tenant context extraction utilities
 * - Error classes for API responses
 * - Lambda function wrappers
 * - AWS Cognito service utilities

 *
 * Import using: import { db, withRLS, ValidationError, withErrorHandling, cognito, extractUserContext } from '@ffp/core/server';
 */

export * from './lib/database';
export * from './lib/errors';
export * from './lib/lambda-wrapper';
export * from './lib/cognito';
