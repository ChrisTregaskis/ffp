import { z } from 'zod';

/**
 * Input schema for creating a new business
 *
 * Validates the request body for POST /admin/create-business
 *
 * @example
 * ```json
 * {
 *   "businessName": "Acme Physiotherapy"
 * }
 * ```
 */
export const createBusinessSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name is required')
    .max(255, 'Business name must not exceed 255 characters')
    .trim(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

/**
 * Output schema for create business operation
 *
 * Defines the successful response structure
 */
export const createBusinessResponseSchema = z.object({
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  businessName: z.string(),
});

export type CreateBusinessResponse = z.infer<typeof createBusinessResponseSchema>;
