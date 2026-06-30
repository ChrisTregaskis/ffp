import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { iconVar } from './prototype-labels';

interface DemonstrationBannerProps {
  children: React.ReactNode;
}

/**
 * Flags a page as a read-only demonstration rather than a management surface, so it
 * is not mistaken for somewhere settings are changed. Distinct from the global
 * "mock data" banner — this is about the page's purpose, not its data.
 */
export const DemonstrationBanner: React.FC<DemonstrationBannerProps> = ({ children }) => (
  <div className="mb-6 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
    <Icon name={Icons.ALERTTRIANGLE} styleProps={{ size: 'sm', colour: iconVar('warning') }} />
    <div className="flex-1">
      <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'warning' }}>
        Demonstration — not a management page
      </Text>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-0.5">
        {children}
      </Text>
    </div>
  </div>
);
