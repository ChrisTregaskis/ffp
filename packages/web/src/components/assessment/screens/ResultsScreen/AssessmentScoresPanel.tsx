import type { MemberAssessmentScores } from '@ffp/core';

import { Icons, Surface, Text } from '@web/components/atoms';
import { SectionHeader } from '@web/components/molecules';

import { visibleScoreDimensions } from './visible-score-dimensions';

export interface AssessmentScoresPanelProps {
  scores: MemberAssessmentScores;
}

export const AssessmentScoresPanel: React.FC<AssessmentScoresPanelProps> = ({ scores }) => {
  const visibleDimensions = visibleScoreDimensions(scores);

  if (visibleDimensions.length === 0) {
    return null;
  }

  return (
    <Surface as="section" variant="section">
      <div className="px-5 pt-5 pb-4">
        <SectionHeader icon={Icons.TARGET} title="Assessment Scores" as="h2" />
      </div>

      <div className="space-y-3 px-5 pb-5">
        {visibleDimensions.map((dimension) => (
          <div
            key={dimension.dimensionId}
            className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3"
          >
            <Text as="span" styleProps={{ weight: 'medium' }}>
              {dimension.dimensionName} Score:
            </Text>
            <Text as="span" styleProps={{ size: 'xl', weight: 'bold', colour: 'warning' }}>
              {String(dimension.normalisedScore)}
              <Text as="span" styleProps={{ size: 'xl', weight: 'bold', colour: 'warning' }}>
                /100
              </Text>
            </Text>
          </div>
        ))}
      </div>
    </Surface>
  );
};
