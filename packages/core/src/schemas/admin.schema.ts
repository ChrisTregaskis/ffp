import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Customer name is required')
    .max(255, 'Customer name must not exceed 255 characters')
    .trim(),
});

export const createCustomerResponseSchema = z.object({
  tenantId: z.guid(),
  customerId: z.guid(),
  customerName: z.string(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateCustomerResponse = z.infer<typeof createCustomerResponseSchema>;
