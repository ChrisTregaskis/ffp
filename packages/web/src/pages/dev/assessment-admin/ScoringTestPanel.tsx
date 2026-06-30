import { useMemo, useState } from 'react';

import { Icon, Icons } from '@web/components/Icon';
import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { iconVar } from './prototype-labels';
import {
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_QUESTION_IDS,
  AGE_QUESTION_ID,
  computeLevel,
  LEVEL_META,
  type ActivityCategory,
} from './prototype-level-model';
import { type SampleAnswer, type SampleAnswers } from './prototype-scoring';
import { SCROLL_CLASS } from './prototype-styles';
import { TestAnswerInput } from './TestAnswerInput';

import type { LevelScenario, PrototypeQuestion } from './prototype-types';

interface ScoringTestPanelProps {
  questions: PrototypeQuestion[];
  scenarios: LevelScenario[];
  answers: SampleAnswers;
  onAnswersChange: (answers: SampleAnswers) => void;
}

const CATEGORY_ORDER: ActivityCategory[] = ['lower', 'moderate', 'higher'];

const optionLabel = (
  question: PrototypeQuestion | undefined,
  value: SampleAnswer | undefined
): string => question?.options?.find((option) => option.value === value)?.label ?? '—';

/** Scenario runner — pick a user-type scenario or amend answers, and see the level it produces. */
export const ScoringTestPanel: React.FC<ScoringTestPanelProps> = ({
  questions,
  scenarios,
  answers,
  onAnswersChange,
}) => {
  const result = useMemo(() => computeLevel(questions, answers), [questions, answers]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const ageQuestion = questions.find((q) => q.id === AGE_QUESTION_ID);
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const finalLevel = LEVEL_META[result.finalLevel];

  const applyScenario = (id: string): void => {
    const scenario = scenarios.find((s) => s.id === id);

    if (!scenario) {
      return;
    }

    onAnswersChange({ ...scenario.answers });
    setActiveScenarioId(id);
  };

  const setAnswer = (id: string, value: SampleAnswer): void => {
    onAnswersChange({ ...answers, [id]: value });
    setActiveScenarioId(null); // a manual change clears the active scenario
  };

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      {/* Inputs — its own container, scrollable when the answers run long */}
      <div
        className={`max-h-[calc(100vh-14rem)] space-y-5 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-sm ${SCROLL_CLASS}`}
      >
        <div className="space-y-1.5">
          <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Scenario</Text>
          <Select
            value={activeScenarioId ?? ''}
            placeholder="Choose a user-type scenario…"
            ariaLabel="Scenario"
            options={scenarios.map((scenario) => ({ value: scenario.id, label: scenario.label }))}
            onChange={(value) => {
              applyScenario(String(value));
            }}
          />
          {activeScenario && (
            <div className="rounded-md border border-info/20 bg-info/10 p-2.5">
              <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'info' }}>
                {activeScenario.expectation}
              </Text>
            </div>
          )}
        </div>

        {/* Age — drives the bump, so it sits just under the scenario */}
        {ageQuestion && (
          <div className="space-y-1">
            <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
              Age
            </Text>
            <Text as="p" styleProps={{ size: 'sm' }}>
              {ageQuestion.questionText}
            </Text>
            <TestAnswerInput
              question={ageQuestion}
              value={answers[AGE_QUESTION_ID]}
              onChange={(value) => {
                setAnswer(AGE_QUESTION_ID, value);
              }}
            />
          </div>
        )}

        {/* Activity answers */}
        <div className="space-y-3">
          <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
            Activity answers
          </Text>
          {ACTIVITY_QUESTION_IDS.map((id) => {
            const question = questions.find((q) => q.id === id);

            if (!question) {
              return null;
            }

            return (
              <div key={id} className="space-y-1">
                <Text as="p" styleProps={{ size: 'sm' }}>
                  {question.questionText}
                </Text>
                <TestAnswerInput
                  question={question}
                  value={answers[id]}
                  onChange={(value) => {
                    setAnswer(id, value);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Result — its own fixed container, no scroll */}
      <div className="mt-6 space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm lg:mt-0">
        <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Result</Text>

        {/* Step 1 — activity tally */}
        <div className="rounded-md border border-border bg-background p-3">
          <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
            1 · Activity tally
          </Text>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((category) => (
              <span
                key={category}
                className={`rounded px-2 py-0.5 ${
                  result.modalCategory === category ? 'bg-primary/10' : 'bg-muted'
                }`}
              >
                <Text
                  styleProps={{
                    size: 'xs',
                    weight: 'medium',
                    colour: result.modalCategory === category ? 'primary' : 'muted-foreground',
                  }}
                >
                  {ACTIVITY_CATEGORY_LABELS[category]} ×{result.counts[category]}
                </Text>
              </span>
            ))}
          </div>
          <Text as="p" styleProps={{ size: 'sm' }} className="mt-1.5">
            {result.modalCategory
              ? `Mostly ${ACTIVITY_CATEGORY_LABELS[result.modalCategory].toLowerCase()}`
              : 'Mixed — no clear majority'}{' '}
            → base{' '}
            <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Level {result.baseLevel}</Text>
          </Text>
        </div>

        {/* Step 2 — age bump */}
        <div className="rounded-md border border-border bg-background p-3">
          <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
            2 · Age bump
          </Text>
          <Text as="p" styleProps={{ size: 'sm' }} className="mt-1.5">
            {optionLabel(ageQuestion, answers[AGE_QUESTION_ID])} ·{' '}
            <Text styleProps={{ size: 'sm', weight: 'medium' }}>
              {result.ageBand === 'younger' ? 'under 40 (younger)' : '40+ (older)'}
            </Text>{' '}
            →{' '}
            {result.bumped ? (
              <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'primary' }}>
                +1 level
              </Text>
            ) : (
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>no change</Text>
            )}
          </Text>
        </div>

        {/* Final level */}
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Icon name={Icons.TARGET} styleProps={{ size: 'sm', colour: iconVar('primary') }} />
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Recommended level</Text>
          </div>
          <Text as="p" styleProps={{ size: 'sm', weight: 'semibold', colour: 'primary' }}>
            {finalLevel.name}
          </Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {finalLevel.tagline}
          </Text>
        </div>
      </div>
    </div>
  );
};
