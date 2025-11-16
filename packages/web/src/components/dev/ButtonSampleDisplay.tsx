import { Text } from '@web/components/text';

import type { ReactNode } from 'react';

interface ButtonSampleDisplayProps {
  /** Label for the button sample */
  label: string;
  /** Button element to display */
  children: ReactNode;
  /** Width of the label column @default 'w-32' */
  labelWidth?: string;
}

/**
 * Button sample display component (development only).
 *
 * Displays a button with a label in a consistent two-column layout.
 * Used in ButtonComponentsPage to demonstrate different button variations.
 *
 * @example
 * ```tsx
 * <ButtonSampleDisplay label="Primary">
 *   <Button variant="primary">Click Me</Button>
 * </ButtonSampleDisplay>
 * ```
 */
export function ButtonSampleDisplay({
  label,
  children,
  labelWidth = 'w-32',
}: ButtonSampleDisplayProps): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <div className={`${labelWidth} shrink-0`}>
        <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{label}</Text>
      </div>
      {children}
    </div>
  );
}
