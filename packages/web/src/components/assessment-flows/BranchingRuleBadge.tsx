import React from 'react';

import { Badge, Icons } from '@web/components/atoms';

export interface BranchingRuleBadgeProps {
  ruleCount: number;
}

/** The step routes conditionally. The rules are not editable here. */
export const BranchingRuleBadge: React.FC<BranchingRuleBadgeProps> = ({ ruleCount }) => {
  if (ruleCount <= 0) {
    return null;
  }

  return (
    <Badge
      label={`${String(ruleCount)} ${ruleCount === 1 ? 'rule' : 'rules'}`}
      icon={Icons.REPEAT}
      variant="info"
      title="This step routes conditionally. Rules are not editable here."
    />
  );
};
