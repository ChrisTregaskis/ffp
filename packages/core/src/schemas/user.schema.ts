import { z } from 'zod';

/**
 * User role enumeration - Single source of truth for user roles across the platform
 *
 * Defines the hierarchical role system:
 * - system_admin: Platform administrator (highest privilege)
 * - customer_owner: Owner of a customer account (business)
 * - customer_admin: Administrator within a customer organisation
 * - customer_user: Regular user within a customer organisation
 * - individual_user: Standalone user account
 *
 * IMPORTANT: Keep PostgreSQL enum in @ffp/database/src/schema/users.ts in sync
 */
export const userRoleSchema = z.enum([
  'system_admin',
  'customer_owner',
  'customer_admin',
  'customer_user',
  'individual_user',
]);

/**
 * TypeScript type derived from Zod schema
 * Use this across all packages for type-safe role handling
 */
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Full user schema representing a complete user record
 * Used for validation and type generation across the platform
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email().max(255),
  cognitoSub: z.string().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable(),
  profileImageUrl: z.string().url().nullable(),
  phone: z.string().max(20).nullable(),
  dateOfBirth: z.coerce.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * TypeScript type inferred from Zod schema
 * Single source of truth for User type across all packages
 */
export type User = z.infer<typeof userSchema>;

/**
 * Schema for creating a new user
 * Subset of full schema with only fields required for user creation
 */
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  cognitoSub: z.string().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
});

/**
 * TypeScript type for user creation input
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema for JWT claims from Cognito ID token
 * Used to validate and type JWT payload on authentication
 */
export const jwtUserClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  'custom:tenantId': z.string().uuid(),
  'custom:role': userRoleSchema,
});

/**
 * TypeScript type for JWT user claims
 */
export type JwtUserClaims = z.infer<typeof jwtUserClaimsSchema>;

/**
 * Invitable roles (subset of all roles)
 * Used when inviting users - system_admin and individual_user cannot be invited
 */
export const invitableRoleSchema = z.enum(['customer_owner', 'customer_admin', 'customer_user']);

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
    role: invitableRoleSchema,

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
