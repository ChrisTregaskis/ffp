import { useState, type ReactNode } from 'react';

export interface DemoTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab button */
  label: string;
  /** Content to render when tab is active */
  content: ReactNode;
}

export interface DemoTabsProps {
  /** Array of tabs to display */
  tabs: DemoTab[];
  /** Optional default tab ID (defaults to first tab) */
  defaultTab?: string;
}

/**
 * Simple tabs component for dev demo pages.
 *
 * NOT for production use - dev demo pages only.
 *
 * @example
 * ```tsx
 * <DemoTabs
 *   tabs={[
 *     { id: 'basic', label: 'Basic', content: <BasicDemo /> },
 *     { id: 'error', label: 'With Error', content: <ErrorDemo /> },
 *   ]}
 * />
 * ```
 */
export const DemoTabs: React.FC<DemoTabsProps> = ({ tabs, defaultTab }) => {
  const getInitialTab = (): string => {
    if (defaultTab) {
      return defaultTab;
    }

    if (tabs.length > 0) {
      return tabs[0].id;
    }

    return '';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={`
                px-4 py-2 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-lg border border-border bg-card p-6">{activeContent}</div>
    </div>
  );
};
