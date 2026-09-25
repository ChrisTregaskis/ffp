import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import { NotFoundError, ValidationError } from '../../src/lib/errors';
import * as questionRepository from '../../src/questions/question.repository';
import * as questionService from '../../src/questions/question.service';

import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { Question } from '../../src/questions/question.repository';

type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/questions/question.repository');
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(() => ({}) as unknown as ReturnType<FFPDatabaseModule['getDb']>),
  };
});

const mockedQuestionRepo = vi.mocked(questionRepository);

const QUESTION_PUBLIC_ID = 'quesABCDE123';
const VIDEO_ID = '550e8400-e29b-41d4-a716-446655440000';

const createContext = (): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'system_admin',
    email: 'admin@example.com',
  } as UserActor,
  organisationId: randomUUID(),
  locationId: randomUUID(),
  requestId: randomUUID(),
  timestamp: new Date(),
});

const createStoredQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: randomUUID(),
  publicId: QUESTION_PUBLIC_ID,
  slug: 'movement-confidence',
  type: 'text',
  questionText: 'How confident do you feel moving?',
  description: 'Helper text',
  options: null,
  validation: null,
  videoId: null,
  scoreDimension: 'mobility',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/** Stores the question the service resolves and returns it unchanged on write. */
const stubStoredQuestion = (question: Question): void => {
  mockedQuestionRepo.findQuestionByPublicId.mockResolvedValue(question);
  mockedQuestionRepo.updateQuestion.mockResolvedValue(question);
};

/** The update payload the service handed the repository. */
const writtenUpdate = (): Record<string, unknown> =>
  mockedQuestionRepo.updateQuestion.mock.calls[0][2] as Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('questionService.updateQuestionService — clearable fields', () => {
  it('clears description, videoId and scoreDimension on an explicit null', async () => {
    const stored = createStoredQuestion({ type: 'video-response', videoId: VIDEO_ID });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      description: null,
      scoreDimension: null,
    });

    expect(writtenUpdate()).toMatchObject({ description: null, scoreDimension: null });
  });

  it('leaves an omitted clearable field out of the write entirely', async () => {
    const stored = createStoredQuestion();

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      questionText: 'Reworded',
    });

    const update = writtenUpdate();

    expect('description' in update).toBe(false);
    expect('scoreDimension' in update).toBe(false);
    expect('videoId' in update).toBe(false);
  });

  it('404s on an unknown question before touching the write path', async () => {
    mockedQuestionRepo.findQuestionByPublicId.mockResolvedValue(null);

    await expect(
      questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
        questionText: 'Reworded',
      })
    ).rejects.toThrow(NotFoundError);

    expect(mockedQuestionRepo.updateQuestion).not.toHaveBeenCalled();
  });
});

describe('questionService.updateQuestionService — merged-shape validation', () => {
  it('rejects a maxSelections cap that breaches the stored option count', async () => {
    const stored = createStoredQuestion({
      type: 'multi-choice',
      options: [
        { value: 'walking', label: 'Walking' },
        { value: 'swimming', label: 'Swimming' },
      ],
    });

    stubStoredQuestion(stored);

    await expect(
      questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
        validation: { maxSelections: 3 },
      })
    ).rejects.toThrow(ValidationError);

    expect(mockedQuestionRepo.updateQuestion).not.toHaveBeenCalled();
  });

  it('accepts a cap that the stored options can satisfy', async () => {
    const stored = createStoredQuestion({
      type: 'multi-choice',
      options: [
        { value: 'walking', label: 'Walking' },
        { value: 'swimming', label: 'Swimming' },
      ],
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      validation: { maxSelections: 2 },
    });

    expect(mockedQuestionRepo.updateQuestion).toHaveBeenCalled();
  });

  it('accepts a switch to a choice type that relies on the stored options', async () => {
    const stored = createStoredQuestion({
      type: 'single-choice',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'multi-choice',
    });

    expect(mockedQuestionRepo.updateQuestion).toHaveBeenCalled();
  });

  it('rejects clearing the video of a question that stays video-response', async () => {
    const stored = createStoredQuestion({ type: 'video-response', videoId: VIDEO_ID });

    stubStoredQuestion(stored);

    await expect(
      questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, { videoId: null })
    ).rejects.toThrow(ValidationError);
  });
});

