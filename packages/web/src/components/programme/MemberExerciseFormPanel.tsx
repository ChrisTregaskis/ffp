import React from 'react';

import { InlineFormPanel } from '@web/components/molecules';
import { exerciseToFormValues, ExerciseForm } from '@web/components/programme-templates';
import type { ExerciseFormValues } from '@web/components/programme-templates';

import { toStoredExercise } from './member-exercise-values';

import type { ProgrammeExercise } from './ProgrammeExerciseRow';

/** Which form a member's session has open, and on which exercise */
export type MemberExerciseFormMode =
  | { mode: 'add' }
  | { mode: 'edit' | 'swap'; exercise: ProgrammeExercise };

export interface MemberExerciseFormPanelProps {
  form: MemberExerciseFormMode;
  /** The videos the session already holds */
  videoIds: readonly string[];
  isSubmitting: boolean;
  onSubmit: (values: ExerciseFormValues) => void;
  onCancel: () => void;
}

/**
 * The exercise form for one of a member's sessions. Add and Swap offer only videos the session
 * lacks; Swap starts with no video, and the one chosen replaces the prescription.
 */
export const MemberExerciseFormPanel: React.FC<MemberExerciseFormPanelProps> = ({
  form,
  videoIds,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  if (form.mode === 'add') {
    return (
      <InlineFormPanel title="Add exercise">
        <ExerciseForm
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          submitLabel="Add exercise"
          excludeVideoIds={videoIds}
        />
      </InlineFormPanel>
    );
  }

  const { exercise } = form;
  const isSwap = form.mode === 'swap';

  return (
    <InlineFormPanel title={`${isSwap ? 'Swap' : 'Edit'} ${exercise.video.title}`}>
      <ExerciseForm
        key={`${form.mode}-${exercise.sessionExerciseId}`}
        initialValues={{
          ...exerciseToFormValues(toStoredExercise(exercise)),
          ...(isSwap && { videoId: '' }),
        }}
        initialSelectedVideo={
          isSwap ? null : { publicId: exercise.video.publicId, title: exercise.video.title }
        }
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={isSwap ? 'Swap exercise' : 'Save'}
        prescriptionOnVideoChange={isSwap ? 'overwrite' : 'fill-empty'}
        excludeVideoIds={isSwap ? videoIds : videoIds.filter((id) => id !== exercise.video.id)}
        isEditMode
      />
    </InlineFormPanel>
  );
};
