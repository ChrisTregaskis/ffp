import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text/Text';

import type { ReactNode } from 'react';

/**
 * Static mock sidebar for discovery prototypes.
 * Simulates the production AppLayout side navigation.
 * Non-interactive — just for visual context.
 */

interface MockNavItemProps {
  icon: (typeof Icons)[keyof typeof Icons];
  label: string;
  active?: boolean;
}

const MockNavItem: React.FC<MockNavItemProps> = ({ icon, label, active = false }) => (
  <div
    className={`flex w-full items-center gap-3 px-4 py-3 text-white transition-colors duration-150 ${
      active ? 'bg-primary' : ''
    }`}
  >
    <Icon name={icon} styleProps={{ size: 'md', colour: 'currentColor' }} />
    <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'white' }}>{label}</Text>
  </div>
);

interface MockSideNavLayoutProps {
  children: ReactNode;
  activeItem: 'dashboard' | 'programme' | 'progress';
}

export const MockSideNavLayout: React.FC<MockSideNavLayoutProps> = ({ children, activeItem }) => (
  <div className="flex min-h-screen">
    {/* Static sidebar */}
    <aside className="hidden w-[230px] flex-shrink-0 lg:block">
      <div className="fixed left-0 top-0 flex h-screen w-[230px] flex-col border-r border-white bg-ffp-navy">
        {/* Logo header */}
        <div className="flex items-center gap-3 border-b border-white/20 p-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Icon name={Icons.HEART} styleProps={{ size: 'sm', colour: '#ffffff' }} />
          </div>
          <Text styleProps={{ size: 'sm', weight: 'bold', colour: 'white' }}>Fit For Purpose</Text>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-1 py-4">
          <MockNavItem icon={Icons.HOME} label="Dashboard" active={activeItem === 'dashboard'} />
          <MockNavItem
            icon={Icons.CLIPBOARDLIST}
            label="My Programme"
            active={activeItem === 'programme'}
          />
          <MockNavItem icon={Icons.ACTIVITY} label="Progress" active={activeItem === 'progress'} />
        </nav>

        {/* Footer nav */}
        <div className="space-y-1 border-t border-white/20 py-4">
          <MockNavItem icon={Icons.SETTINGS} label="Settings" />
          <MockNavItem icon={Icons.LOGOUT} label="Sign Out" />
        </div>
      </div>
    </aside>

    {/* Main content */}
    <main className="flex-1">{children}</main>
  </div>
);
