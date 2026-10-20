import React from 'react';

import type { ScorableDryRunResult } from '@ffp/core';

import { Text } from '@web/components/atoms';

import { ScoringDimensionResult } from './ScoringDimensionResult';
import { ScoringOutcome } from './ScoringOutcome';
import { ScoringRuleList } from './ScoringRuleList';

import type { ScenarioAnswers } from './scoring-scenarios';

export interface ScoringTraceProps {
  dryRun: ScorableDryRunResult;
  answers: ScenarioAnswers;
  tallyScores: number[];
}

export const ScoringTrace: React.FC<ScoringTraceProps> = ({ dryRun, answers, tallyScores }) => {
  const { dimensions, mappings, result } = dryRun;
  const matched = mappings.find((mapping) => mapping.index === result.matchedMappingIndex) ?? null;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Text as="p" variant="eyebrow">
          1. Each score
        </Text>
        {dimensions.map((dimension) => (
          <ScoringDimensionResult
            key={dimension.name}
            dimension={dimension}
            score={result.scores.find((score) => score.dimensionId === dimension.name)}
            answers={answers}
            tallyScores={tallyScores}
          />
        ))}
      </section>

      <section className="space-y-3">
        <Text as="p" variant="eyebrow">
          2. The rule they match
        </Text>
        <ScoringRuleList mappings={mappings} matchedIndex={result.matchedMappingIndex} />
      </section>

      <section className="space-y-3">
        <Text as="p" variant="eyebrow">
          3. The result
        </Text>
        <ScoringOutcome matched={matched} />
      </section>
    </div>
  );
};
