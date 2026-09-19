import { describe, it, expect } from 'vitest';

import {
  createQuestionSchema,
  questionShapeSchema,
  updateQuestionSchema,
} from '../../src/schemas/assessment-question.schema';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const validOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

describe('createQuestionSchema', () => {
  describe('slug', () => {
    it('accepts a kebab-case slug', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'pain-level',
        type: 'text',
        questionText: 'Describe your pain',
      });

      expect(result.success).toBe(true);
    });

    it.each(['Pain Level', 'pain_level', 'PainLevel', 'pain--level', '-pain', 'pain-'])(
      'rejects a non-kebab-case slug: %s',
      (slug) => {
        const result = createQuestionSchema.safeParse({
          slug,
          type: 'text',
          questionText: 'Describe your pain',
        });

        expect(result.success).toBe(false);
      }
    );

    it('requires a slug', () => {
      const result = createQuestionSchema.safeParse({
        type: 'text',
        questionText: 'Describe your pain',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('choice types', () => {
    it('accepts a single-choice question with two options', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'has-pain',
        type: 'single-choice',
        questionText: 'Do you have pain?',
        options: validOptions,
      });

      expect(result.success).toBe(true);
    });

    it('rejects a single-choice question with fewer than two options', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'has-pain',
        type: 'single-choice',
        questionText: 'Do you have pain?',
        options: [{ value: 'yes', label: 'Yes' }],
      });

      expect(result.success).toBe(false);
    });

    it('rejects a multi-choice question with no options', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'symptoms',
        type: 'multi-choice',
        questionText: 'Which symptoms?',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('maxSelections', () => {
    it('accepts maxSelections within the option count on multi-choice', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'symptoms',
        type: 'multi-choice',
        questionText: 'Which symptoms?',
        options: validOptions,
        validation: { maxSelections: 2 },
      });

      expect(result.success).toBe(true);
    });

    it('rejects maxSelections exceeding the option count', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'symptoms',
        type: 'multi-choice',
        questionText: 'Which symptoms?',
        options: validOptions,
        validation: { maxSelections: 3 },
      });

      expect(result.success).toBe(false);
    });

    it('rejects maxSelections on a non-multi-choice question', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'pain-level',
        type: 'scale',
        questionText: 'Rate your pain',
        validation: { maxSelections: 2 },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('numeric / scale / text bounds', () => {
    it('accepts min <= max', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'pain-level',
        type: 'scale',
        questionText: 'Rate your pain',
        validation: { min: 1, max: 10 },
      });

      expect(result.success).toBe(true);
    });

    it('rejects min > max', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'pain-level',
        type: 'numeric',
        questionText: 'How many days?',
        validation: { min: 10, max: 1 },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('video-response', () => {
    it('accepts a video-response with a videoId and no scoring range', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'squat-demo',
        type: 'video-response',
        questionText: 'Record a squat',
        videoId: validUuid,
      });

      expect(result.success).toBe(true);
    });

    it('requires a videoId for video-response', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'squat-demo',
        type: 'video-response',
        questionText: 'Record a squat',
      });

      expect(result.success).toBe(false);
    });

    it('accepts a duration range on video-response', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'squat-demo',
        type: 'video-response',
        questionText: 'Record a squat',
        videoId: validUuid,
        validation: { min: 0, max: 300 },
      });

      expect(result.success).toBe(true);
    });

    it('still rejects min > max on video-response', () => {
      const result = createQuestionSchema.safeParse({
        slug: 'squat-demo',
        type: 'video-response',
        questionText: 'Record a squat',
        videoId: validUuid,
        validation: { min: 300, max: 0 },
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('updateQuestionSchema', () => {
  it('ignores slug (immutable — not part of the update shape)', () => {
    const result = updateQuestionSchema.safeParse({
      slug: 'a-new-slug',
      questionText: 'Updated text',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect('slug' in result.data).toBe(false);
    }
  });

  it('accepts a partial update with no type (per-type checks skipped)', () => {
    const result = updateQuestionSchema.safeParse({ questionText: 'Updated text' });

    expect(result.success).toBe(true);
  });

  it('leaves the per-type rules to the merged check in the service', () => {
    // A partial cannot see the options it did not resend, so enforcing the
    // rules here would reject a legitimate switch to a choice type. The service
    // runs them over the payload merged onto the stored row instead.
    const result = updateQuestionSchema.safeParse({
      type: 'single-choice',
      questionText: 'Updated text',
    });

    expect(result.success).toBe(true);
  });

  it('accepts an explicit null on each clearable field', () => {
    const result = updateQuestionSchema.safeParse({
      description: null,
      videoId: null,
      scoreDimension: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ description: null, videoId: null, scoreDimension: null });
    }
  });

  it('leaves an omitted clearable field absent rather than null', () => {
    const result = updateQuestionSchema.safeParse({ questionText: 'Updated text' });

    expect(result.success).toBe(true);
    if (result.success) {
      // Absent means "leave alone" — the repository update set drops undefined,
      // so a null here would silently clear the stored value.
      expect('description' in result.data).toBe(false);
      expect('videoId' in result.data).toBe(false);
      expect('scoreDimension' in result.data).toBe(false);
    }
  });

  it('still rejects a malformed value on a clearable field', () => {
    const result = updateQuestionSchema.safeParse({ videoId: 'not-a-uuid' });

    expect(result.success).toBe(false);
  });
  it('does not default isActive when omitted (no silent reactivation)', () => {
    const result = updateQuestionSchema.safeParse({ questionText: 'Updated text' });

    expect(result.success).toBe(true);
    if (result.success) {
      // The field must be absent, not coerced to true — otherwise a partial
      // update would resurrect a soft-deleted question.
      expect('isActive' in result.data).toBe(false);
    }
  });

  it('still allows an explicit isActive on update (deliberate reactivation)', () => {
    const result = updateQuestionSchema.safeParse({ isActive: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it('does not default validation.required (no silent switch to mandatory)', () => {
    const result = updateQuestionSchema.safeParse({ validation: { min: 3 } });

    expect(result.success).toBe(true);
    if (result.success) {
      // A nested default survives `.partial()` too, so an update adding a bound
      // would otherwise force an optional question to become mandatory.
      expect('required' in (result.data.validation ?? {})).toBe(false);
    }
  });

  it('still allows an explicit validation.required', () => {
    const result = updateQuestionSchema.safeParse({ validation: { required: false } });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.validation?.required).toBe(false);
    }
  });
});

describe('questionShapeSchema', () => {
  it('accepts a complete, consistent shape', () => {
    const result = questionShapeSchema.safeParse({
      type: 'multi-choice',
      options: validOptions,
      validation: { maxSelections: 2 },
    });

    expect(result.success).toBe(true);
  });

  it('rejects maxSelections above the option count', () => {
    const result = questionShapeSchema.safeParse({
      type: 'multi-choice',
      options: validOptions,
      validation: { maxSelections: 3 },
    });

    expect(result.success).toBe(false);
  });

  it('tolerates the nulls a stored row carries', () => {
    const result = questionShapeSchema.safeParse({
      type: 'text',
      options: null,
      validation: null,
      videoId: null,
    });

    expect(result.success).toBe(true);
  });
});

describe('createQuestionSchema — isActive default', () => {
  it('defaults isActive to true when omitted', () => {
    const result = createQuestionSchema.safeParse({
      slug: 'pain-level',
      type: 'text',
      questionText: 'Describe your pain',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });
});

describe('min/max bounds across types', () => {
  it('rejects min > max on a non-range type that still carries the fields', () => {
    const result = createQuestionSchema.safeParse({
      slug: 'has-pain',
      type: 'single-choice',
      questionText: 'Do you have pain?',
      options: validOptions,
      validation: { min: 10, max: 1 },
    });

    expect(result.success).toBe(false);
  });
});
