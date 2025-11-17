import { Text } from '@web/components/text';

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
 */
export const IconSizeDisplay: React.FC<IconSizeDisplayProps> = ({ icon, label }) => {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <Text className="mt-2" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
        {label}
      </Text>
    </div>
  );
};