describe('questionService.updateQuestionService — type-change clean-up', () => {
  it('clears the video reference when leaving video-response', async () => {
    const stored = createStoredQuestion({ type: 'video-response', videoId: VIDEO_ID });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'text',
    });

    expect(writtenUpdate()).toMatchObject({ type: 'text', videoId: null });
  });

  it('keeps a video the payload supplies alongside the type change', async () => {
    const stored = createStoredQuestion({ type: 'video-response', videoId: VIDEO_ID });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'text',
      videoId: VIDEO_ID,
    });

    expect(writtenUpdate()).toMatchObject({ videoId: VIDEO_ID });
  });

  it('clears maxSelections when leaving multi-choice', async () => {
    const stored = createStoredQuestion({
      type: 'multi-choice',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      validation: { required: true, maxSelections: 2 },
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'single-choice',
    });

    expect(writtenUpdate().validation).toEqual({ required: true, maxSelections: undefined });
  });

  it('rejects a maxSelections the payload supplies for a type that cannot carry one', async () => {
    const stored = createStoredQuestion({
      type: 'multi-choice',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      validation: { required: true, maxSelections: 2 },
    });

    stubStoredQuestion(stored);

    // The clean-up must not swallow a value the author typed: the same body
    // posted to create is refused, so the update has to refuse it too.
    await expect(
      questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
        type: 'numeric',
        validation: { required: true, maxSelections: 3 },
      })
    ).rejects.toThrow(ValidationError);

    expect(mockedQuestionRepo.updateQuestion).not.toHaveBeenCalled();
  });

  it('rejects a contradictory range the payload supplies alongside a type change', async () => {
    const stored = createStoredQuestion({ type: 'numeric' });

    stubStoredQuestion(stored);

    await expect(
      questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
        type: 'single-choice',
        options: [
          { value: 'y', label: 'Yes' },
          { value: 'n', label: 'No' },
        ],
        validation: { required: true, min: 10, max: 1 },
      })
    ).rejects.toThrow(ValidationError);

    expect(mockedQuestionRepo.updateQuestion).not.toHaveBeenCalled();
  });

  it('leaves a stored validation.required alone when the payload adds a bound', async () => {
    const stored = createStoredQuestion({
      type: 'text',
      validation: { required: false, pattern: '^[A-Z]{2}$' },
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      validation: { min: 3 },
    });

    expect((writtenUpdate().validation as Record<string, unknown>).required).toBeUndefined();
  });

  it('keeps a video-response duration range across an edit', async () => {
    const stored = createStoredQuestion({
      type: 'video-response',
      videoId: VIDEO_ID,
      validation: { required: true, min: 0, max: 300 },
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      questionText: 'Wall squat hold',
    });

    expect(mockedQuestionRepo.updateQuestion).toHaveBeenCalled();
  });

  it('clears the scoring range when moving to a type that takes none', async () => {
    const stored = createStoredQuestion({
      type: 'scale',
      validation: { required: true, min: 1, max: 10 },
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'single-choice',
    });

    expect(writtenUpdate().validation).toMatchObject({ min: undefined, max: undefined });
  });

  it('carries the range over to video-response, which reads it as a duration', async () => {
    const stored = createStoredQuestion({
      type: 'numeric',
      validation: { required: true, min: 0, max: 100 },
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'video-response',
      videoId: VIDEO_ID,
    });

    expect(writtenUpdate().validation).toMatchObject({ min: 0, max: 100 });
  });

  it('keeps the scoring range when the new type still takes one', async () => {
    const stored = createStoredQuestion({
      type: 'numeric',
      validation: { required: true, min: 1, max: 10 },
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      type: 'scale',
    });

    expect(writtenUpdate().validation).toMatchObject({ min: 1, max: 10 });
  });

  it('leaves validation untouched when the type does not change', async () => {
    const stored = createStoredQuestion({
      type: 'numeric',
      validation: { required: true, min: 1, max: 10 },
    });

    stubStoredQuestion(stored);

    await questionService.updateQuestionService(createContext(), QUESTION_PUBLIC_ID, {
      questionText: 'Reworded',
    });

    expect('validation' in writtenUpdate()).toBe(false);
  });
});
