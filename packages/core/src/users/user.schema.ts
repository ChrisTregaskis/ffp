import { z } from 'zod';

/**
 * Schema for inviting a new user to the platform.
 *
 * Supports two modes:
 * 1. Customer owner invites (tenantId/customerId from JWT context)
 * 2. Super admin invites (tenantId/customerId provided in request)
 *
 * The schema validates that tenantId and customerId are provided together or both omitted.
 */
export const inviteUserSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be 255 characters or less'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be 100 characters or less'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be 100 characters or less'),
    role: z.enum(['customer_owner', 'customer_admin', 'customer_user'], {
      errorMap: () => ({
        message: 'Role must be customer_owner, customer_admin, or customer_user',
      }),
    }),

    // Optional: Only required for super_admin invites
    tenantId: z.string().uuid('Tenant ID must be a valid UUID').optional(),
    customerId: z.string().uuid('Customer ID must be a valid UUID').optional(),
  })
  .refine(
    (data) => {
      // Both must be provided together or both omitted
      const hasTenant = !!data.tenantId;
      const hasCustomer = !!data.customerId;

      // A symmetric equality check is used here to ensure both are either present or absent
      return hasTenant === hasCustomer;
    },
    {
      message: 'Tenant ID and customer ID must both be provided or both omitted',
      path: ['tenantId'],
    }
  );

/**
 * TypeScript type inferred from inviteUserSchema
 */
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
