/**
 * Database constants - Single source of truth for shared enums and types
 *
 * These constants are shared between:
 * - @ffp/database: PostgreSQL enum definitions (pgEnum) and JSONB column types
 * - @ffp/core: Zod validation schemas (z.enum)
 *
 * IMPORTANT: When adding or modifying constants:
 * 1. Update the relevant constants file
 * 2. Run `pnpm db:generate` to create migration for enum changes
 * 3. Run `pnpm db:migrate` to apply changes
 * 4. Both database and Zod schemas will automatically use updated values
 */

export * from './branching.constants';
export * from './customer.constants';
export * from './flow.constants';
export * from './job.constants';
export * from './programme.constants';
export * from './question.constants';
export * from './tenant.constants';
export * from './user.constants';
export * from './user-assessment.constants';
export * from './video.constants';
