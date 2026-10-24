import React from 'react';

import { Text } from '@web/components/atoms';

export interface NavGroupHeadingProps {
  label: string;
  /** A collapsed sidebar has no room for the label, so a rule marks the group instead */
  isCollapsed?: boolean;
}

/** The heading above a group of navigation items */
export const NavGroupHeading: React.FC<NavGroupHeadingProps> = ({ label, isCollapsed = false }) =>
  isCollapsed ? (
    <div role="separator" aria-label={label} className="mx-4 my-2 border-t border-white/20" />
  ) : (
    <Text
      as="p"
      styleProps={{ size: 'xs', weight: 'semibold', colour: 'white' }}
      className="px-5 pb-1 pt-4 uppercase tracking-wide opacity-60"
    >
      {label}
    </Text>
  );
