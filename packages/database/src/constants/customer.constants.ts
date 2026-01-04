/**
 * Customer constants - Single source of truth for customer-related enums
 *
 * These constants are shared between:
 * - @ffp/database: PostgreSQL enum definitions (pgEnum)
 * - @ffp/core: Zod validation schemas (z.enum)
 *
 * IMPORTANT: When adding new customer statuses:
 * 1. Update this file
 * 2. Run `pnpm db:generate` to create migration for enum changes
 * 3. Run `pnpm db:migrate` to apply changes
 * 4. Both database and Zod schemas will automatically use updated values
 */

/**
 * Customer status values
 *
 * Defines the lifecycle states of a customer account:
 * - active: Customer account is active and can access the platform
 * - suspended: Temporarily suspended (e.g., payment issues, policy violation)
 * - inactive: Closed/cancelled account (data retained for compliance)
 */
export const CUSTOMER_STATUSES = ['active', 'suspended', 'inactive'] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
