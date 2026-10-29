import type { ProgrammeDetailResponse } from '@ffp/core';

import { Badge, Text } from '@web/components/atoms';
import { Accordion } from '@web/components/molecules';

import { SESSION_STATUS_BADGES } from './programme-status-badges';
import { ProgrammeExerciseRow } from './ProgrammeExerciseRow';

import type { ProgrammeExercise } from './ProgrammeExerciseRow';
import type { ReactNode } from 'react';

export type ProgrammeSession = ProgrammeDetailResponse['phases'][number]['sessions'][number];

export interface ProgrammeSessionCardProps {
  session: ProgrammeSession;
  /** Controls for the session (an actions menu), shown in the card's header */
  actions?: ReactNode;
  /** Controls for each exercise, shown at the end of its row */
  renderExerciseActions?: (exercise: ProgrammeExercise) => ReactNode;
  /** Shown below the exercises: a form, a note about the session */
  footer?: ReactNode;
  /** Controls the card's open state; left out, the card opens and closes itself */
  expanded?: boolean;
  onToggle?: () => void;
  /** Holds the card open, while a form in its footer is in use */
  toggleDisabled?: boolean;
}

/** A collapsible card for one session of a member's programme, listing its exercises. */
export const ProgrammeSessionCard: React.FC<ProgrammeSessionCardProps> = ({
  session,
  actions,
  renderExerciseActions,
  footer,
  expanded,
  onToggle,
  toggleDisabled,
}) => {
  const displayName = session.name ?? `Session ${String(session.sessionNumber)}`;
  const status = session.userSession?.status;
  const exercises = session.exercises ?? [];

  const trigger = (
    <>
      <Text styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
        {displayName}
      </Text>
      {status && <Badge {...SESSION_STATUS_BADGES[status]} size="xs" />}
      {session.estimatedDurationMinutes && (
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {session.estimatedDurationMinutes} min
        </Text>
      )}
      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
        {session.exerciseCount} {session.exerciseCount === 1 ? 'exercise' : 'exercises'}
      </Text>
    </>
  );

  return (
    <Accordion
      trigger={trigger}
      actions={actions}
      expanded={expanded}
      onToggle={onToggle}
      toggleDisabled={toggleDisabled}
    >
      {exercises.length === 0 ? (
        <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          No exercises in this session.
        </Text>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise) => (
            <ProgrammeExerciseRow
              key={exercise.sessionExerciseId}
              exercise={exercise}
              actions={renderExerciseActions?.(exercise)}
            />
          ))}
        </div>
      )}
      {footer && <div className="mt-3 space-y-3">{footer}</div>}
    </Accordion>
  );
};
