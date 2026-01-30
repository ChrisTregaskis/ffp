import type { ReactNode } from 'react';

export interface OptionLabelProps {
  /** HTML for attribute linking to the input */
  htmlFor: string;
  /** Whether this option is currently selected */
  isSelected: boolean;
  /** Whether the parent question has a validation error */
  hasError?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Child elements (input + label text) */
  children: ReactNode;
}

/**
 * Reusable option label wrapper for choice-based questions.
 *
 * Provides consistent card-style styling for radio and checkbox options.
 */
export const OptionLabel: React.FC<OptionLabelProps> = ({
  htmlFor,
  isSelected,
  hasError = false,
  disabled = false,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className={`
      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
      transition-all duration-200
      ${
        isSelected
          ? 'border-primary bg-secondary/30 shadow-md'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }
      ${hasError && !isSelected ? 'border-destructive/50' : ''}
      ${disabled ? 'cursor-not-allowed opacity-60' : ''}
    `}
  >
    {children}
  </label>
);
