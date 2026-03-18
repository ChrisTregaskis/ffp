import React, { useCallback, useMemo, useState } from 'react';

import type { ExerciseResponse } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';
import {
  useCreateExerciseMutation,
  useDeleteExerciseMutation,
  useReorderExercisesMutation,
  useSessionExercisesQuery,
  useUpdateExerciseMutation,
} from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { swapAdjacentItem } from '@web/utils/reorder';

import { DeleteConfirmModal } from './DeleteConfirmModal';
import { exerciseToFormValues } from './exercise-utils';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseRow } from './ExerciseRow';
import { InlineFormPanel } from './InlineFormPanel';

import type { ExerciseFormValues } from './exercise-utils';

export interface ExerciseListProps {
  /** Session ID to fetch and manage exercises for */
  sessionId: string;
  /** Template ID for cache invalidation */
  templateId: string;
  /** Exercise count from template detail (for initial display before query loads) */
  exerciseCount: number;
}

/** Container for exercise CRUD within a session — fetches data and manages mutations. */
export const ExerciseList: React.FC<ExerciseListProps> = ({
  sessionId,
  templateId,
  exerciseCount,
}) => {
  const { addToast } = useToast();

  // Fetch exercises with video summaries
  const { data: exercises, isLoading } = useSessionExercisesQuery(sessionId);

  // Mutation hooks
  const createExercise = useCreateExerciseMutation(templateId);
  const updateExercise = useUpdateExerciseMutation(templateId);
  const deleteExercise = useDeleteExerciseMutation(templateId);
  const reorderExercises = useReorderExercisesMutation(templateId);

  const isMutating =
    createExercise.isPending ||
    updateExercise.isPending ||
    deleteExercise.isPending ||
    reorderExercises.isPending;

  // Local state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseResponse | null>(null);

  const exerciseList = useMemo(() => exercises ?? [], [exercises]);

  const handleCreate = useCallback(
    (values: ExerciseFormValues) => {
      createExercise.mutate(
        {
          sessionId,
          data: {
            videoId: values.videoId,
            sets: values.sets ? parseInt(values.sets, 10) : undefined,
            reps: values.reps || undefined,
            durationSeconds: values.durationSeconds
              ? parseInt(values.durationSeconds, 10)
              : undefined,
            restSeconds: values.restSeconds ? parseInt(values.restSeconds, 10) : undefined,
            notes: values.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            addToast('Exercise added', { variant: 'success' });
            setIsAdding(false);
          },
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [sessionId, createExercise, addToast]
  );

  const handleUpdate = useCallback(
    (exerciseId: string, values: ExerciseFormValues) => {
      updateExercise.mutate(
        {
          exerciseId,
          data: {
            videoId: values.videoId,
            sets: values.sets ? parseInt(values.sets, 10) : undefined,
            reps: values.reps || undefined,
            durationSeconds: values.durationSeconds
              ? parseInt(values.durationSeconds, 10)
              : undefined,
            restSeconds: values.restSeconds ? parseInt(values.restSeconds, 10) : undefined,
            notes: values.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            addToast('Exercise updated', { variant: 'success' });
            setEditingId(null);
          },
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [updateExercise, addToast]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) {
      return;
    }

    deleteExercise.mutate(
      { exerciseId: deleteTarget.id },
      {
        onSuccess: () => {
          addToast('Exercise deleted', { variant: 'success' });
          setDeleteTarget(null);
        },
        onError: (err) => addToast(err.message, { variant: 'error' }),
      }
    );
  }, [deleteTarget, deleteExercise, addToast]);

  const handleReorder = useCallback(
    (exerciseId: string, direction: 'up' | 'down') => {
      const reordered = swapAdjacentItem(
        exerciseList.map((e) => e.id),
        exerciseId,
        direction
      );

      if (!reordered) {
        return;
      }

      reorderExercises.mutate(
        { sessionId, orderedIds: reordered },
        {
          onSuccess: () => addToast('Exercise order updated', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [sessionId, exerciseList, reorderExercises, addToast]
  );

  // Loading state
  if (isLoading && exerciseCount > 0) {
    return (
      <div className="py-2">
        <LoadingSpinner size="sm" variant="center" />
      </div>
    );
  }

  return (
    <>
      {/* Exercise rows */}
      {exerciseList.length > 0 && (
        <div className="space-y-2">
          {exerciseList.map((exercise, index) =>
            editingId === exercise.id ? (
              <InlineFormPanel key={exercise.id} title="Edit Exercise">
                <ExerciseForm
                  initialValues={exerciseToFormValues(exercise)}
                  initialSelectedVideo={{ id: exercise.video.id, title: exercise.video.title }}
                  onSubmit={(values) => {
                    handleUpdate(exercise.id, values);
                  }}
                  onCancel={() => {
                    setEditingId(null);
                  }}
                  isSubmitting={updateExercise.isPending}
                />
              </InlineFormPanel>
            ) : (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                isFirst={index === 0}
                isLast={index === exerciseList.length - 1}
                onEdit={setEditingId}
                onDelete={(id) => {
                  const target = exerciseList.find((e) => e.id === id);

                  if (target) {
                    setDeleteTarget(target);
                  }
                }}
                onMoveUp={(id) => {
                  handleReorder(id, 'up');
                }}
                onMoveDown={(id) => {
                  handleReorder(id, 'down');
                }}
                isMutating={isMutating}
              />
            )
          )}
        </div>
      )}

      {/* Empty state */}
      {exerciseList.length === 0 && !isAdding && (
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground' }}
          className="py-2 text-center"
        >
          No exercises yet
        </Text>
      )}

      {/* Add exercise form */}
      {isAdding && (
        <InlineFormPanel title="New Exercise">
          <ExerciseForm
            onSubmit={handleCreate}
            onCancel={() => {
              setIsAdding(false);
            }}
            isSubmitting={createExercise.isPending}
            submitLabel="Add Exercise"
          />
        </InlineFormPanel>
      )}

      {/* Add exercise button */}
      {!isAdding && !editingId && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              setIsAdding(true);
            }}
            disabled={isMutating}
          >
            Add Exercise
          </Button>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteExercise.isPending}
        title="Delete Exercise"
        message="This will permanently delete this exercise. This action cannot be undone."
      />
    </>
  );
};
