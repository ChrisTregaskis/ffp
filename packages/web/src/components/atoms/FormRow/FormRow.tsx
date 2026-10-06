import type React from 'react';
import type { ReactNode } from 'react';

const COLUMN_CLASSES: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
};

export interface FormRowProps {
  /** Number of columns at sm breakpoint @default 2 */
  columns?: 2 | 3;
  /** Child form fields */
  children: ReactNode;
}

/** Responsive grid row for laying out form fields side by side */
export const FormRow: React.FC<FormRowProps> = ({ columns = 2, children }) => (
  <div className={`grid grid-cols-1 gap-4 ${COLUMN_CLASSES[columns]}`}>{children}</div>
);
