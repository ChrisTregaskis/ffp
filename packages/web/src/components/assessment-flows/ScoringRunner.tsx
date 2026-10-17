import React, { useMemo } from 'react';

import type { ScorableDryRunResult } from '@ffp/core';

import { LoadingSpinner, Surface, Text } from '@web/components/atoms';
import { Select } from '@web/components/molecules';

import { EDITED_SCENARIO_LABEL } from './scoring-labels';
import { findScenario, type ScenarioAnswers, type ScoringScenario } from './scoring-scenarios';
import { ScoringAnswerFields } from './ScoringAnswerFields';
import { ScoringTrace } from './ScoringTrace';

export interface ScoringRunnerProps {
  dryRun: ScorableDryRunResult;
  scenarios: ScoringScenario[];
  tallyScores: number[];
  answers: ScenarioAnswers;
  scoredAnswers: ScenarioAnswers;
  onAnswersChange: (answers: ScenarioAnswers) => void;
  isSettling: boolean;
}

const EDITED_VALUE = 'edited';

export const ScoringRunner: React.FC<ScoringRunnerProps> = ({
  dryRun,
  scenarios,
  tallyScores,
  answers,
  scoredAnswers,
  onAnswersChange,
  isSettling,
}) => {
  const current = findScenario(scenarios, answers);
  const scenarioOptions = useMemo(
    () => [
      ...(current ? [] : [{ value: EDITED_VALUE, label: EDITED_SCENARIO_LABEL }]),
      ...scenarios.map((scenario) => ({ value: scenario.id, label: scenario.label })),
    ],
    [current, scenarios]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Surface padding="lg" className="space-y-6">
        <div className="space-y-1.5">
          <Text as="p" variant="eyebrow">
            Scenario
          </Text>
          <Select
            value={current?.id ?? EDITED_VALUE}
            onChange={(id) => {
              const scenario = scenarios.find((each) => each.id === id);

              if (scenario) {
                onAnswersChange(scenario.answers);
              }
            }}
            options={scenarioOptions}
            ariaLabel="Scenario"
          />
        </div>
        <ScoringAnswerFields
          dimensions={dryRun.dimensions}
          answers={answers}
          onAnswerChange={(questionPublicId, value) => {
            onAnswersChange({ ...answers, [questionPublicId]: value });
          }}
        />
      </Surface>

      <Surface padding="lg" className="relative" aria-busy={isSettling}>
        <div className={`transition-opacity ${isSettling ? 'opacity-60' : ''}`}>
          <ScoringTrace dryRun={dryRun} answers={scoredAnswers} tallyScores={tallyScores} />
        </div>
        {isSettling && <LoadingSpinner size="sm" className="absolute right-4 top-4" />}
      </Surface>
    </div>
  );
};
