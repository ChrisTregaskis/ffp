import { useCallback, useMemo } from 'react';

import { isAnswerRequired } from '@ffp/core';

import { FieldError } from '@web/components/atoms';

import { ChoiceOption } from './ChoiceOption';
import { QuestionFieldset } from './QuestionFieldset';
import { QuestionHeader } from './QuestionHeader';
import { useQuestionFieldIds } from './useQuestionFieldIds';

import type { QuestionComponentProps } from './types';

/**
 * Multi choice question component - renders checkbox group.
 *
 * Displays a question with multiple options where several can be selected, up to
 * `validation.maxSelections`: once the cap is reached the unselected options are disabled.
 * Uses native checkbox inputs for accessibility and form integration.
 */
export const MultiChoiceQuestion: React.FC<QuestionComponentProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const { questionId, errorId, descriptionId, optionId, describedBy } =
    useQuestionFieldIds(question);

  // Only offered options count: a stored choice since removed from the question has no control to
  // clear it, so the member's next click drops it rather than leaving the answer stuck invalid
  const currentValues = useMemo<string[]>(() => {
    const offered = new Set(question.options?.map((option) => option.value));

    return Array.isArray(value) ? value.filter((choice) => offered.has(choice)) : [];
  }, [value, question.options]);
  const maxSelections = question.validation?.maxSelections;
  const isAtCap = maxSelections !== undefined && currentValues.length >= maxSelections;

  const handleToggle = useCallback(
    (optionValue: string): void => {
      if (disabled) {
        return;
      }

      const isCurrentlySelected = currentValues.includes(optionValue);

      if (!isCurrentlySelected && isAtCap) {
        return;
      }

      const newValues = isCurrentlySelected
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];

      onChange(newValues);
    },
    [disabled, currentValues, isAtCap, onChange]
  );

  return (
    <QuestionFieldset legend={question.question} describedBy={describedBy(!!error)}>
      <QuestionHeader question={question} descriptionId={descriptionId} />

      <div className="space-y-3" role="group" aria-required={isAnswerRequired(question.validation)}>
        {question.options?.map((option) => {
          const isSelected = currentValues.includes(option.value);

          return (
            <ChoiceOption
              key={option.value}
              type="checkbox"
              id={optionId(option.value)}
              name={questionId}
              value={option.value}
              label={option.label}
              isSelected={isSelected}
              hasError={!!error}
              disabled={disabled || (isAtCap && !isSelected)}
              onSelect={() => {
                handleToggle(option.value);
              }}
            />
          );
        })}
      </div>

      {error && <FieldError animated id={errorId} message={error} />}
    </QuestionFieldset>
  );
};
