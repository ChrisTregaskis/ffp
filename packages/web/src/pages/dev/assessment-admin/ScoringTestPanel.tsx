import { useMemo, useState } from 'react';

import { Icon, Icons } from '@web/components/Icon';
import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { DIMENSION_LABELS, iconVar, OPERATOR_LABELS } from './prototype-labels';
import {
  buildMaxAnswers,
  buildMinAnswers,
  buildModerateAnswers,
  buildRandomAnswers,
  checkCoverage,
  simulateScoring,
  type PresetMode,
  type SampleAnswer,
  type SampleAnswers,
  type ScoreBand,
} from './prototype-scoring';
import { TestAnswerInput } from './TestAnswerInput';

import type { ProgrammeTemplateOption, PrototypeQuestion, ScoringConfig } from './prototype-types';

const PRESET_OPTIONS = [
  { value: 'min', label: 'Lowest' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'max', label: 'Highest' },
  { value: 'random', label: 'Randomised' },
];

const PRESET_BUILDERS: Record<
  PresetMode,
  (config: ScoringConfig, questions: PrototypeQuestion[]) => SampleAnswers
> = {
  min: buildMinAnswers,
  moderate: buildModerateAnswers,
  max: buildMaxAnswers,
  random: buildRandomAnswers,
};

interface ScoringTestPanelProps {
  config: ScoringConfig;
  questions: PrototypeQuestion[];
  programmeTemplates: ProgrammeTemplateOption[];
  answers: SampleAnswers;
  onAnswersChange: (answers: SampleAnswers) => void;
  /** Scroll to + highlight a mapping card in the editor */
  onJumpToMapping: (index: number) => void;
}

const BAND_META: Record<
  ScoreBand,
  { label: string; colour: 'success' | 'warning' | 'destructive'; dot: string }
> = {
  strong: { label: 'strong', colour: 'success', dot: 'bg-success' },
  building: { label: 'building', colour: 'warning', dot: 'bg-warning' },
  support: { label: 'needs support', colour: 'destructive', dot: 'bg-destructive' },
};

