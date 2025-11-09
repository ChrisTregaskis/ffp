import { describe, it, expect } from 'vitest';

import { inviteUserSchema } from './user.schema';

describe('inviteUserSchema', () => {
  describe('customer owner invites (no tenant/customer)', () => {
    it('validates invite with customer_admin role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
      });

      expect(result.success).toBe(true);
    });

    it('validates invite with customer_user role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_user',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('super admin invites (with tenant/customer)', () => {
    it('validates invite with both tenant and customer IDs', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_user',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('rejects tenant ID without customer ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        // customerId missing
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must both be provided or both omitted');
      }
    });

    it('rejects customer ID without tenant ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        customerId: '550e8400-e29b-41d4-a716-446655440001',
        // tenantId missing
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
        expect(result.error.issues[0].message).toContain(
          'customer_owner, customer_admin, or customer_user'
        );
      }
    });

    it('rejects invalid UUID format for tenant ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        tenantId: 'not-a-uuid',
        customerId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid UUID');
      }
    });

    it('rejects invalid UUID format for customer ID', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@business.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'customer_admin',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: 'not-a-uuid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid UUID');
      }
    });
  });
});
