import { useCallback } from 'react';

import { DEFAULT_SCALE_RANGE, isAnswerRequired } from '@ffp/core';

import { FieldError, PressableArea, Text } from '@web/components/atoms';

import { QuestionFieldset } from './QuestionFieldset';
import { QuestionHeader } from './QuestionHeader';
import { useQuestionFieldIds } from './useQuestionFieldIds';

import type { QuestionComponentProps } from './types';

/**
 * Scale question component - renders a 1-10 button scale.
 *
 * Displays a horizontal row of numbered buttons for selecting a rating.
 * Uses validation.min and validation.max to customise scale range (defaults to 1-10).
 * Supports optional labels for the low and high ends of the scale via description.
 */
export const ScaleQuestion: React.FC<QuestionComponentProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const { errorId, descriptionId, scaleId, describedBy } = useQuestionFieldIds(question);
  const isRequired = isAnswerRequired(question.validation);

  // Parse current value as number (or undefined)
  const currentValue = typeof value === 'number' ? value : undefined;

  // Use validation min/max or defaults
  const scaleMin = question.validation?.min ?? DEFAULT_SCALE_RANGE.min;
  const scaleMax = question.validation?.max ?? DEFAULT_SCALE_RANGE.max;

  // Generate scale values array
  const scaleValues: number[] = [];
  for (let i = scaleMin; i <= scaleMax; i++) {
    scaleValues.push(i);
  }

  const handleSelect = useCallback(
    (scaleValue: number): void => {
      if (!disabled) {
        onChange(scaleValue);
      }
    },
    [disabled, onChange]
  );

  return (
    <QuestionFieldset legend={question.question} describedBy={describedBy(!!error)}>
      <QuestionHeader question={question} descriptionId={descriptionId} />

      {/* Scale buttons */}
      <div className="space-y-3">
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-required={isRequired}
          aria-label={`Scale from ${String(scaleMin)} to ${String(scaleMax)}`}
        >
          {scaleValues.map((scaleValue) => {
            const isSelected = currentValue === scaleValue;

            return (
              <PressableArea
                key={scaleValue}
                id={scaleId(scaleValue)}
                onClick={() => {
                  handleSelect(scaleValue);
                }}
                disabled={disabled}
                role="radio"
                aria-checked={isSelected}
                aria-invalid={!!error}
                // The focus-visible ring and disabled opacity restate the scale's own over PressableArea's defaults
                className={`
                  flex h-11 w-11 items-center justify-center rounded-lg border-2
                  text-base font-semibold transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                  focus-visible:ring-primary/50
                  ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : error !== undefined
                        ? 'border-destructive bg-card text-foreground hover:bg-destructive/10'
                        : 'border-border bg-card text-foreground hover:border-primary hover:bg-primary/10'
                  }
                  ${disabled ? 'cursor-not-allowed disabled:opacity-60' : 'cursor-pointer'}
                `}
              >
                {scaleValue}
              </PressableArea>
            );
          })}
        </div>

        {/* Scale labels */}
        <div className="flex justify-between px-1">
          <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {scaleMin} = Low
          </Text>
          <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {scaleMax} = High
          </Text>
        </div>
      </div>

      {error && <FieldError animated id={errorId} message={error} />}
    </QuestionFieldset>
  );
};
