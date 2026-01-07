import { z } from 'zod';

import { CUSTOMER_STATUSES } from '@ffp/database/constants';

/**
 * Customer status Zod schema
 *
 * Uses shared constants from @ffp/database to ensure synchronisation
 * with PostgreSQL enum definitions.
 *
 * Defines the lifecycle states of a customer account:
 * - active: Customer account is active and can access the platform
 * - suspended: Temporarily suspended (e.g., payment issues, policy violation)
 * - inactive: Closed/cancelled account (data retained for compliance)
 */
export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);

/**
 * TypeScript type derived from Zod schema
 * Use this across all packages for type-safe customer status handling
 */
export type CustomerStatus = z.infer<typeof customerStatusSchema>;

/**
 * Customer address schema
 * Validates UK-style address format with optional fields
 */
export const customerAddressSchema = z
  .object({
    line1: z.string().max(255).optional(),
    line2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    county: z.string().max(100).optional(),
    postcode: z.string().max(10).optional(),
    country: z.string().max(100).optional(),
  })
  .optional();

/**
 * TypeScript type for customer address
 */
export type CustomerAddress = z.infer<typeof customerAddressSchema>;

/**
 * Full customer schema representing a complete customer record
 * Used for validation and type generation across the platform
 */
export const customerSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  accountCode: z.string().min(1).max(50),
  address: customerAddressSchema,
  status: customerStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * TypeScript type inferred from Zod schema
 * Single source of truth for Customer type across all packages
 */
export type Customer = z.infer<typeof customerSchema>;

/**
 * Schema for creating a new customer (full entity)
 * tenantId will typically come from JWT context, not client input
 *
 * Note: For admin API customer creation, use createCustomerSchema from admin.schema.ts
 */
export const insertCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  accountCode: z.string().min(1).max(50),
  address: customerAddressSchema,
  status: customerStatusSchema.optional().default('active'),
});

/**
 * TypeScript type for customer creation input (full entity)
 */
export type InsertCustomerInput = z.infer<typeof insertCustomerSchema>;

/**
 * Schema for updating an existing customer
 * All fields optional except immutable ones (tenantId, accountCode)
 */
export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: customerAddressSchema,
  status: customerStatusSchema.optional(),
});

/**
 * TypeScript type for customer update input
 */
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
