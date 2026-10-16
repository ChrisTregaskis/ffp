import type { ReactNode } from 'react';

export interface AssessmentBackdropProps {
  /** Layout classes for the backdrop, e.g. its height or how it places its content */
  className?: string;
  children: ReactNode;
}

/** The soft gradient behind every full-screen assessment state. */
export const AssessmentBackdrop: React.FC<AssessmentBackdropProps> = ({
  className = '',
  children,
}) => (
  <div className={`bg-linear-to-br from-muted/30 via-secondary/10 to-muted/30 ${className}`.trim()}>
    {children}
  </div>
);
