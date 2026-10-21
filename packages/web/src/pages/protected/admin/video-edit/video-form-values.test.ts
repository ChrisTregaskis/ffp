import { describe, expect, it } from 'vitest';

import type { AdminVideoDetail } from '@ffp/core';

import { archivesVideo, toUpdateVideoInput, toVideoFormValues } from './video-form-values';

const strength = { publicId: 'mvstrength01', slug: 'strength', label: 'Strength' };
const cardio = { publicId: 'mvcardio0001', slug: 'cardio', label: 'Cardio' };
const glutes = { publicId: 'baglutes0001', slug: 'glutes', label: 'Glutes' };
const quadriceps = { publicId: 'baquads00001', slug: 'quadriceps', label: 'Quadriceps' };
const seated = { publicId: 'auseated0001', slug: 'seated', label: 'Seated' };

const stored = (overrides: Partial<AdminVideoDetail> = {}): AdminVideoDetail => ({
  id: '33333333-3333-3333-8333-333333330001',
  publicId: 'aaaaaaaaaaaa',
  title: 'Wall squat',
  description: 'Back flat against the wall.',
  durationSeconds: 60,
  status: 'active',
  difficulty: 'beginner',
  equipment: ['none', 'chair'],
  isEssential: false,
  tags: {
    goal: [],
    'body-area': [glutes, quadriceps],
    movement: [strength],
    audience: [seated],
  },
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
      toUpdateVideoInput({ ...toVideoFormValues(video), equipment: ['chair', 'none'] }, video)
    ).toEqual({ equipment: ['chair', 'none'] });
  });

  it('treats the same tags in another order as unchanged', () => {
    const video = stored();
    const values = {
      ...toVideoFormValues(video),
      bodyAreaTags: [quadriceps.publicId, glutes.publicId],
    };

    expect(toUpdateVideoInput(values, video)).toEqual({});
  });

  it('sends two movement tags and no body areas, leaving the other categories alone', () => {
    const video = stored();
    const values = {
      ...toVideoFormValues(video),
      movementTags: [strength.publicId, cardio.publicId],
      bodyAreaTags: [],
    };

    expect(toUpdateVideoInput(values, video)).toEqual({
      tags: { movement: [strength.publicId, cardio.publicId], 'body-area': [] },
    });
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

describe('archivesVideo', () => {
  it('holds an edit that archives the video', () => {
    const video = stored();

    expect(archivesVideo({ ...toVideoFormValues(video), status: 'archived' }, video)).toBe(true);
  });

  it('lets an edit through that leaves an archived video archived', () => {
    const video = stored({ status: 'archived' });

    expect(archivesVideo({ ...toVideoFormValues(video), title: 'Renamed' }, video)).toBe(false);
  });
});
