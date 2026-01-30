import { useCallback, useId } from 'react';

import { RequiredIndicator } from '@web/components/form';
import { Text } from '@web/components/text';

import type { QuestionComponentProps } from './types';

/**
 * Text question component - renders a textarea for free-text responses.
 *
 * Supports optional max character limit via validation.max setting.
 * Displays character count when max length is specified.
 */
export const TextQuestion: React.FC<QuestionComponentProps> = ({
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
  const currentValue = typeof value === 'string' ? value : '';

  const maxLength = question.validation?.max;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
      if (!disabled) {
        onChange(event.target.value);
      }
    },
    [disabled, onChange]
  );

  const characterCount = currentValue.length;
  const isOverLimit = maxLength !== undefined && characterCount > maxLength;

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
        <label htmlFor={questionId} className="block leading-relaxed">
          <Text as="span" styleProps={{ size: 'xl', weight: 'medium', colour: 'foreground' }}>
            {question.question}
            {isRequired && <RequiredIndicator />}
          </Text>
        </label>

        {/* Description / helper text */}
        {question.description && (
          <Text as="p" id={descriptionId} styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {question.description}
          </Text>
        )}
      </div>

      {/* Textarea input */}
      <div className="space-y-2">
        <textarea
          id={questionId}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          rows={4}
          maxLength={maxLength}
          aria-invalid={!!error || isOverLimit}
          aria-describedby={
            [descriptionId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
          }
          aria-required={isRequired}
          placeholder="Enter your response..."
          className={`
            w-full rounded-lg border-2 bg-card p-4 resize-y
            transition-colors duration-200
            placeholder:text-muted-foreground/60
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
            ${
              error !== undefined || isOverLimit
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary'
            }
            ${disabled ? 'cursor-not-allowed bg-muted opacity-60' : ''}
          `}
        />

        {/* Character count */}
        {maxLength !== undefined && (
          <div className="flex justify-end">
            <Text
              as="span"
              styleProps={{
                size: 'sm',
                colour: isOverLimit ? 'destructive' : 'muted-foreground',
              }}
            >
              {characterCount} / {String(maxLength)}
            </Text>
          </div>
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
