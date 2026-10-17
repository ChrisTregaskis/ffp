import { describe, expect, it } from 'vitest';

import type { AdminQuestionDetail } from '@ffp/core';

import { describeTypeChangeLoss, describeTypeChangeNotes } from './question-type-change';

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

describe('describeTypeChangeLoss', () => {
  it('is empty when the type is unchanged', () => {
    expect(describeTypeChangeLoss(stored(), 'single-choice')).toEqual([]);
  });

  it('names options, cap, range and video as they apply', () => {
    expect(
      describeTypeChangeLoss(
        stored({ type: 'multi-choice', validation: { required: true, maxSelections: 2 } }),
        'numeric'
      )
    ).toEqual([
      'its 2 answer options and their scores',
      'the cap on how many options a member can pick',
    ]);

    expect(
      describeTypeChangeLoss(
        stored({
          type: 'video-response',
          options: null,
          videoId: VIDEO_ID,
          validation: { required: true, min: 0, max: 300 },
        }),
        'single-choice'
      )
    ).toEqual(['its minimum and maximum', 'its linked video']);
  });
});

describe('describeTypeChangeNotes', () => {
  it('warns when the question is scored or on templates', () => {
    expect(
      describeTypeChangeNotes(
        stored({ usage: { templateCount: 2, scoringFlowCount: 1 } }),
        'multi-choice'
      )
    ).toEqual([
      '1 flow scores this question, and its answers will count differently.',
      'It is on 2 assessment templates, so members will see the new type there.',
    ]);
  });

  it('notes a range that survives under a different meaning', () => {
    expect(
      describeTypeChangeNotes(
        stored({ type: 'numeric', options: null, validation: { required: true, min: 1, max: 9 } }),
        'text'
      )
    ).toEqual(['Its minimum and maximum are kept, but will now mean something different.']);
  });
});
