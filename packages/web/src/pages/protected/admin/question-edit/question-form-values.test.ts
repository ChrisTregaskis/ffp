import { describe, expect, it } from 'vitest';

import type { AdminQuestionDetail } from '@ffp/core';

import {
  EMPTY_QUESTION_VALUES,
  toCreateQuestionInput,
  toQuestionFormValues,
  toQuestionValidation,
  toUpdateQuestionInput,
} from './question-form-values';

import type { QuestionFormValues } from './types';

const VIDEO_ID = '33333333-3333-3333-8333-333333330001';

const OPTIONS = [
  { value: 'low', label: 'Low', score: 1 },
  { value: 'high', label: 'High', score: 3 },
];

const stored = (overrides: Partial<AdminQuestionDetail> = {}): AdminQuestionDetail => ({
  id: '44444444-4444-4444-8444-444444440001',
  publicId: 'aaaaaaaaaaaa',
  slug: 'a-question',
  type: 'single-choice',
  questionText: 'A question?',
  description: null,
  options: OPTIONS,
  validation: { required: true },
  videoId: null,
  scoreDimension: 'activity',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  usage: { templateCount: 0, scoringFlowCount: 0 },
  linkedVideo: null,
  ...overrides,
});

const values = (overrides: Partial<QuestionFormValues> = {}): QuestionFormValues => ({
  ...EMPTY_QUESTION_VALUES,
  questionText: 'A question?',
  slug: 'a-question',
  options: [
    { value: 'low', label: 'Low', score: '1', isStored: true },
    { value: 'high', label: 'High', score: '3', isStored: false },
  ],
  ...overrides,
});

describe('toQuestionFormValues', () => {
  it('reads a question with no rules as required', () => {
    expect(toQuestionFormValues(stored({ validation: null })).required).toBe(true);
  });

  it('holds scores and bounds as strings, blank when unset', () => {
    const result = toQuestionFormValues(
      stored({
        type: 'multi-choice',
        options: [...OPTIONS, { value: 'none', label: 'None' }],
        validation: { required: false, maxSelections: 2 },
      })
    );

    expect(result.options.map((option) => option.score)).toEqual(['1', '3', '']);
    expect(result.options.every((option) => option.isStored)).toBe(true);
    expect(result.maxSelections).toBe('2');
    expect(result.min).toBe('');
    expect(result.required).toBe(false);
  });

  it('carries the linked video for display', () => {
    const result = toQuestionFormValues(
      stored({
        type: 'video-response',
        videoId: VIDEO_ID,
        linkedVideo: { publicId: 'bbbbbbbbbbbb', title: 'Wall squat' },
      })
    );

    expect(result).toMatchObject({
      videoId: VIDEO_ID,
      videoPublicId: 'bbbbbbbbbbbb',
      videoTitle: 'Wall squat',
    });
  });
});

describe('toQuestionValidation', () => {
  it('is null when nothing departs from the defaults', () => {
    expect(toQuestionValidation(values())).toBeNull();
  });

  it('keeps an optional question as an object', () => {
    expect(toQuestionValidation(values({ required: false }))).toEqual({ required: false });
  });

  it('drops the rules the chosen type does not use', () => {
    const result = toQuestionValidation(
      values({ type: 'single-choice', min: '1', max: '5', maxSelections: '2' })
    );

    expect(result).toBeNull();
  });

  it('sends bounds for a ranged type and the cap for multi-choice', () => {
    expect(toQuestionValidation(values({ type: 'numeric', min: '0', max: '10' }))).toEqual({
      required: true,
      min: 0,
      max: 10,
    });
    expect(toQuestionValidation(values({ type: 'multi-choice', maxSelections: '2' }))).toEqual({
      required: true,
      maxSelections: 2,
    });
  });

  it('carries rules the form does not edit, since validation is replaced whole', () => {
    expect(toQuestionValidation(values({ type: 'text', pattern: '^[a-z]+$' }))).toEqual({
      required: true,
      pattern: '^[a-z]+$',
    });
  });
});

describe('toCreateQuestionInput', () => {
  it('sends options with numeric scores for a choice type', () => {
    const result = toCreateQuestionInput(values({ scoreDimension: 'strength' }));

    expect(result.options).toEqual(OPTIONS);
    expect(result.scoreDimension).toBe('strength');
    expect(result.isActive).toBe(true);
  });

  it('sends no options or video for a type that takes none', () => {
    const result = toCreateQuestionInput(values({ type: 'numeric', videoId: VIDEO_ID }));

    expect(result.options).toBeUndefined();
    expect(result.videoId).toBeUndefined();
  });
});

describe('toUpdateQuestionInput', () => {
  it('clears emptied description and dimension with null', () => {
    const result = toUpdateQuestionInput(
      values({ description: '  ', scoreDimension: '' }),
      stored()
    );

    expect(result.description).toBeNull();
    expect(result.scoreDimension).toBeNull();
  });

  it('sends null validation when the rules are cleared', () => {
    const result = toUpdateQuestionInput(
      values({ type: 'numeric', min: '', max: '' }),
      stored({ type: 'numeric', options: null, validation: { required: true, min: 1, max: 9 } })
    );

    expect(result.validation).toBeNull();
  });

  it('strips stored options when moving to a type that takes none', () => {
    const result = toUpdateQuestionInput(values({ type: 'text' }), stored());

    expect(result.options).toEqual([]);
  });

  it('leaves options alone when nothing is stored to strip', () => {
    const result = toUpdateQuestionInput(
      values({ type: 'text' }),
      stored({ type: 'numeric', options: null })
    );

    expect(result.options).toBeUndefined();
  });

  it('omits videoId off video-response so the server drops the stored link', () => {
    const result = toUpdateQuestionInput(
      values({ type: 'numeric', videoId: VIDEO_ID }),
      stored({ type: 'video-response', options: null, videoId: VIDEO_ID })
    );

    expect(result.videoId).toBeUndefined();
  });
});
