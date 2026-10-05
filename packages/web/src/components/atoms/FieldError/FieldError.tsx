import React from 'react';

import { Text } from '../Text';

export interface FieldErrorProps {
  message: string;
  /** Referenced by the control's `aria-describedby` */
  id?: string;
}

/** The validation message under a form control. */
export const FieldError: React.FC<FieldErrorProps> = ({ message, id }) => (
  <Text
    as="p"
    id={id}
    styleProps={{ size: 'sm', colour: 'destructive' }}
    className="mt-1"
    role="alert"
  >
    {message}
  </Text>
);
