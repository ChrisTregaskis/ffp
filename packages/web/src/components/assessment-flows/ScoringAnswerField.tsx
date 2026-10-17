import React, { useMemo } from 'react';

import type { ScoringDryRunQuestion } from '@ffp/core';

import { Text } from '@web/components/atoms';
import { Select } from '@web/components/molecules';

import { NO_ANSWER_LABEL, formatScore } from './scoring-labels';

export interface ScoringAnswerFieldProps {
  question: ScoringDryRunQuestion;
  value: string;
  onChange: (value: string) => void;
}

export const ScoringAnswerField: React.FC<ScoringAnswerFieldProps> = ({
  question,
  value,
  onChange,
}) => {
  const options = useMemo(
    () => [
      { value: '', label: NO_ANSWER_LABEL },
      ...(question.options ?? []).map((option) => ({
        value: option.value,
        label:
          option.score === undefined
            ? option.label
            : `${option.label} · scores ${formatScore(option.score)}`,
      })),
    ],
    [question.options]
  );

  return (
    <div className="space-y-1.5">
      <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
        {question.questionText}
      </Text>
      <Select
        value={value}
        onChange={(next) => {
          onChange(String(next));
        }}
        options={options}
        ariaLabel={question.questionText}
      />
    </div>
  );
};
