import React from 'react';

import { isAssessed, type DimensionalScore, type ScoringDryRunDimension } from '@ffp/core';

import { Badge, Surface, Text } from '@web/components/atoms';

import { formatScore, rankNames } from './scoring-labels';

import type { ScenarioAnswers } from './scoring-scenarios';

export interface ScoringDimensionResultProps {
  dimension: ScoringDryRunDimension;
  score: DimensionalScore | undefined;
  answers: ScenarioAnswers;
  tallyScores: number[];
}

const answeredScores = (dimension: ScoringDryRunDimension, answers: ScenarioAnswers): number[] =>
  dimension.questions.flatMap((question) => {
    const option = question.options?.find((each) => each.value === answers[question.publicId]);

    return option?.score === undefined ? [] : [option.score];
  });

const describeResult = (
  dimension: ScoringDryRunDimension,
  score: DimensionalScore,
  tallyScores: number[]
): string => {
  if (dimension.scoringMode !== 'modal') {
    return `${formatScore(score.rawScore)} of ${formatScore(dimension.maxScore)}`;
  }

  const rank = rankNames(tallyScores.length)?.[tallyScores.indexOf(score.rawScore)];

  return rank ? `${formatScore(score.rawScore)}, ${rank}` : formatScore(score.rawScore);
};

export const ScoringDimensionResult: React.FC<ScoringDimensionResultProps> = ({
  dimension,
  score,
  answers,
  tallyScores,
}) => {
  const counted = answeredScores(dimension, answers);
  const isUnanswered = score !== undefined && !isAssessed(score);
  const method =
    dimension.scoringMode === 'modal' ? 'Most frequent answer score' : 'Answer scores added up';

  return (
    <Surface radius="md" padding="md" className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Text as="p" styleProps={{ weight: 'semibold' }}>
          {dimension.displayName}
        </Text>
        {score && !isUnanswered && (
          <Badge
            label={describeResult(dimension, score, tallyScores)}
            variant="primary"
            size="sm"
          />
        )}
        {isUnanswered && <Badge label="Not answered" variant="warning" size="sm" />}
      </div>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        {isUnanswered
          ? 'Nothing here was answered, so this score is left out and no rule on it can match.'
          : `${method}: ${counted.map(formatScore).join(', ') || 'none yet'}`}
      </Text>
    </Surface>
  );
};
