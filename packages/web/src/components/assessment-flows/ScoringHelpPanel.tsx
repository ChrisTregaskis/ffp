import React from 'react';

import type { ScoringDryRunMapping } from '@ffp/core';

import { Text } from '@web/components/atoms';
import { StaticAlert } from '@web/components/molecules';
import { SlideOver } from '@web/components/organisms';

import { ScoringRuleList } from './ScoringRuleList';

export interface ScoringHelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mappings?: ScoringDryRunMapping[];
}

export const ScoringHelpPanel: React.FC<ScoringHelpPanelProps> = ({
  isOpen,
  onClose,
  mappings,
}) => {
  const followsLevelRule =
    !!mappings && mappings.length > 0 && mappings.every((mapping) => mapping.level !== null);

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title="How scoring works"
      subtitle="How a member’s answers become their starting level"
    >
      <div className="space-y-6">
        {followsLevelRule ? (
          <section className="space-y-2">
            <Text as="p" variant="eyebrow">
              Two steps
            </Text>
            <Text as="p" styleProps={{ size: 'sm' }}>
              1. The activity answers are tallied. Each answer scores lower, middle or higher, and
              the most frequent of the three sets the base level: mostly lower is Level 1, mostly
              middle is Level 2 and mostly higher is Level 3. With no clear majority, one of each,
              the tally sits in the middle at Level 2.
            </Text>
            <Text as="p" styleProps={{ size: 'sm' }}>
              2. Age can move the level up. A member under 40 starts one level higher, up to Level
              3; from 40 the base level stands.
            </Text>
          </section>
        ) : (
          <Text as="p" styleProps={{ size: 'sm' }}>
            Each score is worked out from its questions’ answer scores, and the first of this flow’s
            rules whose scores all hold decides the programme a member is recommended.
          </Text>
        )}

        {mappings && mappings.length > 0 && (
          <section className="space-y-2">
            <Text as="p" variant="eyebrow">
              This flow’s rules
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              The rules are checked in order, and the first whose scores all hold decides the
              result.
            </Text>
            <ScoringRuleList mappings={mappings} />
          </section>
        )}

        <StaticAlert
          variant="info"
          appearance="soft"
          message="Scoring is changed in the question bank, by editing the scores on the answer options of the questions it reads (for the level rule, the activity questions), not on this page. This page only shows what a set of answers would come to."
        />
      </div>
    </SlideOver>
  );
};
