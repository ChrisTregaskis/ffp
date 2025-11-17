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
 * or implementation guidance in a consistent blue info panel.
 */
export const DeveloperInstructions: React.FC<DeveloperInstructionsProps> = ({
  title = 'Developer Instructions',
  children,
}) => {
  return (
    <div className="rounded-lg bg-blue-50 p-6">
      <Title as="h3" className="mb-3 text-blue-900">
        {title}
      </Title>
      <div className="text-sm text-blue-700">{children}</div>
    </div>
  );
};
