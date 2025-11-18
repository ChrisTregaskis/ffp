import { z } from 'zod';

/**
 * Login form validation schema
 *
 * Validates email format and ensures password is provided.
 * Used with react-hook-form for client-side validation.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g., !@#$%^&*)');

/**
 * Set password form validation schema (Step 1: Credentials)
 *
 * Used when user first enters their email and temporary password.
 */
export const setPasswordCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  email: z.string().email('Invalid email address'),
  temporaryPassword: z.string().min(1, 'Temporary password required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
});

/**
 * Inferred TypeScript types
 */
export type SetPasswordCredentialsData = z.infer<typeof setPasswordCredentialsSchema>;
export type SetPasswordNewPasswordData = z.infer<typeof setPasswordNewPasswordSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
