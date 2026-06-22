import { useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { AddQuestionsModal } from './AddQuestionsModal';
import { DIMENSION_LABELS } from './prototype-labels';
import { questionMaxScore } from './prototype-scoring';
import { CONTROL_CLASS, CONTROL_CLASS_BASE } from './prototype-styles';
import {
  SCORE_DIMENSIONS,
  type DimensionConfig,
  type PrototypeQuestion,
  type ScoreDimension,
} from './prototype-types';
import { PrototypeField } from './PrototypeField';
import { PrototypeSelectField } from './PrototypeSelectField';

interface DimensionCardEditorProps {
  dimension: DimensionConfig;
  questions: PrototypeQuestion[];
  onChange: (dimension: DimensionConfig) => void;
  onRemove: () => void;
}

const numberOr = (raw: string, fallback: number): number => (raw === '' ? fallback : Number(raw));

/** Editor for a single scoring dimension: question grouping, maxScore, weight, thresholds. */
export const DimensionCardEditor: React.FC<DimensionCardEditorProps> = ({
  dimension,
  questions,
  onChange,
  onRemove,
}) => {
  const [isAmendOpen, setIsAmendOpen] = useState(false);

  const selectedQuestions = dimension.questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((q): q is PrototypeQuestion => Boolean(q));

  const setQuestions = (ids: string[]): void => {
    onChange({ ...dimension, questionIds: ids });
  };

  // The total the dimension's questions could actually score (the recommended maxScore).
  const questionsTotal = selectedQuestions.reduce(
    (sum, question) => sum + questionMaxScore(question),
    0
  );
  const maxScoreOutOfSync = dimension.maxScore !== questionsTotal;

  const maxScoreInputClass = maxScoreOutOfSync
    ? `w-full ${CONTROL_CLASS_BASE} border border-warning focus:border-warning focus:ring-warning`
    : CONTROL_CLASS;

  const thresholds = dimension.riskThresholds ?? { low: 0, moderate: 0 };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-end gap-4">
        <div className="w-1/2">
          <PrototypeSelectField
            label="Dimension"
            value={dimension.name}
            onChange={(value) => {
              onChange({ ...dimension, name: value as ScoreDimension });
            }}
            options={SCORE_DIMENSIONS.map((name) => ({
              value: name,
              label: DIMENSION_LABELS[name],
            }))}
          />
        </div>
        <div className="w-32">
          <PrototypeField label="Weight (optional)">
            <input
              className={CONTROL_CLASS}
              type="number"
              value={dimension.weight ?? ''}
              onChange={(event) => {
                onChange({
                  ...dimension,
                  weight: event.target.value === '' ? undefined : Number(event.target.value),
                });
              }}
            />
          </PrototypeField>
        </div>
        <button
          type="button"
          aria-label="Remove dimension"
          onClick={onRemove}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <Icon name={Icons.TRASH2} styleProps={{ size: 'sm', colour: 'currentColor' }} />
        </button>
      </div>

      {/* Question grouping */}
      <PrototypeField
        label={`Questions in this dimension (${String(selectedQuestions.length)})`}
        hint="Their option scores add up towards this dimension."
      >
        <div className="space-y-3">
          {selectedQuestions.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {selectedQuestions.map((question) => (
                <li key={question.id}>
                  <Text styleProps={{ size: 'sm' }}>{question.questionText}</Text>
                  {!question.isActive && (
                    <Text styleProps={{ size: 'xs', colour: 'warning' }}> (inactive)</Text>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              No questions yet.
            </Text>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsAmendOpen(true);
            }}
          >
            Amend questions
          </Button>
        </div>
      </PrototypeField>

      <div>
        <div className="grid grid-cols-2 gap-3">
          <PrototypeField label="Maximum score">
            <input
              className={maxScoreInputClass}
              type="number"
              value={dimension.maxScore}
              onChange={(event) => {
                onChange({ ...dimension, maxScore: numberOr(event.target.value, 0) });
              }}
            />
          </PrototypeField>
          <PrototypeField label="Total from questions">
            <input
              className={`${CONTROL_CLASS} cursor-not-allowed bg-muted text-muted-foreground`}
              type="number"
              value={questionsTotal}
              disabled
              readOnly
            />
          </PrototypeField>
        </div>
        {maxScoreOutOfSync && (
          <Text as="p" styleProps={{ size: 'xs', colour: 'warning' }} className="mt-1.5">
            Doesn’t match the questions’ total ({questionsTotal}). Leave it if that’s intentional.
          </Text>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PrototypeField
          label="Lower-support threshold"
          hint="At or below this score, suggest more support."
        >
          <input
            className={CONTROL_CLASS}
            type="number"
            value={thresholds.low}
            onChange={(event) => {
              onChange({
                ...dimension,
                riskThresholds: { ...thresholds, low: numberOr(event.target.value, 0) },
              });
            }}
          />
        </PrototypeField>
        <PrototypeField label="Moderate threshold">
          <input
            className={CONTROL_CLASS}
            type="number"
            value={thresholds.moderate}
            onChange={(event) => {
              onChange({
                ...dimension,
                riskThresholds: { ...thresholds, moderate: numberOr(event.target.value, 0) },
              });
            }}
          />
        </PrototypeField>
      </div>

      <AddQuestionsModal
        isOpen={isAmendOpen}
        onClose={() => {
          setIsAmendOpen(false);
        }}
        availableQuestions={questions}
        initialSelectedIds={dimension.questionIds}
        onConfirm={setQuestions}
        title="Amend questions in this dimension"
        subtitle="Search the question bank and tick the questions whose scores contribute here."
        confirmLabel="Save"
        allowEmpty
      />
    </div>
  );
};
