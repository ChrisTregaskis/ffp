import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { PrescriptionBadge } from '@web/components/programme/PrescriptionBadge';
import { Title } from '@web/components/text/Title';
import { VideoPlayer } from '@web/components/video';

import { ExerciseDetail } from './ExerciseDetail';
import { ExerciseTransition } from './ExerciseTransition';

import type { SessionExercise } from './types';

export interface ActiveExercisePanelProps {
  /** The currently active exercise */
  exercise: SessionExercise;
  /** Whether the completion mutation is pending */
  isPending: boolean;
  /** Whether the rest timer is currently active */
  isResting: boolean;
  /** Called when "Mark Complete" is clicked */
  onMarkComplete: () => void;
  /** Called when "Skip" is clicked */
  onSkip: () => void;
  /** Called when "Rest" is clicked (starts timer), or "Cancel Rest" (stops timer) */
  onRestToggle: () => void;
}

/**
 * Main panel showing the currently active exercise.
 *
 * Displays exercise title, video placeholder, prescription badges,
 * instructions, and action buttons (Skip, Rest, Mark Complete).
 */
export const ActiveExercisePanel: React.FC<ActiveExercisePanelProps> = ({
  exercise,
  isPending,
  isResting,
  onMarkComplete,
  onSkip,
  onRestToggle,
}) => {
  const hasRest = exercise.restSeconds !== null && exercise.restSeconds > 0;

  return (
    <ExerciseTransition
      exerciseKey={exercise.completionId}
      className="mx-auto max-w-3xl px-4 py-6 sm:px-6"
    >
      <Title as="h2" className="mb-4">
        {exercise.title}
      </Title>

      <div className="mb-6 overflow-hidden rounded-xl">
        <VideoPlayer videoId={exercise.videoId} ariaLabel={exercise.title} />
      </div>

      {/* Prescription badges */}
      <div className="mb-6 flex flex-wrap gap-2">
        <PrescriptionBadge
          label={`${String(exercise.sets)} sets x ${exercise.reps}`}
          icon={Icons.REPEAT}
          variant="blue"
        />
        {hasRest && (
          <PrescriptionBadge
            label={`${String(exercise.restSeconds)}s rest`}
            icon={Icons.CLOCK}
            variant="purple"
          />
        )}
        {exercise.durationSeconds && (
          <PrescriptionBadge
            label={`${String(exercise.durationSeconds)}s`}
            icon={Icons.CLOCK}
            variant="green"
          />
        )}
      </div>

      {exercise.notes && (
        <div className="mb-6">
          <ExerciseDetail notes={exercise.notes} />
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="neutral" size="md" onClick={onSkip}>
          Skip
        </Button>
        {hasRest && (
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name={Icons.CLOCK} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={onRestToggle}
          >
            {isResting ? 'Cancel Rest' : 'Rest'}
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          icon={<Icon name={Icons.CHECK} styleProps={{ size: 'sm', colour: '#ffffff' }} />}
          onClick={onMarkComplete}
          disabled={isPending}
          loading={isPending}
        >
          Mark Complete
        </Button>
      </div>
    </ExerciseTransition>
  );
};
