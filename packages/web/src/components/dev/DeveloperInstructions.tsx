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
 *
 * @example
 * ```tsx
 * <DeveloperInstructions title="Developer Tools">
 *   <ul className="space-y-1 text-sm text-blue-700">
 *     <li>• Check browser console for logs</li>
 *     <li>• Use React DevTools to inspect state</li>
 *   </ul>
 * </DeveloperInstructions>
 * ```
 */
export function DeveloperInstructions({
  title = 'Developer Instructions',
  children,
}: DeveloperInstructionsProps): JSX.Element {
  return (
    <div className="rounded-lg bg-blue-50 p-6">
      <Title as="h3" className="mb-3 text-blue-900">
        {title}
      </Title>
      <div className="text-sm text-blue-700">{children}</div>
    </div>
  );
}
