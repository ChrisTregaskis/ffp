import { useCallback } from 'react';

import { isAnswerRequired } from '@ffp/core';

import { FieldError } from '@web/components/atoms';

import { ChoiceOption } from './ChoiceOption';
import { QuestionFieldset } from './QuestionFieldset';
import { QuestionHeader } from './QuestionHeader';
import { useQuestionFieldIds } from './useQuestionFieldIds';

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
  const { questionId, errorId, descriptionId, optionId, describedBy } =
    useQuestionFieldIds(question);
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
    <QuestionFieldset legend={question.question} describedBy={describedBy(!!error)}>
      <QuestionHeader question={question} descriptionId={descriptionId} />

      <div
        className="space-y-3"
        role="radiogroup"
        aria-required={isAnswerRequired(question.validation)}
      >
        {question.options?.map((option) => (
          <ChoiceOption
            key={option.value}
            type="radio"
            id={optionId(option.value)}
            name={questionId}
            value={option.value}
            label={option.label}
            isSelected={currentValue === option.value}
            hasError={!!error}
            disabled={disabled}
            onSelect={() => {
              handleChange(option.value);
            }}
          />
        ))}
      </div>

      {error && <FieldError animated id={errorId} message={error} />}
    </QuestionFieldset>
  );
};
