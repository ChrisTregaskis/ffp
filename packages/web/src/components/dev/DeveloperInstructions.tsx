import { Title } from '@web/components/text';

import type { ReactNode } from 'react';

interface DeveloperInstructionsProps {
  title?: string;
  children: ReactNode;
}

/**
 * Developer instructions panel (development only).
 *
 * Displays helpful developer information, usage instructions,
 * or implementation guidance in a consistent info panel.
 */
export const DeveloperInstructions: React.FC<DeveloperInstructionsProps> = ({
  title = 'Developer Instructions',
  children,
}) => {
  return (
    <div className="rounded-lg bg-info/10 p-6">
      <Title as="h3" colour="info" className="mb-3">
        {title}
      </Title>
      <div className="text-info text-sm">{children}</div>
    </div>
  );
};
