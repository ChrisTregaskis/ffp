import { describe, it, expect } from 'vitest';

import { loginSchema, refreshTokenSchema } from '../../src/schemas/auth.schema';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@business.com',
        password: 'Test123!',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Test123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email address');
      }
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@business.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password is required');
      }
    });

    it('accepts weak passwords during login (validation only during registration)', () => {
      const result = loginSchema.safeParse({
        email: 'user@business.com',
        password: 'weak',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('refreshTokenSchema', () => {
    it('validates valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Refresh token is required');
      }
    });
  });
});
