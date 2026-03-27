import { EMAIL_PATTERN } from '@ffp/core';

import {
  type LoginFormData,
  type SetPasswordCredentialsData,
  type ForgotPasswordRequestData,
} from '@web/schemas/auth.schema';

import { type Field, FieldDataType } from '../form';

/**
 * Re-export form data types from schema for convenience
 */
export type { LoginFormData, SetPasswordCredentialsData, ForgotPasswordRequestData };

/**
 * Login form field configuration
 */
export const loginFields: Field<LoginFormData>[] = [
  {
    order: 1,
    name: 'email',
    label: 'Email',
    dataType: FieldDataType.STRING,
    placeholder: 'name@example.com',
    validation: {
      isRequired: true,
      pattern: EMAIL_PATTERN,
    },
  },
  {
    order: 2,
    name: 'password',
    label: 'Password',
    dataType: FieldDataType.PASSWORD,
    placeholder: '••••••••',
    validation: {
      isRequired: true,
    },
  },
];

/**
 * Set password form field configuration (Step 1: Credentials)
 */
export const setPasswordCredentialsFields: Field<SetPasswordCredentialsData>[] = [
  {
    order: 1,
    name: 'email',
    label: 'Email',
    dataType: FieldDataType.STRING,
    placeholder: 'name@example.com',
    validation: {
      isRequired: true,
      pattern: EMAIL_PATTERN,
    },
  },
  {
    order: 2,
    name: 'temporaryPassword',
    label: 'Temporary password',
    dataType: FieldDataType.PASSWORD,
    placeholder: 'Enter temporary password from email',
    validation: {
      isRequired: true,
    },
  },
];

/**
 * Forgot password form field configuration (Step 1: Request code)
 */
export const forgotPasswordRequestFields: Field<ForgotPasswordRequestData>[] = [
  {
    order: 1,
    name: 'email',
    label: 'Email',
    dataType: FieldDataType.STRING,
    placeholder: 'name@example.com',
    validation: {
      isRequired: true,
      pattern: EMAIL_PATTERN,
    },
  },
];
