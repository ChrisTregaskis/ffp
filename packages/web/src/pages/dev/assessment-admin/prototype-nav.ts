import { Icons } from '@web/components/Icon';

import type { PrototypeView } from './prototype-types';

export interface NavEntry {
  label: string;
  icon: Icons;
  active: boolean;
  onClick: () => void;
}

type Navigate = (view: PrototypeView) => void;

/** Top-level menu items (shown when not inside a flow / question). */
export const getMainNav = (view: PrototypeView, navigate: Navigate): NavEntry[] => [
  {
    label: 'Flows',
    icon: Icons.CLIPBOARDLIST,
    active: view.name === 'flows',
    onClick: () => {
      navigate({ name: 'flows' });
    },
  },
  {
    label: 'Question bank',
    icon: Icons.HELPCIRCLE,
    active: view.name === 'questions',
    onClick: () => {
      navigate({ name: 'questions' });
    },
  },
  {
    label: 'Templates',
    icon: Icons.FILETEXT,
    active: view.name === 'templates',
    onClick: () => {
      navigate({ name: 'templates' });
    },
  },
];

/**
 * Context nav that *replaces* the main nav when inside a sub-section —
 * mirrors how programme-templates swaps the sidebar for a back link + siblings.
 * Returns null at top level (use the main nav then).
 */
export const getContextNav = (view: PrototypeView, navigate: Navigate): NavEntry[] | null => {
  if (view.name === 'question-edit') {
    return [
      {
        label: 'Back to question bank',
        icon: Icons.ARROWLEFT,
        active: false,
        onClick: () => {
          navigate({ name: 'questions' });
        },
      },
    ];
  }

  if (view.name === 'template-edit') {
    return [
      {
        label: 'Back to templates',
        icon: Icons.ARROWLEFT,
        active: false,
        onClick: () => {
          navigate({ name: 'templates' });
        },
      },
    ];
  }

  const inFlow =
    view.name === 'flow-meta' ||
    view.name === 'flow-builder' ||
    view.name === 'scoring' ||
    view.name === 'step-edit';

  if (!inFlow) {
    return null;
  }

  const backToFlows: NavEntry = {
    label: 'Back to flows',
    icon: Icons.ARROWLEFT,
    active: false,
    onClick: () => {
      navigate({ name: 'flows' });
    },
  };

  // A flow being created has no builder/scoring yet — just the back link.
  if (view.name === 'flow-meta' && view.flowId === 'new') {
    return [
      backToFlows,
      { label: 'New flow', icon: Icons.FILETEXT, active: true, onClick: () => undefined },
    ];
  }

  const flowId = view.flowId;

  return [
    backToFlows,
    {
      label: 'Edit details',
      icon: Icons.FILETEXT,
      active: view.name === 'flow-meta',
      onClick: () => {
        navigate({ name: 'flow-meta', flowId });
      },
    },
    {
      label: 'Build steps',
      icon: Icons.CLIPBOARDLIST,
      active: view.name === 'flow-builder' || view.name === 'step-edit',
      onClick: () => {
        navigate({ name: 'flow-builder', flowId });
      },
    },
    {
      label: 'Scoring',
      icon: Icons.TARGET,
      active: view.name === 'scoring',
      onClick: () => {
        navigate({ name: 'scoring', flowId });
      },
    },
  ];
};
