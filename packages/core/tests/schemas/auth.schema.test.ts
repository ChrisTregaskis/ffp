import { describe, it, expect } from 'vitest';

import { loginSchema, refreshTokenSchema, passwordValidation } from '../../src/schemas/auth.schema';

describe('Auth Schemas', () => {
  describe('passwordValidation', () => {
    it('validates password meeting all requirements', () => {
      const result = passwordValidation.safeParse('Test123!abc');

      expect(result.success).toBe(true);
    });

    it('rejects password shorter than 8 characters', () => {
      const result = passwordValidation.safeParse('Test1!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects password without lowercase letter', () => {
      const result = passwordValidation.safeParse('TEST123!');

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages.some((msg) => msg.includes('lowercase'))).toBe(true);
      }
    });

    it('rejects password without uppercase letter', () => {
      const result = passwordValidation.safeParse('test123!');

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages.some((msg) => msg.includes('uppercase'))).toBe(true);
      }
    });

    it('rejects password without digit', () => {
      const result = passwordValidation.safeParse('Testtest!');

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages.some((msg) => msg.includes('digit'))).toBe(true);
      }
    });

    it('rejects password without special character', () => {
      const result = passwordValidation.safeParse('Test1234');

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages.some((msg) => msg.includes('special character'))).toBe(true);
      }
    });

    it('accepts various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];

      specialChars.forEach((char) => {
        const result = passwordValidation.safeParse(`Test123${char}`);
        expect(result.success).toBe(true);
      });
    });
  });

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

    it('rejects empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
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

    it('rejects missing email field', () => {
      const result = loginSchema.safeParse({
        password: 'Test123!',
      });

      expect(result.success).toBe(false);
    });

    it('rejects missing password field', () => {
      const result = loginSchema.safeParse({
        email: 'user@business.com',
      });

      expect(result.success).toBe(false);
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

    it('validates any non-empty string as refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'valid-token-string',
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

    it('rejects missing refresh token field', () => {
      const result = refreshTokenSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
