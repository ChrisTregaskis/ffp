import { describe, expect, it } from 'vitest';

import type { VideoDetailResponse } from '@ffp/core';

import { toUpdateVideoInput, toVideoFormValues } from './video-form-values';

const stored = (overrides: Partial<VideoDetailResponse> = {}): VideoDetailResponse => ({
  id: '33333333-3333-3333-8333-333333330001',
  publicId: 'aaaaaaaaaaaa',
  title: 'Wall squat',
  description: 'Back flat against the wall.',
  durationSeconds: 60,
  status: 'published',
  difficulty: 'beginner',
  movementType: 'strength',
  bodyParts: ['quads', 'glutes'],
  equipment: ['none'],
  tags: ['warm-up'],
  defaultSets: 3,
  defaultReps: '8-12',
  defaultDurationSeconds: null,
  defaultRestSeconds: 60,
  defaultNotes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('toUpdateVideoInput', () => {
  it('sends nothing when the form matches the stored video', () => {
    const video = stored();

    expect(toUpdateVideoInput(toVideoFormValues(video), video)).toEqual({});
  });

  it('sends only the changed field', () => {
    const video = stored();

    expect(toUpdateVideoInput({ ...toVideoFormValues(video), title: 'Wall sit' }, video)).toEqual({
      title: 'Wall sit',
    });
  });

  it('sends a list whose contents or order changed', () => {
    const video = stored();

    expect(
      toUpdateVideoInput({ ...toVideoFormValues(video), bodyParts: ['glutes', 'quads'] }, video)
    ).toEqual({ bodyParts: ['glutes', 'quads'] });
  });

  it('clears blanked fields with null', () => {
    const video = stored();
    const values = {
      ...toVideoFormValues(video),
      description: '',
      difficulty: '',
      defaultSets: '',
      defaultReps: '',
    };

    expect(toUpdateVideoInput(values, video)).toEqual({
      description: null,
      difficulty: null,
      defaultSets: null,
      defaultReps: null,
    });
  });

  it('treats a blank field over a null stored value as unchanged', () => {
    const video = stored({ description: null, difficulty: null, defaultSets: null });

    expect(toUpdateVideoInput(toVideoFormValues(video), video)).toEqual({});
  });

  it('turns a filled number field into a number', () => {
    const video = stored();

    expect(
      toUpdateVideoInput({ ...toVideoFormValues(video), defaultDurationSeconds: '30' }, video)
    ).toEqual({ defaultDurationSeconds: 30 });
  });
});
