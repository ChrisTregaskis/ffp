import { z } from 'zod';

import {
  EMAIL_PATTERN,
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER_PATTERN,
  PASSWORD_SPECIAL_CHAR_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from '@ffp/core';

/**
 * Login form validation schema
 *
 * Validates email format and ensures password is provided.
 * Used with react-hook-form for client-side validation.
 */
export const loginSchema = z.object({
  email: z.string().regex(EMAIL_PATTERN, 'Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

/**
 * Inferred TypeScript type from login schema
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Password validation schema matching Cognito requirements.
 *
 * Cognito default password policy requires:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH.toString()} characters`
  )
  .regex(PASSWORD_UPPERCASE_PATTERN, 'Password must contain at least one uppercase letter')
  .regex(PASSWORD_LOWERCASE_PATTERN, 'Password must contain at least one lowercase letter')
  .regex(PASSWORD_NUMBER_PATTERN, 'Password must contain at least one number')
  .regex(
    PASSWORD_SPECIAL_CHAR_PATTERN,
    'Password must contain at least one special character (e.g., !@#$%^&*)'
  );

/**
 * Set password form validation schema (Step 1: Credentials)
 *
 * Used when user first enters their email and temporary password.
 */
export const setPasswordCredentialsSchema = z.object({
  email: z.string().regex(EMAIL_PATTERN, 'Invalid email address'),
  temporaryPassword: z.string().min(1, 'Temporary password required'),
});

/**
 * Set password form validation schema (Step 2: New Password)
 *
 * Used when user sets their new password after temporary password is verified.
 * Includes password confirmation validation.
 */
export const setPasswordNewPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Combined set password form data (both steps)
 */
export const setPasswordSchema = z.object({
  email: z.string().regex(EMAIL_PATTERN, 'Invalid email address'),
  temporaryPassword: z.string().min(1, 'Temporary password required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().regex(EMAIL_PATTERN, 'Invalid email address'),
});

export const forgotPasswordConfirmSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Verification code is required')
      .regex(/^\d{6}$/, 'Code must be 6 digits'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetPasswordCredentialsData = z.infer<typeof setPasswordCredentialsSchema>;
export type SetPasswordNewPasswordData = z.infer<typeof setPasswordNewPasswordSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
export type ForgotPasswordRequestData = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordConfirmData = z.infer<typeof forgotPasswordConfirmSchema>;
