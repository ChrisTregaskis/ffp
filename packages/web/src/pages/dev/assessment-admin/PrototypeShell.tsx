import { useState } from 'react';

import { Icon, Icons, Logo, Text } from '@web/components/atoms';

import { ProgrammeModelsView } from './ProgrammeModelsView';
import { iconVar } from './prototype-labels';
import { PrototypeNavItem } from './PrototypeNavItem';

/**
 * Chrome for the prototype: a navy side menu (mirroring the real `SideMenu`)
 * plus the active-view content area.
 */
export const PrototypeShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Side menu — always shown (desktop-only admin prototype) */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white bg-ffp-navy shadow-md ${
          isCollapsed ? 'w-20' : 'w-[230px]'
        }`}
      >
        {/* Brand header */}
        <div
          className={`flex items-center gap-3 border-b border-white/20 py-5 text-white ${
            isCollapsed ? 'justify-center' : 'px-4'
          }`}
        >
          <Logo variant="white" size="xs" className="h-5 w-auto" />
          {!isCollapsed && (
            <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'white' }}>
              Assessment admin
            </Text>
          )}
        </div>

        {/* Nav */}
        <nav className="w-full flex-1 overflow-y-auto">
          <div className="flex w-full flex-col">
            <PrototypeNavItem
              label="Programme models"
              icon={Icons.CLIPBOARDLIST}
              active
              isCollapsed={isCollapsed}
              // eslint-disable-next-line @typescript-eslint/no-empty-function -- the only view
              onClick={() => {}}
            />
          </div>
        </nav>

        {/* Footer: collapse toggle */}
        <div className="py-4">
          <button
            type="button"
            onClick={() => {
              setIsCollapsed((prev) => !prev);
            }}
            aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
            className={`flex w-full items-center gap-3 py-3 text-white transition-colors duration-150 hover:bg-secondary ${
              isCollapsed ? 'justify-center' : 'px-4'
            }`}
          >
            <Icon
              name={isCollapsed ? Icons.LEFTPANELOPEN : Icons.LEFTPANELCLOSE}
              styleProps={{ size: 'md', colour: 'currentColor' }}
            />
            {!isCollapsed && (
              <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'white' }}>Collapse</Text>
            )}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main
        className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[230px]'}`}
      >
        {/* Dev banner */}
        <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-6 py-2">
          <Icon
            name={Icons.ALERTTRIANGLE}
            styleProps={{ size: 'sm', colour: iconVar('warning') }}
          />
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'warning' }}>
            UX prototype — mock data only, nothing is saved.
          </Text>
          <a href="/components" className="ml-auto">
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              ← Back to Components
            </Text>
          </a>
        </div>

        <div className="px-6 py-8">
          <ProgrammeModelsView />
        </div>
      </main>
    </div>
  );
};
