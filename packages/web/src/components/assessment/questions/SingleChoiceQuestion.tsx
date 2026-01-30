import { useCallback } from 'react';

import { RequiredIndicator } from '@web/components/form';
import { Text } from '@web/components/text';

import { OptionLabel } from './OptionLabel';

import type { QuestionComponentProps } from './types';

/**
 * Single choice question component - renders radio button group.
 *
 * Displays a question with multiple options where only one can be selected.
 * Uses native radio inputs for accessibility and form integration.
 */
export const SingleChoiceQuestion: React.FC<QuestionComponentProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const questionId = `question-${question.id}`;
  const errorId = `${questionId}-error`;
  const descriptionId = question.description ? `${questionId}-description` : undefined;
  const isRequired = question.validation?.required !== false;
  const currentValue = typeof value === 'string' ? value : undefined;

  const handleChange = useCallback(
    (optionValue: string): void => {
      if (!disabled) {
        onChange(optionValue);
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

      {/* Radio options */}
      <div className="space-y-3" role="radiogroup" aria-required={isRequired}>
        {question.options?.map((option) => {
          const optionId = `${questionId}-option-${option.value}`;
          const isSelected = currentValue === option.value;

          return (
            <OptionLabel
              key={option.value}
              htmlFor={optionId}
              isSelected={isSelected}
              hasError={!!error}
              disabled={disabled}
            >
              <input
                type="radio"
                id={optionId}
                name={questionId}
                value={option.value}
                checked={isSelected}
                onChange={() => {
                  handleChange(option.value);
                }}
                disabled={disabled}
                aria-invalid={!!error}
                className={`
                  h-5 w-5 border-2 rounded-full appearance-none
                  transition-all duration-200
                  ${
                    isSelected
                      ? 'border-primary bg-primary shadow-radio-dot'
                      : 'border-border bg-card'
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              />
              <Text
                as="span"
                styleProps={{ size: 'base', colour: 'foreground' }}
                className="flex-1"
              >
                {option.label}
              </Text>
            </OptionLabel>
          );
        })}
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
