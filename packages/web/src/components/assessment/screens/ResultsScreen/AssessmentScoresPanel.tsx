import type { ScoreDimension, UserAssessmentScores } from '@ffp/core';

import { SectionHeader, SectionPanel } from '@web/components/assessment';
import { Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface AssessmentScoresPanelProps {
  scores: UserAssessmentScores;
}

/** Age adjusts a member's level but is not something they are scored on */
const HIDDEN_DIMENSIONS: ReadonlySet<string> = new Set<ScoreDimension>(['age']);

const RISK_BADGE_STYLES = {
  low: 'bg-success text-white',
  moderate: 'bg-warning text-white',
  high: 'bg-destructive text-white',
} as const;

export const AssessmentScoresPanel: React.FC<AssessmentScoresPanelProps> = ({ scores }) => {
  const visibleDimensions = scores.dimensions.filter(
    (dimension) => !HIDDEN_DIMENSIONS.has(dimension.dimensionId)
  );

  return (
    <SectionPanel>
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

        {scores.riskLevel && (
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <Text as="span" styleProps={{ weight: 'medium' }}>
              Risk Level:
            </Text>
            <Text
              as="span"
              styleProps={{ size: 'sm', weight: 'bold' }}
              className={`rounded-lg px-4 py-1.5 ${RISK_BADGE_STYLES[scores.riskLevel]}`}
            >
              {scores.riskLevel.charAt(0).toUpperCase() + scores.riskLevel.slice(1)}
            </Text>
          </div>
        )}
      </div>
    </SectionPanel>
  );
};
