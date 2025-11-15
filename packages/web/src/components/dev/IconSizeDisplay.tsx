import type { ReactNode } from 'react';

interface IconSizeDisplayProps {
  icon: ReactNode;
  label: string;
}

/**
 * Icon size display component (development only).
 *
 * Displays an icon with its size label in a centered column layout.
 * Used in the IconComponentsPage to demonstrate different icon sizes.
 *
 * @example
 * ```tsx
 * <IconSizeDisplay
 *   icon={<Icon name={Icons.ARROW_RIGHT} styleProps={{ size: 'md' }} />}
 *   label="md (20px)"
 * />
 * ```
 */
export function IconSizeDisplay({ icon, label }: IconSizeDisplayProps): JSX.Element {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <span className="mt-2 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
