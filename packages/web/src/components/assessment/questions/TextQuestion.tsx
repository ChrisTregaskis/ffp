import { useCallback } from 'react';

import { isAnswerRequired } from '@ffp/core';

import { FieldError, Text, Textarea } from '@web/components/atoms';

import { QuestionFieldset } from './QuestionFieldset';
import { QuestionHeader } from './QuestionHeader';
import { useQuestionFieldIds } from './useQuestionFieldIds';

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
  const { questionId, labelId, errorId, descriptionId, describedBy } =
    useQuestionFieldIds(question);
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
    <QuestionFieldset legend={question.question} describedBy={describedBy(!!error)}>
      <QuestionHeader question={question} textId={labelId} descriptionId={descriptionId} />

      <div className="space-y-2">
        <Textarea
          appearance="bare"
          id={questionId}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          rows={4}
          maxLength={maxLength}
          aria-labelledby={labelId}
          aria-invalid={!!error || isOverLimit}
          aria-describedby={describedBy(!!error)}
          aria-required={isAnswerRequired(question.validation)}
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

      {error && <FieldError animated id={errorId} message={error} />}
    </QuestionFieldset>
  );
};
