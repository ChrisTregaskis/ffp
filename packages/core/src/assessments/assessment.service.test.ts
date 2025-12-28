/**
 * Assessment Service Unit Tests
 *
 * Essential tests for core business logic only.
 */

import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as contextModule from '../lib/context';
import { NotFoundError } from '../lib/errors';

import * as assessmentService from './assessment.service';
import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { AssessmentFlow } from './flow.repository';
import type { TenantContext, UserActor } from '../lib/context';

type ContextModule = typeof contextModule;

vi.mock('./flow.repository');
vi.mock('./user-assessment.repository');
vi.mock('../lib/context', async (importOriginal) => {
  const actual = await importOriginal<ContextModule>();
  return {
    ...actual,
    getUserIdFromContext: vi.fn(),
  };
});

const mockedFlowRepo = vi.mocked(flowRepository);
const mockedUserAssessmentRepo = vi.mocked(userAssessmentRepository);
const mockedContextModule = vi.mocked(contextModule);

const createUserContext = (): TenantContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'program_user',
    email: 'test@example.com',
  } as UserActor,
  tenantId: randomUUID(),
  customerId: randomUUID(),
  requestId: randomUUID(),
  timestamp: new Date(),
});

const createMockFlow = (id: string): AssessmentFlow => ({
  id,
  name: 'Test Flow',
  description: null,
  steps: [{ order: 1, type: 'intro', config: { title: 'Intro' } }],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Assessment Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('startAssessment', () => {
    it('creates new assessment when no resumable exists', async () => {
      const context = createUserContext();
      const flowId = randomUUID();
      const databaseUserId = randomUUID(); // Simulates resolved database user ID
      const mockAssessment = {
        id: randomUUID(),
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        currentStep: 1,
        status: 'not_started' as const,
        answers: {},
        scores: null,
        programmeId: null,
        startedAt: null,
        submittedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(createMockFlow(flowId));
      mockedUserAssessmentRepo.findResumable.mockResolvedValue(null);
      mockedUserAssessmentRepo.create.mockResolvedValue(mockAssessment);

      const result = await assessmentService.startAssessment(flowId, context);

      expect(result.isResumed).toBe(false);
      expect(mockedUserAssessmentRepo.create).toHaveBeenCalled();
    });

    it('returns existing assessment with isResumed=true', async () => {
      const context = createUserContext();
      const flowId = randomUUID();
      const databaseUserId = randomUUID(); // Simulates resolved database user ID
      const existingAssessment = {
        id: randomUUID(),
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        currentStep: 3,
        status: 'in_progress' as const,
        answers: { [randomUUID()]: { questionId: randomUUID(), answerValue: 4 } },
        scores: null,
        programmeId: null,
        startedAt: new Date(),
        submittedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(createMockFlow(flowId));
      mockedUserAssessmentRepo.findResumable.mockResolvedValue(existingAssessment);

      const result = await assessmentService.startAssessment(flowId, context);

      expect(result.isResumed).toBe(true);
      expect(result.currentStep).toBe(3);
      expect(mockedUserAssessmentRepo.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for invalid flow', async () => {
      const context = createUserContext();
      const flowId = randomUUID();
      const databaseUserId = randomUUID(); // Simulates resolved database user ID

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(null);

      await expect(assessmentService.startAssessment(flowId, context)).rejects.toThrow(
        NotFoundError
      );
      expect(mockedUserAssessmentRepo.findResumable).not.toHaveBeenCalled();
    });
  });
});
