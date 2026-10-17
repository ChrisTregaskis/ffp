import React from 'react';

import type { ScoringDryRunDimension } from '@ffp/core';

import { Text } from '@web/components/atoms';

import { ScoringAnswerField } from './ScoringAnswerField';

import type { ScenarioAnswers } from './scoring-scenarios';

export interface ScoringAnswerFieldsProps {
  dimensions: ScoringDryRunDimension[];
  answers: ScenarioAnswers;
  onAnswerChange: (questionPublicId: string, value: string) => void;
}

export const ScoringAnswerFields: React.FC<ScoringAnswerFieldsProps> = ({
  dimensions,
  answers,
  onAnswerChange,
}) => (
  <div className="space-y-6">
    {dimensions.map((dimension) => (
      <section key={dimension.name} className="space-y-3">
        <Text as="p" variant="eyebrow">
          {dimension.displayName}
        </Text>
        {dimension.questions.map((question) => (
          <ScoringAnswerField
            key={question.publicId}
            question={question}
            value={answers[question.publicId] ?? ''}
            onChange={(value) => {
              onAnswerChange(question.publicId, value);
            }}
          />
        ))}
      </section>
    ))}
  </div>
);
