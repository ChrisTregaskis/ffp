/**
 * Shared JSONB column types - Single source of truth
 *
 * These types are shared between:
 * - @ffp/database: JSONB column typing in Drizzle schemas
 * - @ffp/core: Zod validation schemas (imports schemas directly)
 *
 * Defined here to avoid circular dependencies since @ffp/database
 * has no dependencies on other @ffp/* packages.
 */

export * from './assessment.types';
export * from './question.types';
