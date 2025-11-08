/**
 * Server-only exports for @ffp/core
 *
 * This module exports Node.js-specific functionality that should ONLY be used
 * in server-side code (@ffp/functions, not @ffp/web):
 * - Database connections and utilities
 * - Tenant context extraction utilities
 * - Error classes for API responses
 * - Lambda function wrappers
 * - AWS Cognito service utilities
 * - Structured logging utilities
 * - Admin domain (server-only operations)
 *
 * Import using: import { db, withRLS, ValidationError, withErrorHandling, cognito, extractUserContext, Logger, createBusinessService } from '@ffp/core/server';
 */

export * from './lib/database';
export * from './lib/errors';
export * from './lib/lambda-wrapper';
export * from './lib/cognito';
export * from './lib/context';
export * from './lib/logger';

// Server-only domain exports
export * from './admin';
