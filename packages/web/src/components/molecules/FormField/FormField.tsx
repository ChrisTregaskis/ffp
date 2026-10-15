import React from 'react';

import { Text, FieldError, Label } from '@web/components/atoms';

import type { ReactNode } from 'react';

export interface FormFieldProps {
  /** The id of the input element this label is for */
  htmlFor: string;
  /** Field label text */
  label: string;
  /** Whether the field is required (shows asterisk) */
  isRequired?: boolean;
  /** Shown at the far end of the label row, such as a password's strength */
  labelAside?: ReactNode;
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
  labelAside,
  hint,
  hintId,
  error,
  errorId,
  children,
  className,
}) => (
  <div className={className ?? 'mb-4'}>
    {labelAside ? (
      <div className="mb-1 flex items-center justify-between">
        <Label htmlFor={htmlFor} isRequired={isRequired}>
          {label}
        </Label>
        {labelAside}
      </div>
    ) : (
      <Label htmlFor={htmlFor} isRequired={isRequired} className="block mb-1">
        {label}
      </Label>
    )}

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
