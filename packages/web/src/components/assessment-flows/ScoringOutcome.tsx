import React from 'react';

import type { ScoringDryRunMapping } from '@ffp/core';

import { Icons, Surface, Text } from '@web/components/atoms';
import { SectionHeader, StaticAlert } from '@web/components/molecules';

export interface ScoringOutcomeProps {
  matched: ScoringDryRunMapping | null;
}

export const ScoringOutcome: React.FC<ScoringOutcomeProps> = ({ matched }) => {
  if (!matched) {
    return (
      <StaticAlert
        variant="warning"
        appearance="soft"
        message="No rule matches these answers, so a member answering this way would finish without a recommended level."
      />
    );
  }

  // Generation refuses a missing or inactive template
  if (matched.programmeActive !== true) {
    const problem =
      matched.programmeActive === false
        ? `${matched.programmeName ?? matched.programmeSlug}, whose programme template is inactive`
        : `the programme slug “${matched.programmeSlug}”, which no programme template carries`;

    return (
      <StaticAlert
        variant="warning"
        appearance="soft"
        message={`These answers match ${problem}, so a member answering this way would finish without a programme.`}
      />
    );
  }

  return (
    <Surface variant="elevated" padding="md" className="space-y-1 border-primary/30">
      <SectionHeader
        icon={Icons.TARGET}
        title={matched.level === null ? 'Recommended programme' : `Level ${String(matched.level)}`}
      />
      <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
        {matched.programmeName}
      </Text>
    </Surface>
  );
};
