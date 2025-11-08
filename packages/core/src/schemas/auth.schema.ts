import { z } from 'zod';

/**
 * Password validation schema that matches Cognito requirements.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special character (symbol)
 */
export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * Schema for user login.
 *
 * Validates email format and ensures password is provided.
 * Note: Full password validation (strength) is only checked during registration/password change,
 * not during login (to allow users with legacy passwords to still log in).
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for refreshing authentication tokens.
 *
 * Validates that a refresh token is provided.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * TypeScript type inferred from loginSchema
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * TypeScript type inferred from refreshTokenSchema
 */
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
