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
 * @example
 * ```tsx
 * <TextSampleDisplay label="xs">
 *   <Text styleProps={{ size: 'xs' }}>Sample text</Text>
 * </TextSampleDisplay>
 * ```
 */
export function TextSampleDisplay({
  label,
  children,
  labelWidth = 'w-16',
}: TextSampleDisplayProps): JSX.Element {
  return (
    <div className="flex items-baseline gap-4">
      <div className={`${labelWidth} shrink-0`}>
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>{label}</Text>
      </div>
      {children}
    </div>
  );
}
