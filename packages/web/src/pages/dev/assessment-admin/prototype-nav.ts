import { Icons } from '@web/components/Icon';

import type { PrototypeView } from './prototype-types';

export interface NavEntry {
  label: string;
  icon: Icons;
  active: boolean;
  onClick: () => void;
}

type Navigate = (view: PrototypeView) => void;

/** Scoring is the only flow-scoped screen the prototype still carries. */
export const PROTOTYPE_ENTRY_FLOW_ID = 'f-exercise-assessment';

/** Top-level menu items (shown when not inside a flow / question). */
export const getMainNav = (view: PrototypeView, navigate: Navigate): NavEntry[] => [
  {
    label: 'Scoring',
    icon: Icons.TARGET,
    active: view.name === 'scoring',
    onClick: () => {
      navigate({ name: 'scoring', flowId: PROTOTYPE_ENTRY_FLOW_ID });
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
  {
    label: 'Video library',
    icon: Icons.VIDEO,
    active: view.name === 'video-library',
    onClick: () => {
      navigate({ name: 'video-library' });
    },
  },
  {
    label: 'Member programmes',
    icon: Icons.USERS,
    active: view.name === 'member-programmes' || view.name === 'member-programme',
    onClick: () => {
      navigate({ name: 'member-programmes' });
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

  if (view.name === 'member-programme') {
    return [
      {
        label: 'Back to member programmes',
        icon: Icons.ARROWLEFT,
        active: false,
        onClick: () => {
          navigate({ name: 'member-programmes' });
        },
      },
    ];
  }

  if (view.name === 'member-programme-phase') {
    const { memberId } = view;

    return [
      {
        label: 'Back to programme',
        icon: Icons.ARROWLEFT,
        active: false,
        onClick: () => {
          navigate({ name: 'member-programme', memberId });
        },
      },
    ];
  }

  return null;
};
