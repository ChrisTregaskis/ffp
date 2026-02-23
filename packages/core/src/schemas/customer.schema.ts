import { z } from 'zod';

import { CUSTOMER_STATUSES } from '@ffp/database/constants';

export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);

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

export const customerSchema = z.object({
  id: z.guid(),
  tenantId: z.guid(),
  name: z.string().min(1).max(255),
  accountCode: z.string().min(1).max(50),
  address: customerAddressSchema,
  status: customerStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
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
