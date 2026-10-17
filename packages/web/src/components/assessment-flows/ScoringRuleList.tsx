import React from 'react';

import type { ScoringDryRunMapping } from '@ffp/core';

import { Badge, Surface, Text } from '@web/components/atoms';

import { formatCondition } from './scoring-labels';

export interface ScoringRuleListProps {
  mappings: ScoringDryRunMapping[];
  matchedIndex?: number | null;
}

const ruleOutcome = (mapping: ScoringDryRunMapping): string => {
  if (mapping.programmeName) {
    return mapping.programmeName;
  }

  return mapping.level === null
    ? mapping.programmeSlug
    : `Level ${String(mapping.level)} · ${mapping.programmeSlug}`;
};

const ruleConditions = (mapping: ScoringDryRunMapping): string =>
  mapping.conditions.length === 0
    ? 'Any answers'
    : mapping.conditions.map(formatCondition).join(` ${mapping.operator} `);

export const ScoringRuleList: React.FC<ScoringRuleListProps> = ({ mappings, matchedIndex }) => (
  <ul className="space-y-2">
    {mappings.map((mapping) => {
      const isMatch = mapping.index === matchedIndex;

      return (
        <li key={mapping.index}>
          <Surface
            radius="md"
            padding="row"
            className={`flex flex-wrap items-center justify-between gap-2 ${isMatch ? 'border-success bg-success/5' : ''}`}
          >
            <Text as="span" styleProps={{ size: 'sm', weight: isMatch ? 'semibold' : 'normal' }}>
              {ruleConditions(mapping)}
            </Text>
            <span className="flex items-center gap-2">
              <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                {ruleOutcome(mapping)}
              </Text>
              {mapping.priority !== undefined && (
                <Badge label={`Priority ${String(mapping.priority)}`} />
              )}
              {mapping.programmeActive === false && <Badge label="Inactive" variant="warning" />}
              {isMatch && <Badge label="Matched" variant="success" />}
            </span>
          </Surface>
        </li>
      );
    })}
  </ul>
);
