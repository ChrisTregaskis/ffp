import {
  type LoginFormData,
  type SetPasswordCredentialsData,
  type SetPasswordNewPasswordData,
} from '@web/schemas/auth.schema';

import { type Field, FieldDataType } from '../form';

/**
 * Re-export form data types from schema for convenience
 */
export type { LoginFormData, SetPasswordCredentialsData, SetPasswordNewPasswordData };

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
      pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, // TODO: Move to Constant?
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
      pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
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
 * Set password form field configuration (Step 2: New Password)
 */
export const setPasswordNewPasswordFields: Field<SetPasswordNewPasswordData>[] = [
  {
    order: 1,
    name: 'password',
    label: 'New password',
    dataType: FieldDataType.PASSWORD,
    placeholder: 'Create a secure password',
    validation: {
      isRequired: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, // TODO: Move to Constant?
    },
  },
  {
    order: 2,
    name: 'confirmPassword',
    label: 'Confirm password',
    dataType: FieldDataType.PASSWORD,
    placeholder: 'Re-enter your password',
    validation: {
      isRequired: true,
    },
  },
];
