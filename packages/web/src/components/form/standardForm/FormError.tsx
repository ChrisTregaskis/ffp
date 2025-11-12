import React from 'react';

export interface FormErrorProps {
  message?: string;
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
 * - Accessible error messaging
 */
export const FormError: React.FC<FormErrorProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
};
