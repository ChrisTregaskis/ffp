import { Icons } from '@web/components/atoms';

import type { PrototypeView } from './prototype-types';

export interface NavEntry {
  label: string;
  icon: Icons;
  active: boolean;
  onClick: () => void;
}

type Navigate = (view: PrototypeView) => void;

export const PROTOTYPE_HOME_VIEW: PrototypeView = { name: 'member-programmes' };

/** Top-level menu items (shown when not inside a sub-section). */
export const getMainNav = (view: PrototypeView, navigate: Navigate): NavEntry[] => [
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
