import React from 'react';

import { Text } from '../Text';

export interface FieldErrorProps {
  message: string;
  /** Referenced by the control's `aria-describedby` */
  id?: string;
  /** Fades in from above, and leaves the space above it to the parent's stack */
  animated?: boolean;
}

/** The validation message under a form control. */
export const FieldError: React.FC<FieldErrorProps> = ({ message, id, animated = false }) => (
  <Text
    as="p"
    id={id}
    styleProps={{ size: 'sm', colour: 'destructive' }}
    className={animated ? 'animate-in fade-in slide-in-from-top-2 duration-200' : 'mt-1'}
    role="alert"
  >
    {message}
  </Text>
);