/** Live scoring sandbox — feed in sample answers, see scores, the winning rule and coverage. */
export const ScoringTestPanel: React.FC<ScoringTestPanelProps> = ({
  config,
  questions,
  programmeTemplates,
  answers,
  onAnswersChange,
  onJumpToMapping,
}) => {
  const result = useMemo(
    () => simulateScoring(config, questions, answers),
    [config, questions, answers]
  );
  const programmeLabels = useMemo(
    () => new Map(programmeTemplates.map((p) => [p.slug, p.name])),
    [programmeTemplates]
  );
  const coverage = useMemo(
    () => checkCoverage(config, questions, programmeLabels),
    [config, questions, programmeLabels]
  );

  // The active preset, or '' once the author tweaks an answer by hand.
  const [preset, setPreset] = useState<PresetMode | ''>('');

  const applyPreset = (mode: PresetMode): void => {
    onAnswersChange(PRESET_BUILDERS[mode](config, questions));
    setPreset(mode);
  };

  const setAnswer = (id: string, value: SampleAnswer): void => {
    onAnswersChange({ ...answers, [id]: value });
    setPreset(''); // a manual change clears the preset selection
  };

  const orderedMappings = [...result.mappings].sort((a, b) => a.priority - b.priority);
  const recommendedLabel =
    result.programmeTemplateId === null
      ? 'Default programme (no rule matched)'
      : (programmeLabels.get(result.programmeTemplateId) ?? result.programmeTemplateId);

  return (
    <div className="space-y-5">
      {/* Preset */}
      <div className="space-y-2">
        <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Sample answers</Text>
        <Select
          value={preset}
          onChange={(value) => {
            applyPreset(value as PresetMode);
          }}
          options={PRESET_OPTIONS}
          ariaLabel="Sample answers preset"
          placeholder="Choose a preset…"
        />
      </div>

      {/* Answer inputs, grouped by dimension */}
      {config.dimensions.map((dimension) => (
        <div key={dimension.name} className="space-y-2">
          <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
            {DIMENSION_LABELS[dimension.name]}
          </Text>
          {dimension.questionIds.map((id) => {
            const question = questions.find((q) => q.id === id);

            if (!question) {
              return null;
            }

            const scored = question.type !== 'text' && question.type !== 'video-response';

            return (
              <div key={id} className="space-y-1">
                <Text as="p" styleProps={{ size: 'sm' }}>
                  {question.questionText}
                </Text>
                {scored ? (
                  <TestAnswerInput
                    question={question}
                    value={answers[id]}
                    onChange={(value) => {
                      setAnswer(id, value);
                    }}
                  />
                ) : (
                  <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                    Not scored — contributes 0.
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Results */}
      <div className="space-y-3 border-t border-border pt-4">
        <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Result</Text>

        {result.dimensions.map((dimension) => {
          const band = BAND_META[dimension.band];

          return (
            <div key={dimension.name} className="flex items-center justify-between gap-2">
              <Text styleProps={{ size: 'sm' }}>{dimension.label}</Text>
              <div className="flex items-center gap-1.5">
                <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                  raw {dimension.rawScore}/{dimension.maxScore} · {dimension.normalised}%
                </Text>
                <span className={`h-2 w-2 rounded-full ${band.dot}`} aria-hidden />
                <Text styleProps={{ size: 'xs', colour: band.colour }}>{band.label}</Text>
              </div>
            </div>
          );
        })}

        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Recommended programme</Text>
          <Text as="p" styleProps={{ size: 'sm', weight: 'semibold', colour: 'primary' }}>
            {recommendedLabel}
          </Text>
        </div>
      </div>

      {/* Why — the rule trace */}
      {orderedMappings.length > 0 && (
        <div className="space-y-2">
          <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Why</Text>
          {orderedMappings.map((mapping) => {
            const isWinner = mapping.index === result.winnerIndex;

            return (
              <div
                key={mapping.index}
                className={`rounded-md border p-2.5 ${
                  isWinner ? 'border-success bg-success/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToMapping(mapping.index);
                    }}
                    className="underline-offset-2 hover:underline"
                  >
                    <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'primary' }}>
                      Rule {mapping.priority}
                    </Text>
                  </button>
                  <Text
                    styleProps={{
                      size: 'xs',
                      weight: 'medium',
                      colour: isWinner ? 'success' : 'muted-foreground',
                    }}
                  >
                    {isWinner ? 'matches — wins' : mapping.matched ? 'matches' : 'no match'}
                  </Text>
                </div>
                <div className="mt-1 space-y-0.5">
                  {mapping.conditions.map((condition, conditionIndex) => (
                    <div key={conditionIndex} className="flex items-center gap-1.5">
                      <Icon
                        name={condition.pass ? Icons.CHECK : Icons.CLOSE}
                        styleProps={{
                          size: 'xs',
                          colour: iconVar(condition.pass ? 'success' : 'destructive'),
                        }}
                      />
                      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                        {DIMENSION_LABELS[condition.dimension]}{' '}
                        {OPERATOR_LABELS[condition.operator]} {condition.value} (got{' '}
                        {condition.actual})
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coverage */}
      {coverage.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Coverage checks</Text>
          {coverage.map((issue, index) => (
            <button
              key={index}
              type="button"
              disabled={issue.mappingIndex === undefined}
              onClick={() => {
                if (issue.mappingIndex !== undefined) {
                  onJumpToMapping(issue.mappingIndex);
                }
              }}
              className={`flex w-full items-start gap-2 rounded-md border p-2.5 text-left ${
                issue.severity === 'warning'
                  ? 'border-warning/30 bg-warning/10'
                  : 'border-border bg-muted/40'
              } ${issue.mappingIndex !== undefined ? 'hover:border-warning' : ''}`}
            >
              <Icon
                name={issue.severity === 'warning' ? Icons.ALERTTRIANGLE : Icons.HELPCIRCLE}
                styleProps={{
                  size: 'sm',
                  colour: iconVar(issue.severity === 'warning' ? 'warning' : 'muted-foreground'),
                }}
              />
              <Text
                styleProps={{
                  size: 'xs',
                  colour: issue.severity === 'warning' ? 'warning' : 'muted-foreground',
                }}
              >
                {issue.message}
              </Text>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
