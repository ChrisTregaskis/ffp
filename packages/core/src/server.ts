/**
 * Server-only exports for @ffp/core
 *
 * This module exports Node.js-specific functionality that should ONLY be used
 * in server-side code (@ffp/functions, not @ffp/web):
 * - Database connections and utilities
 * - Tenant context extraction utilities
 * - Request context utilities (unified db + tenant context)
 * - Error classes for API responses
 * - Lambda function wrappers
 * - AWS Cognito service utilities
 * - Structured logging utilities
 * - Random generation utilities (uses Node.js crypto)
 * - Admin domain (server-only operations)
 * - Auth domain (authentication and authorization)
 *
 * Import using: import { db, withRLS, ValidationError, withErrorHandling, cognito, extractUserContext, createRequestContext, createLogger, generateRandomAlphanumeric, createCustomerService } from '@ffp/core/server';
 */

export * from './lib/database';
export * from './lib/errors';
export * from './lib/lambda-wrapper';
export * from './lib/cognito';
export * from './lib/context';
export * from './lib/request-context';
export * from './lib/logger';
export * from './lib/random';

// Server-only domain exports
export * from './admin';
export * from './auth';
export * from './assessments';
export * from './jobs';
export * from './programmes';
export * from './videos';
