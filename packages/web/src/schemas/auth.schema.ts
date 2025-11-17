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
