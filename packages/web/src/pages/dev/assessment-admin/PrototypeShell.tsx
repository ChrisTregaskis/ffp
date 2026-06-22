import { useState } from 'react';

import { Icon, Icons } from '@web/components/Icon';
import { Logo } from '@web/components/logo';
import { Text } from '@web/components/text';

import { FlowBuilderView } from './FlowBuilderView';
import { FlowListView } from './FlowListView';
import { FlowMetadataView } from './FlowMetadataView';
import { iconVar } from './prototype-labels';
import { getContextNav, getMainNav } from './prototype-nav';
import { PrototypeNavItem } from './PrototypeNavItem';
import { usePrototypeStore } from './PrototypeStore';
import { QuestionBankView } from './QuestionBankView';
import { QuestionEditorView } from './QuestionEditorView';
import { ScoringConfigView } from './ScoringConfigView';
import { StepEditView } from './StepEditView';
import { TemplateDetailView } from './TemplateDetailView';
import { TemplateListView } from './TemplateListView';

import type { PrototypeView } from './prototype-types';

const renderView = (view: PrototypeView): JSX.Element => {
  switch (view.name) {
    case 'flows':
      return <FlowListView />;
    case 'flow-meta':
      return <FlowMetadataView flowId={view.flowId} />;
    case 'flow-builder':
      return <FlowBuilderView flowId={view.flowId} />;
    case 'step-edit':
      return <StepEditView flowId={view.flowId} stepId={view.stepId} />;
    case 'scoring':
      return <ScoringConfigView flowId={view.flowId} />;
    case 'questions':
      return <QuestionBankView />;
    case 'question-edit':
      return <QuestionEditorView questionId={view.questionId} />;
    case 'templates':
      return <TemplateListView />;
    case 'template-edit':
      return <TemplateDetailView templateId={view.templateId} />;
    default:
      return <FlowListView />;
  }
};

/**
 * Chrome for the prototype: a navy side menu (mirroring the real `SideMenu`)
 * whose nav swaps to context links when inside a flow / question, plus the
 * active-view content area.
 */
export const PrototypeShell: React.FC = () => {
  const { view, navigate } = usePrototypeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const contextNav = getContextNav(view, navigate);
  const navItems = contextNav ?? getMainNav(view, navigate);

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Side menu — always shown (desktop-only admin prototype) */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white bg-ffp-navy shadow-md ${
          isCollapsed ? 'w-20' : 'w-[230px]'
        }`}
      >
        {/* Brand header */}
        <button
          type="button"
          onClick={() => {
            navigate({ name: 'flows' });
          }}
          aria-label="Assessment authoring home"
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
        </button>

        {/* Nav (main or context) */}
        <nav className="w-full flex-1 overflow-y-auto">
          <div className="flex w-full flex-col">
            {navItems.map((item) => (
              <PrototypeNavItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                active={item.active}
                isCollapsed={isCollapsed}
                onClick={item.onClick}
              />
            ))}
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

        <div className="px-6 py-8">{renderView(view)}</div>
      </main>
    </div>
  );
};
