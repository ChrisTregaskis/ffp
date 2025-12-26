/**
 * Assessment Service Unit Tests
 *
 * Essential tests for core business logic only.
 */

import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '../lib/errors';

import * as assessmentService from './assessment.service';
import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { AssessmentFlow } from './flow.repository';
import type { TenantContext, UserActor } from '../lib/context';

vi.mock('./flow.repository');
vi.mock('./user-assessment.repository');

const mockedFlowRepo = vi.mocked(flowRepository);
const mockedUserAssessmentRepo = vi.mocked(userAssessmentRepository);

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
      const mockAssessment = {
        id: randomUUID(),
        tenantId: context.tenantId,
        userId: (context.actor as UserActor).userId,
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
      const existingAssessment = {
        id: randomUUID(),
        tenantId: context.tenantId,
        userId: (context.actor as UserActor).userId,
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

      mockedFlowRepo.findActiveById.mockResolvedValue(null);

      await expect(assessmentService.startAssessment(flowId, context)).rejects.toThrow(
        NotFoundError
      );
      expect(mockedUserAssessmentRepo.findResumable).not.toHaveBeenCalled();
    });
  });
});
