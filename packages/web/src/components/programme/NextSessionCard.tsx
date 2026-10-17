import { useNavigate } from 'react-router-dom';

import type { ProgrammeDetailResponse } from '@ffp/core';

import {
  Button,
  Icon,
  Icons,
  PressableArea,
  ProgressBar,
  Text,
  Title,
} from '@web/components/atoms';
import { Card, PrescriptionBadge } from '@web/components/molecules';
import { VideoPlayer } from '@web/components/video';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

export interface NextSessionCardProps {
  /** The next uncompleted session */
  session: Session;
  /** The phase containing the session */
  phase: Phase;
  /** Total sessions in the phase */
  totalPhaseSessions: number;
  /** Total phases in the programme */
  totalPhases: number;
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
  totalPhases,
}) => {
  const navigate = useNavigate();
  const isResumable = session.userSession?.status === 'in_progress';
  const firstVideoId = session.exercises?.[0]?.video.id;

  const completedExercises = session.exercises?.filter((e) => e.completion?.completed).length ?? 0;
  const totalExercises = session.exerciseCount;

  const exerciseProgress =
    isResumable && totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const handleStart = (): void => {
    void navigate(`/programme/session/${phase.publicId}/${session.templateSessionPublicId}`);
  };

  const handleViewProgramme = (): void => {
    void navigate('/programme-overview');
  };

  return (
    <Card>
      <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-6">
        {/* Looping preview of the first exercise; clicking it starts the session. The hit area lies
            over the player, not around it: the player's error state has a retry button, and buttons can't nest. */}
        <div className="relative min-h-[200px] overflow-hidden rounded-lg bg-muted lg:w-2/5">
          {firstVideoId ? (
            <VideoPlayer
              videoId={firstVideoId}
              autoPlay
              loop
              muted
              hideControls
              cover
              variant="muted"
              className="!aspect-auto h-full !rounded-none"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon name={Icons.PLAY} styleProps={{ size: 'xl', colour: 'var(--color-primary)' }} />
            </div>
          )}
          <PressableArea
            onClick={handleStart}
            aria-label={isResumable ? 'Continue session' : 'Start session'}
            className="absolute inset-0 flex flex-col items-center justify-center bg-transparent opacity-0 transition-all hover:bg-black/40 hover:opacity-100 focus-visible:bg-black/40 focus-visible:opacity-100 focus-visible:ring-inset"
          >
            <Icon name={Icons.PLAY} styleProps={{ size: 'xl', colour: '#ffffff' }} />
            <Text styleProps={{ size: 'sm', weight: 'medium' }} className="mt-2 text-white">
              {isResumable ? 'Continue session' : 'Start session'}
            </Text>
          </PressableArea>
        </div>

        {/* Content */}
        <div className="mt-4 flex flex-1 flex-col justify-between lg:mt-0">
          <>
            <Text as="p" variant="eyebrow" className="mb-1">
              {isResumable ? 'Continue where you left off' : 'Your next session'}
            </Text>
            <Title as="h3" className="mb-1">
              {session.name ?? `Session ${String(session.sessionNumber)}`}
            </Title>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
              Phase {String(phase.phaseNumber)} of {String(totalPhases)}:{' '}
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
                <ProgressBar percent={exerciseProgress} aria-label="Session exercise progress" />
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
