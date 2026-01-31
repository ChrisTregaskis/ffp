import { z } from 'zod';

import { CUSTOMER_STATUSES } from '@ffp/database/constants';

// Customer status Zod schema
export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);

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
 * Schema for creating a new customer (full entity)
 * Derived from customerSchema - picks required fields, overrides status with default
 *
 * Note: For admin API customer creation, use createCustomerSchema from admin.schema.ts
 */
export const insertCustomerSchema = customerSchema
  .pick({
    name: true,
    accountCode: true,
    address: true,
  })
  .extend({
    status: customerSchema.shape.status.optional().default('active'),
  });

/**
 * Schema for updating an existing customer
 * Derived from customerSchema - picks mutable fields, all optional via .partial()
 */
export const updateCustomerSchema = customerSchema
  .pick({
    name: true,
    address: true,
    status: true,
  })
  .partial();

export type CustomerStatus = z.infer<typeof customerStatusSchema>;
export type CustomerAddress = z.infer<typeof customerAddressSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type InsertCustomerInput = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
