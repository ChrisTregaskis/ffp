import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { PrescriptionBadge } from '@web/components/programme/PrescriptionBadge';
import { Title } from '@web/components/text/Title';
import { VideoUnavailablePlaceholder } from '@web/components/video';

import { ExerciseDetail } from './ExerciseDetail';
import { ExerciseTransition } from './ExerciseTransition';

import type { ExerciseInstruction } from './ExerciseDetail';
import type { SessionExercise } from './types';

export interface ActiveExercisePanelProps {
  /** The currently active exercise */
  exercise: SessionExercise;
  /** Whether the completion mutation is pending */
  isPending: boolean;
  /** Called when "Mark Complete" is clicked */
  onMarkComplete: () => void;
  /** Called when "Skip" is clicked */
  onSkip: () => void;
  /** Called when "Rest" is clicked */
  onRest: () => void;
}

/** Parse notes into structured instructions */
const parseInstructions = (notes: string | null): ExerciseInstruction | null => {
  if (!notes) {
    return null;
  }

  // Simple parse — treat full notes as execution if not structured
  return {
    setup: '',
    execution: notes,
    tips: [],
  };
};

/**
 * Main panel showing the currently active exercise.
 *
 * Displays exercise title, video placeholder, prescription badges,
 * instructions, and action buttons (Skip, Rest, Mark Complete).
 */
export const ActiveExercisePanel: React.FC<ActiveExercisePanelProps> = ({
  exercise,
  isPending,
  onMarkComplete,
  onSkip,
  onRest,
}) => {
  const instructions = parseInstructions(exercise.notes);
  const hasRest = exercise.restSeconds !== null && exercise.restSeconds > 0;

  return (
    <ExerciseTransition
      exerciseKey={exercise.completionId}
      className="mx-auto max-w-3xl px-4 py-6 sm:px-6"
    >
      {/* Exercise title */}
      <Title as="h2" className="mb-4">
        {exercise.title}
      </Title>

      {/* Video placeholder */}
      <div className="mb-6 overflow-hidden rounded-xl bg-secondary/30">
        <div className="flex aspect-video items-center justify-center">
          <VideoUnavailablePlaceholder />
        </div>
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

      {/* Exercise instructions */}
      {instructions?.execution && (
        <div className="mb-6">
          <ExerciseDetail instructions={instructions} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="neutral" size="md" onClick={onSkip}>
          Skip
        </Button>
        {hasRest && (
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name={Icons.CLOCK} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={onRest}
          >
            Rest
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
