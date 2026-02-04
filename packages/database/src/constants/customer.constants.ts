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
