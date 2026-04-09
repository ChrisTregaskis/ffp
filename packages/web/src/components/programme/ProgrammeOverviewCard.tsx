import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Card } from '@web/components/Card/Card';
import { ProgressBar } from '@web/components/ProgressBar';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

export interface ProgrammeOverviewCardProps {
  /** Programme name */
  programmeName: string;
  /** Current phase label (e.g., "Phase 2: Strength Building") */
  currentPhaseLabel: string | null;
  /** Overall progress percentage (0–100) */
  overallProgressPercent: number;
  /** Completed phases count */
  completedPhases: number;
  /** Total phases count */
  totalPhases: number;
}

/**
 * Programme overview card for the dashboard.
 *
 * Displays programme name, current phase, gradient progress bar
 * with percentage, and a "View Programme" CTA.
 */
export const ProgrammeOverviewCard: React.FC<ProgrammeOverviewCardProps> = ({
  programmeName,
  currentPhaseLabel,
  overallProgressPercent,
  completedPhases,
  totalPhases,
}) => {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="p-5">
        <div className="mb-4">
          <Title as="h3" className="mb-1">
            {programmeName}
          </Title>
          {currentPhaseLabel && (
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              {currentPhaseLabel}
            </Text>
          )}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <Text
            styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
            className="uppercase tracking-wide"
          >
            Programme Progress
          </Text>
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>
            {String(completedPhases)} of {String(totalPhases)} phases
          </Text>
        </div>
        <ProgressBar percent={overallProgressPercent} className="mb-4" />

        <div className="flex items-center justify-between">
          <Text styleProps={{ size: 'sm', weight: 'semibold' }}>
            {String(Math.round(overallProgressPercent))}% complete
          </Text>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => {
              void navigate('/programme-overview');
            }}
          >
            View Programme
          </Button>
        </div>
      </div>
    </Card>
  );
};
