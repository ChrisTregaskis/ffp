import type { ReactNode } from 'react';

export interface PanelProps {
  /** Panel content */
  children: ReactNode;
  /** Additional custom classes */
  className?: string;
}

/**
 * Lightweight surface primitive — rounded border on a white background.
 *
 * Use for toolbars, control bars, and grouped content that doesn't
 * need the weight of a full Card (shadow, title, subtitle).
 */
export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => (
  <div className={`rounded-lg border border-muted bg-white p-3 ${className}`.trim()}>
    {children}
  </div>
);
