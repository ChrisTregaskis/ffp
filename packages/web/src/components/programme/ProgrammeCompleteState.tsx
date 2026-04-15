import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ProgressSummaryResponse } from '@ffp/core';

import { FeatureColumnGrid } from '@web/components/assessment';
import type { FeatureItem } from '@web/components/assessment';
import { Button } from '@web/components/button';
import { Card } from '@web/components/Card/Card';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

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
    <Card>
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ffp-green">
          <Icon name={Icons.CHECK} styleProps={{ size: 'lg', colour: '#ffffff' }} />
        </div>

        <Title as="h3" className="mb-2">
          Programme Complete
        </Title>
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-8 max-w-sm">
          Great job! You&apos;ve completed your programme. You can review your progress or start a
          new assessment.
        </Text>

        <FeatureColumnGrid features={features} headingLevel="h4" className="mb-12 w-full" />

        <div className="flex gap-3">
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
        </div>
      </div>
    </Card>
  );
};
