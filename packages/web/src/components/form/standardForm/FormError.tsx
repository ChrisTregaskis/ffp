import React from 'react';

import { Text } from '@web/components/text';

export interface FormErrorProps {
  message?: string;
  id?: string; // For linking to input via aria-describedby
}

/**
 * Form-level error display component
 *
 * Use this for displaying general form errors (e.g., API errors, submission failures)
 * that aren't specific to a single field.
 *
 * Features:
 * - Styled error banner
 * - Conditionally rendered (only shows when message provided)
 * - Accessible error messaging with optional id for aria-describedby
 */
export const FormError: React.FC<FormErrorProps> = ({ message, id }) => {
  if (!message) {
    return null;
  }

  return (
    <div id={id} className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
      <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }}>
        {message}
      </Text>
    </div>
  );
};
