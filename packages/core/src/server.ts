/**
 * Server-only exports for @ffp/core
 *
 * This module exports Node.js-specific functionality that should ONLY be used
 * in server-side code (@ffp/functions, not @ffp/web):
 * - Database connections and utilities
 * - Organisation context extraction utilities
 * - Request context utilities (unified db + organisation context)
 * - Error classes for API responses
 * - Lambda function wrappers
 * - AWS Cognito service utilities
 * - Structured logging utilities
 * - Random generation utilities (uses Node.js crypto)
 * - Admin domain (server-only operations)
 * - Auth domain (authentication and authorization)
 *
 * Import using: import { db, withRLS, ValidationError, withErrorHandling, cognito, extractUserContext, createRequestContext, createLogger, generateRandomAlphanumeric, createLocationService } from '@ffp/core/server';
 */

export * from './lib/constants';
export * from './lib/database';
export * from './lib/pagination';
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
export * from './exercises';
export * from './jobs';
export * from './programmes';
export * from './programme-templates';
export * from './questions';
export * from './sessions';
export * from './users';
export * from './videos';
