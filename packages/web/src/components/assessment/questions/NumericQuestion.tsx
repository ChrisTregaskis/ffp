import { useCallback, useId } from 'react';

import { RequiredIndicator } from '@web/components/form';
import { Text } from '@web/components/text';

import type { QuestionComponentProps } from './types';

/**
 * Numeric question component - renders a number input with optional min/max validation.
 *
 * Uses validation.min and validation.max for value constraints.
 */
export const NumericQuestion: React.FC<QuestionComponentProps> = ({
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

  const minValue = question.validation?.min;
  const maxValue = question.validation?.max;

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (disabled) return;

      const inputValue = event.target.value;

      // Allow empty input (clearing the field)
      if (inputValue === '') {
        onChange(null);
        return;
      }

      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        // Clamp value within min/max bounds when defined
        let clampedValue = numericValue;
        if (maxValue !== undefined && clampedValue > maxValue) {
          clampedValue = maxValue;
        }
        if (minValue !== undefined && clampedValue < minValue) {
          clampedValue = minValue;
        }

        // Force the DOM input to show the clamped value (handles the case
        // where React skips re-render because state didn't change)
        if (clampedValue !== numericValue) {
          event.target.value = String(clampedValue);
        }

        onChange(clampedValue);
      }
    },
    [disabled, maxValue, minValue, onChange]
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

      {/* Numeric input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          id={questionId}
          value={currentValue ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
          min={minValue}
          max={maxValue}
          aria-invalid={!!error}
          aria-describedby={
            [descriptionId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
          }
          aria-required={isRequired}
          placeholder="0"
          className={`
            h-12 w-24 rounded-lg border-2 bg-card px-4 text-center text-lg font-medium
            transition-colors duration-200
            placeholder:text-muted-foreground/60
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
            ${
              error !== undefined
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary'
            }
            ${disabled ? 'cursor-not-allowed bg-muted opacity-60' : ''}
          `}
        />

        {/* Range indicator */}
        {minValue !== undefined && maxValue !== undefined && (
          <Text as="span" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
            {String(minValue)}/{String(maxValue)}
          </Text>
        )}
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
