import { Text } from '@web/components/text/Text';

import type { ReactNode } from 'react';

export interface LabelledSectionProps {
  /** Uppercase section label (e.g., "Setup", "Execution") */
  label: string;
  /** Section content — string rendered as text, or ReactNode for custom content */
  children: ReactNode;
}

/**
 * Labelled content section with uppercase heading and body text.
 *
 * Used for structured content like exercise instructions (Setup, Execution, Tips).
 */
export const LabelledSection: React.FC<LabelledSectionProps> = ({ label, children }) => (
  <div>
    <Text
      as="h4"
      styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
      className="mb-1 uppercase tracking-wide"
    >
      {label}
    </Text>
    {typeof children === 'string' ? (
      <Text as="p" styleProps={{ size: 'sm' }}>
        {children}
      </Text>
    ) : (
      children
    )}
  </div>
);
