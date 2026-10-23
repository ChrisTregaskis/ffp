import { describe, it, expect } from 'vitest';

import { inviteUserSchema, userSchema } from '../../src/schemas/user.schema';

describe('inviteUserSchema', () => {
  describe('location owner invites (no organisation/location)', () => {
    it('validates invite with customer_admin role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
      });

      expect(result.success).toBe(true);
    });

    it('validates invite with programme_user role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'programme_user',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('super admin invites (with organisation/location)', () => {
    it('validates invite with both organisation and location IDs', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'programme_user',
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        locationId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('rejects organisation ID without location ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        // locationId missing
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must both be provided or both omitted');
      }
    });

    it('rejects location ID without organisation ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        locationId: '550e8400-e29b-41d4-a716-446655440001',
        // organisationId missing
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must both be provided or both omitted');
      }
    });

    it('rejects invalid email format', () => {
      const result = inviteUserSchema.safeParse({
        email: 'not-an-email',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email address');
      }
    });

    it('rejects email exceeding 255 characters', () => {
      const longEmail = `${'a'.repeat(250)}@test.com`; // 258 characters
      const result = inviteUserSchema.safeParse({
        email: longEmail,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255 characters');
      }
    });

    it('rejects empty first name', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: '',
        lastName: 'Doe',
        role: 'customer_admin',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('First name is required');
      }
    });

    it('rejects first name exceeding 100 characters', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'a'.repeat(101),
        lastName: 'Doe',
        role: 'customer_admin',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 characters');
      }
    });

    it('rejects empty last name', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: '',
        role: 'customer_admin',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Last name is required');
      }
    });

    it('rejects last name exceeding 100 characters', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'a'.repeat(101),
        role: 'customer_admin',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 characters');
      }
    });

    it('rejects invalid role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'invalid_role',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 returns options in format: 'Invalid option: expected one of "customer_owner"|"customer_admin"|"programme_user"'
        expect(result.error.issues[0].message).toContain('customer_owner');
        expect(result.error.issues[0].message).toContain('customer_admin');
        expect(result.error.issues[0].message).toContain('programme_user');
      }
    });

    it('refuses system_admin, which is never invitable', () => {
      const result = inviteUserSchema.safeParse({
        email: 'admin@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'system_admin',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['role']);
    });

    it('rejects invalid UUID format for organisation ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        organisationId: 'not-a-uuid',
        locationId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid GUID');
      }
    });

    it('rejects invalid UUID format for location ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        locationId: 'not-a-uuid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid GUID');
      }
    });
  });
});

describe('userSchema', () => {
  const validUserBase = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    publicId: 'abc123def456',
    organisationId: '123e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
    cognitoSub: 'cognito-sub-123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer_admin' as const,
    locationId: null,
    profileImageUrl: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('dateOfBirth field (z.coerce.date())', () => {
    it('accepts null value', () => {
      const result = userSchema.safeParse({
        ...validUserBase,
        dateOfBirth: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateOfBirth).toBeNull();
      }
    });
  });
});
