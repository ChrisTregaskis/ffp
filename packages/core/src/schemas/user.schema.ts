import { z } from 'zod';

import { INVITABLE_ROLES, USER_ROLES } from '@ffp/database/constants';

export const userRoleSchema = z.enum(USER_ROLES);

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

export const createUserSchema = userSchema
  .pick({
    email: true,
    cognitoSub: true,
    firstName: true,
    lastName: true,
    role: true,
  })
  .extend({
    customerId: userSchema.shape.customerId.optional(),
    profileImageUrl: userSchema.shape.profileImageUrl.optional(),
    phone: userSchema.shape.phone.optional(),
    dateOfBirth: userSchema.shape.dateOfBirth.optional(),
  });

/**
 * Schema for JWT claims from Cognito ID token
 * Used to validate and type JWT payload on authentication
 *
 * Note: Cognito's 'sub' claim uses their internal identifier format (not UUID)
 */
export const jwtUserClaimsSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  'custom:tenantId': z.string().uuid(),
  'custom:role': userRoleSchema,
});

export const invitableRoleSchema = z.enum(INVITABLE_ROLES);

/**
 * Determines if a programme user can be invited based on customerId presence.
 * Individual users (customerId = null) cannot be invited.
 * Customer users (customerId present) can be invited.
 */
export const canInviteProgrammeUser = (customerId: string | null): boolean => {
  return customerId !== null;
};

/** The schema validates that tenantId and customerId are provided together or both omitted. */
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

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type JwtUserClaims = z.infer<typeof jwtUserClaimsSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
