import { type LoginFormData } from '@web/schemas/auth.schema';

import { type Field, FieldDataType } from '../form';

/**
 * Re-export LoginFormData from schema for convenience
 */
export type { LoginFormData };

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
      pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
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
