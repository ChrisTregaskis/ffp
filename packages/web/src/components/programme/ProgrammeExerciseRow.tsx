import type { ProgrammeDetailResponse } from '@ffp/core';

import { Badge, Surface, Text } from '@web/components/atoms';
import type { BadgeProps } from '@web/components/atoms';
import { parseExerciseNotes } from '@web/utils/exercise-instructions';
import { formatPrescription } from '@web/utils/prescription';

import type { ReactNode } from 'react';

type Session = ProgrammeDetailResponse['phases'][number]['sessions'][number];
export type ProgrammeExercise = NonNullable<Session['exercises']>[number];

export interface ProgrammeExerciseRowProps {
  exercise: ProgrammeExercise;
  /** Controls for the exercise (an actions menu), shown at the end of the row */
  actions?: ReactNode;
}

const completionBadge = (completion: ProgrammeExercise['completion']): BadgeProps | null => {
  if (completion?.completed) {
    return { label: 'Completed', variant: 'success', appearance: 'soft', size: 'xs' };
  }

  if (completion?.skipped) {
    return { label: 'Skipped', variant: 'warning', appearance: 'soft', size: 'xs' };
  }

  return null;
};

/** One exercise in a member's session: video title, prescription, notes and completion. */
export const ProgrammeExerciseRow: React.FC<ProgrammeExerciseRowProps> = ({
  exercise,
  actions,
}) => {
  const badge = completionBadge(exercise.completion);

  return (
    <Surface radius="md" padding="row" className="flex items-start gap-3">
      <Text
        styleProps={{ size: 'xs', colour: 'muted-foreground', weight: 'medium' }}
        className="w-5 shrink-0 pt-0.5 text-center"
      >
        {String(exercise.orderIndex + 1)}
      </Text>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>{exercise.video.title}</Text>
          {badge && <Badge {...badge} />}
        </div>
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {formatPrescription(exercise)}
        </Text>
        {exercise.notes && (
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {parseExerciseNotes(exercise.notes)}
          </Text>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </Surface>
  );
};
