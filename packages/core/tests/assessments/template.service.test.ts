import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as templateRepository from '../../src/assessments/template.repository';
import * as templateService from '../../src/assessments/template.service';
import { ConflictError, NotFoundError, ValidationError } from '../../src/lib/errors';
import * as questionRepository from '../../src/questions/question.repository';

import type { AssessmentTemplate } from '../../src/assessments/template.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { Question, QuestionWithConfig } from '../../src/questions/question.repository';

type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/assessments/template.repository');
vi.mock('../../src/questions/question.repository');
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(
      () =>
        ({
          // Runs the callback against the same stub, so repository calls inside a
          // transaction land on the mocked module just like the ones outside it.
          transaction: async (callback: (tx: unknown) => Promise<unknown>) => await callback({}),
        }) as unknown as ReturnType<FFPDatabaseModule['getDb']>
    ),
  };
});

const mockedTemplateRepo = vi.mocked(templateRepository);
const mockedQuestionRepo = vi.mocked(questionRepository);

const TEMPLATE_PUBLIC_ID = 'tmplABCDE123';

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

const createTemplate = (): AssessmentTemplate => ({
  id: randomUUID(),
  publicId: TEMPLATE_PUBLIC_ID,
  name: 'Wellness baseline',
  description: null,
  version: 1,
  isActive: true,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

let questionCount = 0;

const createQuestion = (overrides: Partial<Question> = {}): Question => {
  questionCount += 1;

  return {
    id: randomUUID(),
    publicId: `ques${String(questionCount).padStart(8, '0')}`,
    slug: `question-${String(questionCount)}`,
    type: 'single-choice',
    questionText: 'How active are you?',
    description: null,
    options: null,
    validation: null,
    videoId: null,
    scoreDimension: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

const toAssigned = (question: Question, displayOrder: number): QuestionWithConfig => ({
  id: question.id,
  publicId: question.publicId,
  slug: question.slug,
  type: question.type,
  questionText: question.questionText,
  description: question.description,
  options: question.options,
  validation: question.validation,
  videoId: question.videoId,
  scoreDimension: question.scoreDimension,
  isActive: question.isActive,
  displayOrder,
  configOverrides: null,
});

/** Serves lookups from the supplied bank, single and bulk alike. */
const stubQuestionLookup = (pool: Question[]): void => {
  mockedQuestionRepo.findQuestionByPublicId.mockImplementation(async (_db, publicId) =>
    Promise.resolve(pool.find((question) => question.publicId === publicId) ?? null)
  );
  mockedQuestionRepo.findQuestionsByPublicIds.mockImplementation(async (_db, publicIds) =>
    Promise.resolve(pool.filter((question) => publicIds.includes(question.publicId)))
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  questionCount = 0;
});

describe('templateService.assignQuestionsService', () => {
  it('appends the questions after the template current highest display order', async () => {
    const template = createTemplate();
    const existing = createQuestion();
    const toAdd = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([existing, toAdd]);
    mockedTemplateRepo.findQuestionAssignmentsByTemplateId.mockResolvedValue([
      { questionId: existing.id, displayOrder: 1, configOverrides: null },
    ]);
    mockedTemplateRepo.findMaxDisplayOrder.mockResolvedValue(1);
    mockedTemplateRepo.assignQuestions.mockResolvedValue([]);
    mockedQuestionRepo.findByTemplateId.mockResolvedValue([
      toAssigned(existing, 1),
      toAssigned(toAdd, 2),
    ]);

    const result = await templateService.assignQuestionsService(
      createContext(),
      TEMPLATE_PUBLIC_ID,
      { questionPublicIds: [toAdd.publicId] }
    );

    expect(mockedTemplateRepo.assignQuestions).toHaveBeenCalledWith(
      expect.anything(),
      template.id,
      [toAdd.id],
      2
    );
    expect(result.map((question) => question.publicId)).toEqual([
      existing.publicId,
      toAdd.publicId,
    ]);
  });

  it('rejects a question already assigned to the template', async () => {
    const template = createTemplate();
    const assigned = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([assigned]);
    mockedTemplateRepo.findQuestionAssignmentsByTemplateId.mockResolvedValue([
      { questionId: assigned.id, displayOrder: 1, configOverrides: null },
    ]);

    await expect(
      templateService.assignQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        questionPublicIds: [assigned.publicId],
      })
    ).rejects.toThrow(ConflictError);

    expect(mockedTemplateRepo.assignQuestions).not.toHaveBeenCalled();
  });

  it('rejects an inactive question', async () => {
    const template = createTemplate();
    const inactive = createQuestion({ isActive: false });

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([inactive]);

    await expect(
      templateService.assignQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        questionPublicIds: [inactive.publicId],
      })
    ).rejects.toThrow(ValidationError);

    expect(mockedTemplateRepo.assignQuestions).not.toHaveBeenCalled();
  });

  it('rejects a payload listing the same question twice', async () => {
    const template = createTemplate();
    const question = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([question]);

    await expect(
      templateService.assignQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        questionPublicIds: [question.publicId, question.publicId],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('404s on an unknown question', async () => {
    const template = createTemplate();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([]);

    await expect(
      templateService.assignQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        questionPublicIds: ['missingQ1234'],
      })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('templateService.reorderQuestionsService', () => {
  it('resolves the supplied order to question IDs and hands it to the two-phase reorder', async () => {
    const template = createTemplate();
    const first = createQuestion();
    const second = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    mockedQuestionRepo.findByTemplateId
      .mockResolvedValueOnce([toAssigned(first, 1), toAssigned(second, 2)])
      .mockResolvedValueOnce([toAssigned(second, 1), toAssigned(first, 2)]);

    const result = await templateService.reorderQuestionsService(
      createContext(),
      TEMPLATE_PUBLIC_ID,
      { orderedQuestionPublicIds: [second.publicId, first.publicId] }
    );

    expect(mockedTemplateRepo.reorderTemplateQuestions).toHaveBeenCalledWith(
      expect.anything(),
      template.id,
      [second.id, first.id]
    );
    expect(result.map((question) => question.publicId)).toEqual([second.publicId, first.publicId]);
  });

  it('rejects a partial order that would leave gaps in the sequence', async () => {
    const template = createTemplate();
    const first = createQuestion();
    const second = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    mockedQuestionRepo.findByTemplateId.mockResolvedValue([
      toAssigned(first, 1),
      toAssigned(second, 2),
    ]);

    await expect(
      templateService.reorderQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        orderedQuestionPublicIds: [first.publicId],
      })
    ).rejects.toThrow(ValidationError);

    expect(mockedTemplateRepo.reorderTemplateQuestions).not.toHaveBeenCalled();
  });

  it('rejects a question that is not assigned to the template', async () => {
    const template = createTemplate();
    const assigned = createQuestion();
    const stranger = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    mockedQuestionRepo.findByTemplateId.mockResolvedValue([toAssigned(assigned, 1)]);

    await expect(
      templateService.reorderQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        orderedQuestionPublicIds: [stranger.publicId],
      })
    ).rejects.toThrow(ValidationError);

    expect(mockedTemplateRepo.reorderTemplateQuestions).not.toHaveBeenCalled();
  });

  it('rejects a payload listing the same question twice', async () => {
    const template = createTemplate();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);

    await expect(
      templateService.reorderQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        orderedQuestionPublicIds: ['quesABCDE123', 'quesABCDE123'],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('404s on an unknown template', async () => {
    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(null);

    await expect(
      templateService.reorderQuestionsService(createContext(), TEMPLATE_PUBLIC_ID, {
        orderedQuestionPublicIds: ['quesABCDE123'],
      })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('templateService.unassignQuestionService', () => {
  it('removes the assignment and renumbers what is left', async () => {
    const template = createTemplate();
    const question = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([question]);
    mockedTemplateRepo.unassignQuestion.mockResolvedValue(true);

    await templateService.unassignQuestionService(
      createContext(),
      TEMPLATE_PUBLIC_ID,
      question.publicId
    );

    expect(mockedTemplateRepo.unassignQuestion).toHaveBeenCalledWith(
      expect.anything(),
      template.id,
      question.id
    );
    expect(mockedTemplateRepo.renumberTemplateQuestions).toHaveBeenCalledWith(
      expect.anything(),
      template.id
    );
  });

  it('404s when the question is not assigned to the template', async () => {
    const template = createTemplate();
    const question = createQuestion();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    stubQuestionLookup([question]);
    mockedTemplateRepo.unassignQuestion.mockResolvedValue(false);

    await expect(
      templateService.unassignQuestionService(
        createContext(),
        TEMPLATE_PUBLIC_ID,
        question.publicId
      )
    ).rejects.toThrow(NotFoundError);

    expect(mockedTemplateRepo.renumberTemplateQuestions).not.toHaveBeenCalled();
  });
});
