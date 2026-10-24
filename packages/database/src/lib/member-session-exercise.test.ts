import { describe, expect, it } from 'vitest';

import { fromDrawnVideo, fromTemplateExercise } from './member-session-exercise';

import type { SessionExerciseRecord, VideoRecord } from '../schema';

const now = new Date();

const templateExercise: SessionExerciseRecord = {
  id: 'exercise-1',
  templateSessionId: 'session-1',
  videoId: 'video-1',
  orderIndex: 2,
  sets: 4,
  reps: '8-12',
  durationSeconds: null,
  restSeconds: 45,
  notes: 'Breathe out on the lift',
  createdAt: now,
  updatedAt: now,
};

const video = (defaults: Partial<VideoRecord>): VideoRecord =>
  ({
    id: 'video-2',
    defaultSets: null,
    defaultReps: null,
    defaultDurationSeconds: null,
    defaultRestSeconds: null,
    defaultNotes: null,
    ...defaults,
  }) as VideoRecord;

describe('fromTemplateExercise', () => {
  it('copies the prescription and points back at the template exercise', () => {
    expect(fromTemplateExercise(templateExercise)).toEqual({
      sourceSessionExerciseId: 'exercise-1',
      videoId: 'video-1',
      orderIndex: 2,
      sets: 4,
      reps: '8-12',
      durationSeconds: null,
      restSeconds: 45,
      notes: 'Breathe out on the lift',
    });
  });
});

describe('fromDrawnVideo', () => {
  it('prescribes from the video defaults', () => {
    expect(
      fromDrawnVideo(
        video({
          defaultSets: 2,
          defaultReps: '30s hold',
          defaultDurationSeconds: 30,
          defaultRestSeconds: 15,
          defaultNotes: 'Gently',
        }),
        1
      )
    ).toEqual({
      sourceSessionExerciseId: null,
      videoId: 'video-2',
      orderIndex: 1,
      sets: 2,
      reps: '30s hold',
      durationSeconds: 30,
      restSeconds: 15,
      notes: 'Gently',
    });
  });

  it('leaves missing sets and reps to the column defaults', () => {
    const fields = fromDrawnVideo(video({}), 0);

    expect(fields.sets).toBeUndefined();
    expect(fields.reps).toBeUndefined();
    expect(fields).toMatchObject({ durationSeconds: null, restSeconds: null, notes: null });
  });
});
