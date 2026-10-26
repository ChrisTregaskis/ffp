import { z } from 'zod';

import {
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER_PATTERN,
  PASSWORD_SPECIAL_CHAR_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
} from '../lib/constants';

export const passwordValidation = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`)
  .regex(PASSWORD_LOWERCASE_PATTERN, 'Password must contain at least one lowercase letter')
  .regex(PASSWORD_UPPERCASE_PATTERN, 'Password must contain at least one uppercase letter')
  .regex(PASSWORD_NUMBER_PATTERN, 'Password must contain at least one digit')
  .regex(PASSWORD_SPECIAL_CHAR_PATTERN, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const completeNewPasswordSchema = z.object({
  session: z.string().min(1, 'Session is required'),
  email: z.email(),
  newPassword: passwordValidation,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CompleteNewPasswordInput = z.infer<typeof completeNewPasswordSchema>;
