import React from 'react';

import { FieldError } from '@web/components/atoms/FieldError';
import { Text } from '@web/components/text';

import type { ReactNode } from 'react';

export interface FormFieldProps {
  /** The id of the input element this label is for */
  htmlFor: string;
  /** Field label text */
  label: string;
  /** Whether the field is required (shows asterisk) */
  isRequired?: boolean;
  /** Short guidance shown under the control */
  hint?: string;
  /** Id for the hint element (for aria-describedby) */
  hintId?: string;
  /** Error message to display */
  error?: string;
  /** Id for the error element (for aria-describedby) */
  errorId?: string;
  /** The form control(s) to render */
  children: ReactNode;
  /** Additional wrapper class names */
  className?: string;
}

/**
 * Shared wrapper for form fields providing consistent label, required indicator, hint and error display.
 */
export const FormField: React.FC<FormFieldProps> = ({
  htmlFor,
  label,
  isRequired,
  hint,
  hintId,
  error,
  errorId,
  children,
  className,
}) => (
  <div className={className ?? 'mb-4'}>
    <label htmlFor={htmlFor} className="block mb-1">
      <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>{label}</Text>
      {isRequired && (
        <Text styleProps={{ colour: 'destructive' }} className="ml-1">
          *
        </Text>
      )}
    </label>

    {children}

    {hint && (
      <Text
        as="p"
        id={hintId}
        styleProps={{ size: 'xs', colour: 'muted-foreground' }}
        className="mt-1"
      >
        {hint}
      </Text>
    )}

    {error && <FieldError id={errorId} message={error} />}
  </div>
);
