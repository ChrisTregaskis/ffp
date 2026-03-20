import { z } from 'zod';

import { INVITABLE_ROLES, USER_ROLES } from '@ffp/database/constants';

import { paginationInputSchema, createPaginatedResponseSchema } from './pagination.schema';

export const userRoleSchema = z.enum(USER_ROLES);

export const userSchema = z.object({
  id: z.guid(),
  tenantId: z.guid(),
  email: z.email().max(255),
  cognitoSub: z.string().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  customerId: z.guid().nullable(),
  profileImageUrl: z.url().nullable(),
  phone: z.string().max(20).nullable(),
  dateOfBirth: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
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
  email: z.email(),
  'custom:tenantId': z.guid(),
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
    email: z.email().max(255, 'Email must be 255 characters or less'),
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
    tenantId: z.guid({ message: 'Tenant ID must be a valid GUID' }).optional(),
    customerId: z.guid({ message: 'Customer ID must be a valid GUID' }).optional(),
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

/** Admin create user input — admin provides these fields, server derives tenantId/cognitoSub/role */
export const adminCreateUserInputSchema = z.object({
  email: z.email().max(255, 'Email must be 255 characters or less'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  customerId: z.guid({ message: 'Customer ID is required' }),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.coerce.date().optional(),
});

/** Admin update user input — mutable fields only (email and customer are read-only) */
export const adminUpdateUserInputSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
});

/** Query parameters for GET /admin/users */
export const userListQuerySchema = paginationInputSchema.extend({
  /** Free-text search across name and email */
  search: z.string().optional(),
  /** Filter by customer ID */
  customerId: z.string().optional(),
  /** Filter by user role */
  role: userRoleSchema.optional(),
});

/** Filter parameters extracted from query (excludes pagination) */
export const userFilterSchema = z.object({
  search: z.string().optional(),
  customerId: z.string().optional(),
  role: userRoleSchema.optional(),
});

/** Response schema for user list items — includes customerName from join */
export const userListResponseSchema = userSchema
  .pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    customerId: true,
    createdAt: true,
  })
  .extend({
    customerName: z.string().nullable(),
  });

/** Response schema for user detail — full record with customerName */
export const userDetailResponseSchema = userSchema.extend({
  customerName: z.string().nullable(),
});

/** Paginated response schema for GET /admin/users */
export const paginatedUserResponseSchema = createPaginatedResponseSchema(userListResponseSchema);

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type JwtUserClaims = z.infer<typeof jwtUserClaimsSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserInputSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserInputSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type UserDetailResponse = z.infer<typeof userDetailResponseSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
