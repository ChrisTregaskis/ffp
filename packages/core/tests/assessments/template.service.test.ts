import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as templateRepository from '../../src/assessments/template.repository';
import * as templateService from '../../src/assessments/template.service';
import { NotFoundError } from '../../src/lib/errors';
import * as questionRepository from '../../src/questions/question.repository';

import type { AssessmentTemplate } from '../../src/assessments/template.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';

type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/assessments/template.repository');
vi.mock('../../src/questions/question.repository');
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(() => ({}) as unknown as ReturnType<FFPDatabaseModule['getDb']>),
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
