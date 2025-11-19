import { describe, it, expect } from 'vitest';

import {
  loginSchema,
  passwordSchema,
  setPasswordCredentialsSchema,
  setPasswordNewPasswordSchema,
} from './auth.schema';

describe('auth.schema', () => {
  describe('loginSchema', () => {
    it('should validate correct email and password', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['email']);
        expect(result.error.issues[0]?.message).toBe('Invalid email address');
      }
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['password']);
        expect(result.error.issues[0]?.message).toBe('Password required');
      }
    });
  });

  describe('passwordSchema', () => {
    it('should validate password meeting all Cognito requirements', () => {
      const validPassword = 'SecurePass123!';

      const result = passwordSchema.safeParse(validPassword);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const shortPassword = 'Short1!';

      const result = passwordSchema.safeParse(shortPassword);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('at least 8 characters');
      }
    });

    it('should reject password without uppercase letter', () => {
      const noUppercase = 'securepass123!';

      const result = passwordSchema.safeParse(noUppercase);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('uppercase letter');
      }
    });

    it('should reject password without lowercase letter', () => {
      const noLowercase = 'SECUREPASS123!';

      const result = passwordSchema.safeParse(noLowercase);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('lowercase letter');
      }
    });

    it('should reject password without number', () => {
      const noNumber = 'SecurePass!';

      const result = passwordSchema.safeParse(noNumber);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('number');
      }
    });

    it('should reject password without special character', () => {
      const noSpecialChar = 'SecurePass123';

      const result = passwordSchema.safeParse(noSpecialChar);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('special character');
      }
    });
  });

  describe('setPasswordCredentialsSchema', () => {
    it('should validate correct email and temporary password', () => {
      const validData = {
        email: 'test@example.com',
        temporaryPassword: 'TempPass123!',
      };

      const result = setPasswordCredentialsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        temporaryPassword: 'TempPass123!',
      };

      const result = setPasswordCredentialsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['email']);
        expect(result.error.issues[0]?.message).toBe('Invalid email address');
      }
    });

    it('should reject missing temporary password', () => {
      const invalidData = {
        email: 'test@example.com',
        temporaryPassword: '',
      };

      const result = setPasswordCredentialsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['temporaryPassword']);
        expect(result.error.issues[0]?.message).toBe('Temporary password required');
      }
    });
  });

  describe('setPasswordNewPasswordSchema', () => {
    it('should validate matching passwords meeting requirements', () => {
      const validData = {
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = setPasswordNewPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const invalidData = {
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
      };

      const result = setPasswordNewPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
        expect(result.error.issues[0]?.message).toBe('Passwords do not match');
      }
    });

    it('should reject password not meeting Cognito requirements', () => {
      const invalidData = {
        password: 'weak',
        confirmPassword: 'weak',
      };

      const result = setPasswordNewPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['password']);
      }
    });
  });
});
