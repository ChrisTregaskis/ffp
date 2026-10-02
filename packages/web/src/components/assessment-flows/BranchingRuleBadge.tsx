import React from 'react';

import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface BranchingRuleBadgeProps {
  ruleCount: number;
}

/** The step routes conditionally. The rules are not editable here. */
export const BranchingRuleBadge: React.FC<BranchingRuleBadgeProps> = ({ ruleCount }) => {
  if (ruleCount <= 0) {
    return null;
  }

  return (
    <span
      className="flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-0.5"
      title="This step routes conditionally. Rules are not editable here."
    >
      <Icon name={Icons.REPEAT} styleProps={{ size: 'xs', colour: 'var(--color-info)' }} />
      <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'info' }}>
        {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
      </Text>
    </span>
  );
};
