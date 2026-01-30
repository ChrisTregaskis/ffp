import { useCallback, useId } from 'react';

import { RequiredIndicator } from '@web/components/form';
import { Text } from '@web/components/text';

import type { QuestionComponentProps } from './types';

/**
 * Default scale range for scale questions (1-10).
 * Can be overridden via validation.min and validation.max.
 */
const DEFAULT_SCALE_MIN = 1;
const DEFAULT_SCALE_MAX = 10;

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
  const instanceId = useId();
  const questionId = `question-${question.id}-${instanceId}`;
  const errorId = `${questionId}-error`;
  const descriptionId = question.description ? `${questionId}-description` : undefined;
  const isRequired = question.validation?.required !== false;

  // Parse current value as number (or undefined)
  const currentValue = typeof value === 'number' ? value : undefined;

  // Use validation min/max or defaults
  const scaleMin = question.validation?.min ?? DEFAULT_SCALE_MIN;
  const scaleMax = question.validation?.max ?? DEFAULT_SCALE_MAX;

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
    <fieldset
      className="space-y-5"
      aria-describedby={
        [descriptionId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
      }
    >
      <legend className="sr-only">{question.question}</legend>

      {/* Question text */}
      <div className="space-y-1">
        <Text
          as="p"
          styleProps={{ size: 'xl', weight: 'medium', colour: 'foreground' }}
          className="leading-relaxed"
        >
          {question.question}
          {isRequired && <RequiredIndicator />}
        </Text>

        {/* Description / helper text */}
        {question.description && (
          <Text as="p" id={descriptionId} styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {question.description}
          </Text>
        )}
      </div>

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
            const buttonId = `${questionId}-scale-${String(scaleValue)}`;

            return (
              <button
                key={scaleValue}
                type="button"
                id={buttonId}
                onClick={() => {
                  handleSelect(scaleValue);
                }}
                disabled={disabled}
                role="radio"
                aria-checked={isSelected}
                aria-invalid={!!error}
                className={`
                  flex h-11 w-11 items-center justify-center rounded-lg border-2
                  text-base font-semibold transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                  ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : error !== undefined
                        ? 'border-destructive bg-card text-foreground hover:bg-destructive/10'
                        : 'border-border bg-card text-foreground hover:border-primary hover:bg-primary/10'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                {scaleValue}
              </button>
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

      {/* Error message */}
      {error && (
        <Text
          as="p"
          id={errorId}
          styleProps={{ size: 'sm', colour: 'destructive' }}
          role="alert"
          className="animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {error}
        </Text>
      )}
    </fieldset>
  );
};
