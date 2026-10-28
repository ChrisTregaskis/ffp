import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as templateRepository from '../../src/assessments/template.repository';
import * as templateService from '../../src/assessments/template.service';
import * as contextModule from '../../src/lib/context';
import { NotFoundError } from '../../src/lib/errors';
import * as questionRepository from '../../src/questions/question.repository';

import type {
  AssessmentTemplate,
  AssessmentTemplateWithQuestions,
} from '../../src/assessments/template.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';

type FFPDatabaseModule = typeof ffpDatabase;
type ContextModule = typeof contextModule;

vi.mock('../../src/assessments/template.repository');
vi.mock('../../src/questions/question.repository');
vi.mock('../../src/lib/context', async (importOriginal) => {
  const actual = await importOriginal<ContextModule>();

  return { ...actual, getUserIdFromContext: vi.fn() };
});
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(() => ({}) as unknown as ReturnType<FFPDatabaseModule['getDb']>),
  };
});

const mockedTemplateRepo = vi.mocked(templateRepository);
const mockedQuestionRepo = vi.mocked(questionRepository);
const mockedContextModule = vi.mocked(contextModule);

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
  name: 'Everyday activity',
  description: null,
  version: 1,
  isActive: false,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('templateService admin reads and writes by public identifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the template, its questions and the flows using it, even when deactivated', async () => {
    const template = createTemplate();
    const flow = { publicId: 'flowABCDE123', name: 'Wellness', isActive: true };

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    mockedQuestionRepo.findByTemplateId.mockResolvedValue([]);
    mockedTemplateRepo.findTemplateFlowUsage.mockResolvedValue([flow]);

    const result = await templateService.getAdminTemplateService(
      createContext(),
      TEMPLATE_PUBLIC_ID
    );

    expect(result).toMatchObject({ id: template.id, templateQuestions: [], flows: [flow] });
    expect(mockedQuestionRepo.findByTemplateId).toHaveBeenCalledWith(
      expect.anything(),
      template.id
    );
  });

  it('refuses an unknown public identifier with a 404 before any write', async () => {
    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(null);

    await expect(
      templateService.updateTemplateService(createContext(), 'zzzzzzzzzzzz', { name: 'Renamed' })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      templateService.deactivateTemplateService(createContext(), 'zzzzzzzzzzzz')
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(mockedTemplateRepo.updateTemplate).not.toHaveBeenCalled();
    expect(mockedTemplateRepo.deactivateTemplate).not.toHaveBeenCalled();
  });

  it('writes by the UUID the public identifier resolves to', async () => {
    const template = createTemplate();

    mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);
    mockedTemplateRepo.updateTemplate.mockResolvedValue(template);

    await templateService.updateTemplateService(createContext(), TEMPLATE_PUBLIC_ID, {
      name: 'Renamed',
    });

    expect(mockedTemplateRepo.updateTemplate).toHaveBeenCalledWith(
      expect.anything(),
      template.id,
      expect.objectContaining({ name: 'Renamed' })
    );
  });
});

