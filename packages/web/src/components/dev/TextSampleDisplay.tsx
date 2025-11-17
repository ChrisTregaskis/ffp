import { Text } from '@web/components/text';

import type { ReactNode } from 'react';

interface TextSampleDisplayProps {
  /** Label for the text sample */
  label: string;
  /** Content to display */
  children: ReactNode;
  /** Width of the label column @default 'w-16' */
  labelWidth?: string;
}

/**
 * Text sample display component (development only).
 *
 * Displays a text sample with a label in a consistent two-column layout.
 * Used in TextComponentsPage to demonstrate different text variations.
 *
 */
export const TextSampleDisplay: React.FC<TextSampleDisplayProps> = ({
  label,
  children,
  labelWidth = 'w-16',
}) => {
  return (
    <div className="flex items-baseline gap-4">
      <div className={`${labelWidth} shrink-0`}>
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>{label}</Text>
      </div>
      {children}
    </div>
  );
};
