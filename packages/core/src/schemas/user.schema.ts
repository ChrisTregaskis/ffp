import { z } from 'zod';

import { INVITABLE_ROLES, USER_ROLES } from '@ffp/database/constants';

import { paginationInputSchema, createPaginatedResponseSchema } from './pagination.schema';

export const userRoleSchema = z.enum(USER_ROLES);

export const userSchema = z.object({
  id: z.guid(),
  organisationId: z.guid(),
  email: z.email().max(255),
  cognitoSub: z.string().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  locationId: z.guid().nullable(),
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
    locationId: userSchema.shape.locationId.optional(),
    profileImageUrl: userSchema.shape.profileImageUrl.optional(),
    phone: userSchema.shape.phone.optional(),
    dateOfBirth: userSchema.shape.dateOfBirth.optional(),
  });

/**
 * Schema for JWT claims from Cognito ID token
 * Used to validate and type JWT payload on authentication
 *
 * Note: Cognito's 'sub' claim uses their internal identifier format (not UUID)
 * Note: Cognito attribute names are immutable — custom:tenantId maps to organisationId
 */
export const jwtUserClaimsSchema = z.object({
  sub: z.string(),
  email: z.email(),
  'custom:tenantId': z.guid(),
  'custom:role': userRoleSchema,
});

export const invitableRoleSchema = z.enum(INVITABLE_ROLES);

/**
 * Determines if a programme user can be invited based on locationId presence.
 * Individual users (locationId = null) cannot be invited.
 * Location users (locationId present) can be invited.
 */
export const canInviteProgrammeUser = (locationId: string | null): boolean => {
  return locationId !== null;
};

/** The schema validates that organisationId and locationId are provided together or both omitted. */
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
    organisationId: z.guid({ message: 'Organisation ID must be a valid GUID' }).optional(),
    locationId: z.guid({ message: 'Location ID must be a valid GUID' }).optional(),
  })
  .refine(
    (data) => {
      // Both must be provided together or both omitted
      const hasOrganisation = !!data.organisationId;
      const hasLocation = !!data.locationId;

      // A symmetric equality check is used here to ensure both are either present or absent
      return hasOrganisation === hasLocation;
    },
    {
      message: 'Organisation ID and location ID must both be provided or both omitted',
      path: ['organisationId'],
    }
  );

/** Admin create user input — admin provides these fields, server derives organisationId/cognitoSub/role */
export const adminCreateUserInputSchema = z.object({
  email: z.email().max(255, 'Email must be 255 characters or less'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  locationId: z.guid({ message: 'Location ID is required' }),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.coerce.date().optional(),
});

/** Admin update user input — mutable fields only (email and location are read-only) */
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
  /** Filter by location ID */
  locationId: z.string().optional(),
  /** Filter by user role */
  role: userRoleSchema.optional(),
});

/** Filter parameters extracted from query (excludes pagination) */
export const userFilterSchema = z.object({
  search: z.string().optional(),
  locationId: z.string().optional(),
  role: userRoleSchema.optional(),
});

/** Response schema for user list items — includes locationName from join */
export const userListResponseSchema = userSchema
  .pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    locationId: true,
    createdAt: true,
  })
  .extend({
    locationName: z.string().nullable(),
  });

/** Response schema for user detail — full record with locationName */
export const userDetailResponseSchema = userSchema.extend({
  locationName: z.string().nullable(),
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
