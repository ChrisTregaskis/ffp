import { describe, it, expect } from 'vitest';

import {
  assessmentQuestionSchema,
  questionsArraySchema,
} from '../../src/schemas/assessment-question.schema';
import {
  assessmentTemplateSchema,
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
} from '../../src/schemas/assessment-template.schema';
import {
  scoringConfigSchema,
  dimensionConfigSchema,
} from '../../src/schemas/scoring-config.schema';

// Test fixtures with deterministic UUIDs
const QUESTION_UUID_1 = '11111111-1111-1111-8111-111111111001';
const QUESTION_UUID_2 = '11111111-1111-1111-8111-111111111002';
const QUESTION_UUID_3 = '11111111-1111-1111-8111-111111111003';
const QUESTION_UUID_4 = '11111111-1111-1111-8111-111111111004';
const QUESTION_UUID_5 = '11111111-1111-1111-8111-111111111005';
const VALID_PUBLIC_ID = 'abcdefgh1234';

const validQuestion = {
  id: QUESTION_UUID_1,
  publicId: VALID_PUBLIC_ID,
  type: 'text' as const,
  question: 'How are you feeling today?',
};

const validSingleChoiceQuestion = {
  id: QUESTION_UUID_2,
  publicId: VALID_PUBLIC_ID,
  type: 'single-choice' as const,
  question: 'Rate your pain level',
  options: [
    { value: 'low', label: 'Low', score: 1 },
    { value: 'high', label: 'High', score: 3 },
  ],
};

const validVideoQuestion = {
  id: QUESTION_UUID_3,
  publicId: VALID_PUBLIC_ID,
  type: 'video-response' as const,
  question: 'Perform the exercise shown',
  videoId: '550e8400-e29b-41d4-a716-446655440000',
};

const validScoringConfig = {
  dimensions: [
    {
      name: 'general' as const,
      questionIds: [QUESTION_UUID_1],
      maxScore: 10,
    },
  ],
  programmeMappings: [
    {
      conditions: [{ dimension: 'general' as const, operator: 'gte' as const, value: 5 }],
      programmeTemplateId: 'prog-1',
    },
  ],
};

const validTemplate = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  publicId: VALID_PUBLIC_ID,
  name: 'Test Template',
  description: 'A test template',
  version: 1,
  isActive: true,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('assessmentQuestionSchema', () => {
  describe('valid questions', () => {
    it('accepts valid text question', () => {
      const result = assessmentQuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it('accepts valid single-choice question with options', () => {
      const result = assessmentQuestionSchema.safeParse(validSingleChoiceQuestion);
      expect(result.success).toBe(true);
    });

    it('accepts valid multi-choice question with options', () => {
      const result = assessmentQuestionSchema.safeParse({
        ...validSingleChoiceQuestion,
        type: 'multi-choice',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid video-response question with videoId', () => {
      const result = assessmentQuestionSchema.safeParse(validVideoQuestion);
      expect(result.success).toBe(true);
    });

    it('accepts valid numeric question', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_4,
        publicId: VALID_PUBLIC_ID,
        type: 'numeric',
        question: 'Enter your age',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid scale question', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_5,
        publicId: VALID_PUBLIC_ID,
        type: 'scale',
        question: 'Rate from 1-10',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid question types', () => {
    it('rejects invalid question type', () => {
      const result = assessmentQuestionSchema.safeParse({
        ...validQuestion,
        type: 'invalid-type',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('video-response requires videoId', () => {
    it('rejects video-response without videoId', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_3,
        publicId: VALID_PUBLIC_ID,
        type: 'video-response',
        question: 'Perform the exercise',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('videoId is required');
      }
    });
  });

  describe('choice questions require options', () => {
    it('rejects single-choice without options', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_2,
        publicId: VALID_PUBLIC_ID,
        type: 'single-choice',
        question: 'Pick one',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least 2 options');
      }
    });

    it('rejects single-choice with only 1 option', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_2,
        publicId: VALID_PUBLIC_ID,
        type: 'single-choice',
        question: 'Pick one',
        options: [{ value: 'only', label: 'Only option' }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least 2 options');
      }
    });

    it('rejects multi-choice without options', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_2,
        type: 'multi-choice',
        question: 'Pick many',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('rejects missing id', () => {
      const result = assessmentQuestionSchema.safeParse({
        type: 'text',
        question: 'Test?',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing question text', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_1,
        type: 'text',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty question text', () => {
      const result = assessmentQuestionSchema.safeParse({
        id: QUESTION_UUID_1,
        type: 'text',
        question: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('questionsArraySchema', () => {
  it('accepts array with at least one question', () => {
    const result = questionsArraySchema.safeParse([validQuestion]);
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = questionsArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one question');
    }
  });
});

describe('scoringConfigSchema', () => {
  it('accepts valid scoring config', () => {
    const result = scoringConfigSchema.safeParse(validScoringConfig);
    expect(result.success).toBe(true);
  });

  it('accepts scoring config with risk thresholds', () => {
    const result = scoringConfigSchema.safeParse({
      dimensions: [
        {
          name: 'strength',
          questionIds: [QUESTION_UUID_1, QUESTION_UUID_2],
          maxScore: 20,
          weight: 1.5,
          riskThresholds: { low: 15, moderate: 10 },
        },
      ],
      programmeMappings: [],
    });
    expect(result.success).toBe(true);
  });

  it('applies default weight of 1', () => {
    const result = dimensionConfigSchema.safeParse({
      name: 'balance',
      questionIds: [QUESTION_UUID_1],
      maxScore: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight).toBe(1);
    }
  });
});

describe('assessmentTemplateSchema', () => {
  it('accepts valid template', () => {
    const result = assessmentTemplateSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it('accepts template with null description', () => {
    const result = assessmentTemplateSchema.safeParse({
      ...validTemplate,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for id', () => {
    const result = assessmentTemplateSchema.safeParse({
      ...validTemplate,
      id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = assessmentTemplateSchema.safeParse({
      ...validTemplate,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 255 characters', () => {
    const result = assessmentTemplateSchema.safeParse({
      ...validTemplate,
      name: 'a'.repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive version', () => {
    const result = assessmentTemplateSchema.safeParse({
      ...validTemplate,
      version: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer version', () => {
    const result = assessmentTemplateSchema.safeParse({
      ...validTemplate,
      version: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('createAssessmentTemplateSchema', () => {
  it('accepts valid create input (omits id, createdAt, updatedAt)', () => {
    const result = createAssessmentTemplateSchema.safeParse({
      name: 'New Template',
      description: 'Description',
      version: 1,
      isActive: true,
      createdBy: null,
    });
    expect(result.success).toBe(true);
  });

  it('ignores id if provided (omit strips it)', () => {
    const result = createAssessmentTemplateSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'New Template',
      description: 'Description',
      version: 1,
      isActive: true,
      createdBy: null,
    });
    // Zod's omit strips the id field, so it passes validation
    expect(result.success).toBe(true);
  });
});

describe('updateAssessmentTemplateSchema', () => {
  it('accepts partial update with just name', () => {
    const result = updateAssessmentTemplateSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with just isActive', () => {
    const result = updateAssessmentTemplateSchema.safeParse({
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no updates)', () => {
    const result = updateAssessmentTemplateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates fields when provided', () => {
    const result = updateAssessmentTemplateSchema.safeParse({
      name: '', // Invalid - empty string
    });
    expect(result.success).toBe(false);
  });
});
