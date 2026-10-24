import { describe, expect, it } from 'vitest';

import type { ExerciseResponse } from '@ffp/core';

import {
  exerciseToFormValues,
  toCreateExerciseRequest,
  toUpdateExerciseRequest,
} from './exercise-utils';

const stored = (overrides: Partial<ExerciseResponse> = {}): ExerciseResponse => ({
  id: '44444444-4444-4444-8444-444444440001',
  templateSessionId: '99999999-9999-9999-8999-999999990001',
  videoId: '33333333-3333-3333-8333-333333330001',
  orderIndex: 0,
  sets: 3,
  reps: '8-12',
  durationSeconds: 30,
  restSeconds: 45,
  notes: 'Keep the back flat.',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  video: {
    id: '33333333-3333-3333-8333-333333330001',
    publicId: 'aaaaaaaaaaaa',
    title: 'Wall squat',
    status: 'active',
  },
  ...overrides,
});

describe('toUpdateExerciseRequest', () => {
  it('sends nothing when the form matches the stored exercise', () => {
    const exercise = stored();

    expect(toUpdateExerciseRequest(exerciseToFormValues(exercise), exercise)).toEqual({});
  });

  it('clears blanked notes, duration and rest with null', () => {
    const exercise = stored();

    expect(
      toUpdateExerciseRequest(
        { ...exerciseToFormValues(exercise), notes: '', durationSeconds: '', restSeconds: '' },
        exercise
      )
    ).toEqual({ notes: null, durationSeconds: null, restSeconds: null });
  });

  it('sends only the changed sets and reps', () => {
    const exercise = stored();

    expect(
      toUpdateExerciseRequest(
        { ...exerciseToFormValues(exercise), sets: '4', reps: '10' },
        exercise
      )
    ).toEqual({ sets: 4, reps: '10' });
  });
});

describe('toCreateExerciseRequest', () => {
  it('leaves blank prescription fields out, for the video defaults to fill', () => {
    expect(
      toCreateExerciseRequest({
        videoId: '33333333-3333-3333-8333-333333330001',
        sets: '',
        reps: '',
        durationSeconds: '',
        restSeconds: '',
        notes: '',
      })
    ).toEqual({
      videoId: '33333333-3333-3333-8333-333333330001',
      sets: undefined,
      reps: undefined,
      durationSeconds: undefined,
      restSeconds: undefined,
      notes: undefined,
    });
  });
});
