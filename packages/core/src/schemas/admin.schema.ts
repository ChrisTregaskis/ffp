import { z } from 'zod';

/**
 * Input schema for creating a new customer
 *
 * Note: "customer" represents a business/care home organisation in the system.
 * Validates the request body for POST /admin/create-customer
 *
 * @example
 * ```json
 * {
 *   "customerName": "Acme Physiotherapy"
 * }
 * ```
 */
export const createCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Customer name is required')
    .max(255, 'Customer name must not exceed 255 characters')
    .trim(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/**
 * Output schema for create customer operation
 *
 * Defines the successful response structure
 */
export const createCustomerResponseSchema = z.object({
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string(),
});

export type CreateCustomerResponse = z.infer<typeof createCustomerResponseSchema>;