describe('templateService create, list, deactivate and duplicate', () => {
  const ADMIN_USER_ID = randomUUID();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedContextModule.getUserIdFromContext.mockResolvedValue(ADMIN_USER_ID);
  });

  describe('createTemplateService', () => {
    it('creates an active version 1 template recorded against the requesting admin', async () => {
      const created = createTemplate();
      // A createdBy sent in the body is not the admin's to choose
      const input = {
        name: 'Everyday activity',
        description: 'Daily movement',
        createdBy: randomUUID(),
      };

      mockedTemplateRepo.createTemplate.mockResolvedValue(created);

      const result = await templateService.createTemplateService(createContext(), input);

      expect(result).toBe(created);
      expect(mockedTemplateRepo.createTemplate.mock.calls).toEqual([
        [
          expect.anything(),
          {
            name: 'Everyday activity',
            description: 'Daily movement',
            version: 1,
            isActive: true,
            createdBy: ADMIN_USER_ID,
          },
        ],
      ]);
    });

    it('refuses an invalid template, naming the field, before any write', async () => {
      await expect(
        templateService.createTemplateService(createContext(), { name: '' })
      ).rejects.toMatchObject({
        name: 'ValidationError',
        message: 'Invalid template input',
        details: { errors: [expect.objectContaining({ path: ['name'] })] },
      });

      expect(mockedTemplateRepo.createTemplate).not.toHaveBeenCalled();
    });
  });

  describe('listTemplatesService', () => {
    it('returns one page with its metadata, passing the paging and filters through', async () => {
      const row = { ...createTemplate(), questionCount: 3, flowCount: 1 };
      const pagination = { page: 2, pageSize: 10, sortDirection: 'asc' as const };
      const filters = { search: 'activity', isActive: true };

      mockedTemplateRepo.findTemplatePage.mockResolvedValue([row]);
      mockedTemplateRepo.countTemplates.mockResolvedValue(21);

      const result = await templateService.listTemplatesService(
        createContext(),
        pagination,
        filters
      );

      expect(result).toEqual({
        data: [row],
        pagination: { page: 2, pageSize: 10, total: 21, totalPages: 3 },
      });
      expect(mockedTemplateRepo.findTemplatePage).toHaveBeenCalledWith(
        expect.anything(),
        pagination,
        filters
      );
      expect(mockedTemplateRepo.countTemplates).toHaveBeenCalledWith(expect.anything(), filters);
    });
  });

  describe('deactivateTemplateService', () => {
    it('deactivates by the UUID the public identifier resolves to', async () => {
      const template = createTemplate();

      mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(template);

      await templateService.deactivateTemplateService(createContext(), TEMPLATE_PUBLIC_ID);

      expect(mockedTemplateRepo.deactivateTemplate.mock.calls).toEqual([
        [expect.anything(), template.id],
      ]);
    });
  });

  describe('duplicateTemplateService', () => {
    const assignments = [
      { questionId: randomUUID(), displayOrder: 1, configOverrides: null },
      { questionId: randomUUID(), displayOrder: 2, configOverrides: { questionText: 'Reworded' } },
    ];

    it('copies the source and its question assignments as the requesting admin, and returns the copy', async () => {
      const source = createTemplate();
      const copyId = randomUUID();
      const copy: AssessmentTemplateWithQuestions = {
        ...createTemplate(),
        id: copyId,
        name: 'Everyday activity (copy)',
        templateQuestions: [],
      };

      mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(source);
      mockedTemplateRepo.findQuestionAssignmentsByTemplateId.mockResolvedValue(assignments);
      mockedTemplateRepo.createDuplicateTemplate.mockResolvedValue(copyId);
      mockedTemplateRepo.findTemplateWithQuestions.mockResolvedValue(copy);

      const result = await templateService.duplicateTemplateService(
        createContext(),
        TEMPLATE_PUBLIC_ID,
        'Everyday activity (copy)'
      );

      expect(result).toBe(copy);
      expect(mockedTemplateRepo.findQuestionAssignmentsByTemplateId).toHaveBeenCalledWith(
        expect.anything(),
        source.id
      );
      expect(mockedTemplateRepo.createDuplicateTemplate.mock.calls).toEqual([
        [expect.anything(), ADMIN_USER_ID, 'Everyday activity (copy)', source, assignments],
      ]);
      expect(mockedTemplateRepo.findTemplateWithQuestions).toHaveBeenCalledWith(
        expect.anything(),
        copyId
      );
    });

    it('refuses an unknown source with a 404, before any write', async () => {
      mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(null);

      await expect(
        templateService.duplicateTemplateService(createContext(), 'zzzzzzzzzzzz', 'Copy')
      ).rejects.toMatchObject({
        name: 'NotFoundError',
        message: 'Assessment template with id zzzzzzzzzzzz not found',
      });

      expect(mockedTemplateRepo.createDuplicateTemplate).not.toHaveBeenCalled();
    });

    it('reports a server error when the copy cannot be read back', async () => {
      mockedTemplateRepo.findTemplateByPublicId.mockResolvedValue(createTemplate());
      mockedTemplateRepo.findQuestionAssignmentsByTemplateId.mockResolvedValue([]);
      mockedTemplateRepo.createDuplicateTemplate.mockResolvedValue(randomUUID());
      mockedTemplateRepo.findTemplateWithQuestions.mockResolvedValue(null);

      await expect(
        templateService.duplicateTemplateService(createContext(), TEMPLATE_PUBLIC_ID, 'Copy')
      ).rejects.toMatchObject({
        name: 'InternalServerError',
        statusCode: 500,
        message: 'Failed to fetch duplicated template after creation',
      });
    });
  });
});

describe('templateService member read', () => {
  const question = (isActive: boolean): ffpDatabase.QuestionWithConfig => ({
    id: randomUUID(),
    publicId: 'question0001',
    slug: `question-${String(isActive)}`,
    type: 'numeric',
    questionText: 'How many?',
    description: null,
    options: null,
    validation: { required: true },
    videoId: null,
    scoreDimension: null,
    isActive,
    displayOrder: 1,
    configOverrides: null,
  });

  it('shows a member only the template’s active questions, as validation and scoring read', async () => {
    const template = createTemplate();
    const active = question(true);

    mockedTemplateRepo.findTemplateWithQuestions.mockResolvedValue({
      ...template,
      templateQuestions: [question(false), active],
    });

    const result = await templateService.getTemplateService(createContext(), template.id);

    expect(result?.templateQuestions).toEqual([active]);
  });
});
