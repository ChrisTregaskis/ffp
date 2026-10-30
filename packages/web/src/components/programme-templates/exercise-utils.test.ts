import { describe, expect, it } from 'vitest';

import type { ExerciseResponse } from '@ffp/core';

import {
  EMPTY_EXERCISE_VALUES,
  exerciseToFormValues,
  prescriptionFromVideo,
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

describe('prescriptionFromVideo', () => {
  const typed = {
    ...EMPTY_EXERCISE_VALUES,
    sets: '5',
    reps: '6',
    durationSeconds: '',
    restSeconds: '90',
    notes: 'Slowly',
  };
  const video = {
    defaultSets: 2,
    defaultReps: '12',
    defaultDurationSeconds: 30,
    defaultRestSeconds: null,
    defaultNotes: null,
  };

  it('fills only the blank fields, so a prescription typed first survives', () => {
    expect(prescriptionFromVideo(video, typed, 'fill-empty')).toEqual({
      sets: '5',
      reps: '6',
      durationSeconds: '30',
      restSeconds: '90',
      notes: 'Slowly',
    });
  });

  it('replaces the prescription on a swap, clearing what the new video has no default for', () => {
    expect(prescriptionFromVideo(video, typed, 'overwrite')).toEqual({
      sets: '2',
      reps: '12',
      durationSeconds: '30',
      restSeconds: '',
      notes: '',
    });
  });

  it('keeps sets and reps on a swap to a video without them, as neither can be blank', () => {
    const bare = { ...video, defaultSets: null, defaultReps: null };

    expect(prescriptionFromVideo(bare, typed, 'overwrite')).toMatchObject({
      sets: '5',
      reps: '6',
    });
  });
});
