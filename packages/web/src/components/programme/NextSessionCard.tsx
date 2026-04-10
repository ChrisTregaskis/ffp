import { useNavigate } from 'react-router-dom';

import type { ProgrammeDetailResponse } from '@ffp/core';

import { Button } from '@web/components/button';
import { Card } from '@web/components/Card/Card';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { ProgressBar } from '@web/components/ProgressBar';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';
import { VideoUnavailablePlaceholder } from '@web/components/video';

import { PrescriptionBadge } from './PrescriptionBadge';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

export interface NextSessionCardProps {
  /** The next uncompleted session */
  session: Session;
  /** The phase containing the session */
  phase: Phase;
  /** Total sessions in the phase */
  totalPhaseSessions: number;
}

/**
 * "Your Next Session" hero card for the dashboard.
 *
 * Displays video preview thumbnail (2/5 width on lg), session name,
 * phase context, exercise count and duration badges, and a
 * "Start Session" / "Continue Session" CTA button.
 */
export const NextSessionCard: React.FC<NextSessionCardProps> = ({
  session,
  phase,
  totalPhaseSessions,
}) => {
  const navigate = useNavigate();
  const isResumable = session.userSession?.status === 'in_progress';

  const completedExercises = session.exercises?.filter((e) => e.completion?.completed).length ?? 0;
  const totalExercises = session.exerciseCount;

  const exerciseProgress =
    isResumable && totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const handleStart = (): void => {
    void navigate(`/programme/session/${phase.id}/${session.templateSessionId}`);
  };

  const handleViewProgramme = (): void => {
    void navigate('/programme-overview');
  };

  return (
    <Card>
      <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-6">
        {/* Video preview — signed thumbnail URLs deferred, uses shared placeholder */}
        <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-secondary/30 p-6 lg:w-2/5">
          <VideoUnavailablePlaceholder />
        </div>

        {/* Content */}
        <div className="mt-4 flex flex-1 flex-col justify-between lg:mt-0">
          <>
            <Text
              as="p"
              styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
              className="mb-1 uppercase tracking-wide"
            >
              {isResumable ? 'Continue where you left off' : 'Your next session'}
            </Text>
            <Title as="h3" className="mb-1">
              {session.name ?? `Session ${String(session.sessionNumber)}`}
            </Title>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
              Phase {String(phase.phaseNumber)}:{' '}
              {phase.name ?? `Phase ${String(phase.phaseNumber)}`} · Session{' '}
              {String(session.sessionNumber)} of {String(totalPhaseSessions)}
            </Text>

            {isResumable && totalExercises > 0 && (
              <div className="mb-4">
                <Text
                  as="p"
                  styleProps={{ size: 'xs', colour: 'muted-foreground' }}
                  className="mb-1"
                >
                  {String(completedExercises)} of {String(totalExercises)} exercises done
                </Text>
                <ProgressBar percent={exerciseProgress} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <PrescriptionBadge
                label={`${String(totalExercises)} exercises`}
                icon={Icons.REPEAT}
                variant="blue"
                size="sm"
              />
              {session.estimatedDurationMinutes && (
                <PrescriptionBadge
                  label={`${String(session.estimatedDurationMinutes)} min`}
                  icon={Icons.CLOCK}
                  variant="blue"
                  size="sm"
                />
              )}
            </div>
          </>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="neutral" size="md" onClick={handleViewProgramme}>
              View Programme
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Icon name={Icons.PLAY} styleProps={{ size: 'sm', colour: '#ffffff' }} />}
              onClick={handleStart}
            >
              {isResumable ? 'Continue Session' : 'Start Session'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
