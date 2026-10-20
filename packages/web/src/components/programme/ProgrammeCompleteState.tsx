import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ProgressSummaryResponse } from '@ffp/core';

import { Button, Icons } from '@web/components/atoms';
import { Card, FeatureColumnGrid, StatusResult, type FeatureItem } from '@web/components/molecules';

export type ProgrammeCompleteStateProps = Pick<
  ProgressSummaryResponse,
  'completedPhases' | 'completedSessions'
>;

/**
 * State shown on the dashboard when the user has completed their programme.
 */
export const ProgrammeCompleteState: React.FC<ProgrammeCompleteStateProps> = ({
  completedPhases,
  completedSessions,
}) => {
  const navigate = useNavigate();

  const features: FeatureItem[] = useMemo(
    () => [
      {
        icon: 'Activity' as const,
        heading: `${String(completedPhases)} Phases`,
        description: 'All programme phases completed',
      },
      {
        icon: 'CheckCircle' as const,
        heading: `${String(completedSessions)} Sessions`,
        description: 'Every session finished',
      },
      {
        icon: 'Target' as const,
        heading: 'Well Done',
        description: 'Ready for your next assessment',
      },
    ],
    [completedPhases, completedSessions]
  );

  return (
    <Card contentClassName="px-6 py-10">
      <StatusResult
        icon={Icons.CHECK}
        iconVariant="success"
        iconAppearance="solid"
        iconSize="lg"
        title="Programme Complete"
        titleAs="h3"
        description="Great job! You've completed your programme. You can review your progress or start a new assessment."
        spacing="feature"
        actions={
          <>
            <Button
              variant="neutral"
              size="md"
              onClick={() => {
                void navigate('/programme-overview');
              }}
            >
              View Programme
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                void navigate('/assessment-overview');
              }}
            >
              Start New Assessment
            </Button>
          </>
        }
      >
        <FeatureColumnGrid features={features} headingLevel="h4" className="mb-12 w-full" />
      </StatusResult>
    </Card>
  );
};
