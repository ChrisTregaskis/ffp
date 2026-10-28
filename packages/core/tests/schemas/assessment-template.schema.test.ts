import { describe, it, expect } from 'vitest';

import {
  assessmentTemplateSchema,
  assessmentTemplateWithQuestionsSchema,
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
} from '../../src/schemas/assessment-template.schema';

import type { AssessmentQuestion } from '../../src/schemas/assessment-question.schema';

// Test fixtures with deterministic UUIDs
const QUESTION_UUID_1 = '11111111-1111-1111-8111-111111111001';
const VALID_PUBLIC_ID = 'abcdefgh1234';

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

describe('assessmentTemplateWithQuestionsSchema', () => {
  const row = (overrides: Record<string, unknown>): Record<string, unknown> => ({
    id: QUESTION_UUID_1,
    publicId: 'question0001',
    slug: 'focus-areas',
    type: 'multi-choice',
    questionText: 'Which areas?',
    description: null,
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
    validation: { required: true, maxSelections: 1 },
    videoId: null,
    scoreDimension: null,
    isActive: true,
    displayOrder: 1,
    configOverrides: null,
    ...overrides,
  });

  const parseQuestions = (...rows: Record<string, unknown>[]): AssessmentQuestion[] =>
    assessmentTemplateWithQuestionsSchema.parse({
      id: '11111111-1111-1111-8111-111111111106',
      publicId: 'template0001',
      name: 'Goals',
      description: null,
      version: 1,
      isActive: true,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateQuestions: rows,
    }).templateQuestions;

  it('applies a template override to the member’s validation', () => {
    expect(
      parseQuestions(row({ configOverrides: { validation: { required: false } } }))[0].validation
    ).toEqual({ required: false });
  });

  it('leaves out a deactivated question, as the server does', () => {
    const activeId = '11111111-1111-1111-8111-111111111002';

    expect(
      parseQuestions(row({ isActive: false }), row({ id: activeId })).map((q) => q.id)
    ).toEqual([activeId]);
  });
});
