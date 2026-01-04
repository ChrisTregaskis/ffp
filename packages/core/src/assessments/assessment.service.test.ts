import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as jobQueueService from '../jobs/job-queue.service';
import * as contextModule from '../lib/context';
import * as databaseModule from '../lib/database';
import { NotFoundError, ValidationError } from '../lib/errors';
import * as questionRepository from '../questions/question.repository';

import * as answerRepository from './answer.repository';
import * as assessmentService from './assessment.service';
import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

import type { UserAssessmentAnswer } from './answer.repository';
import type { AssessmentFlow } from './flow.repository';
import type { TenantContext, UserActor } from '../lib/context';
import type { QuestionWithConfig } from '../questions/question.repository';
import type { UserAssessment } from '../schemas/user-assessment.schema';

type ContextModule = typeof contextModule;
type DatabaseModule = typeof databaseModule;
type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('./flow.repository');
vi.mock('./user-assessment.repository');
vi.mock('./answer.repository');
vi.mock('../questions/question.repository');
vi.mock('../jobs/job-queue.service');
vi.mock('../lib/context', async (importOriginal) => {
  const actual = await importOriginal<ContextModule>();
  return {
    ...actual,
    getUserIdFromContext: vi.fn(),
  };
});
vi.mock('../lib/database', async (importOriginal) => {
  const actual = await importOriginal<DatabaseModule>();
  return {
    ...actual,
    withRLS: vi.fn(),
  };
});
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();
  return {
    ...actual,
    getDb: vi.fn(),
  };
});

const mockedFlowRepo = vi.mocked(flowRepository);
const mockedUserAssessmentRepo = vi.mocked(userAssessmentRepository);
const mockedContextModule = vi.mocked(contextModule);
const mockedDatabaseModule = vi.mocked(databaseModule);
const mockedJobQueueService = vi.mocked(jobQueueService);
const mockedAnswerRepo = vi.mocked(answerRepository);
const mockedQuestionRepo = vi.mocked(questionRepository);

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
      const databaseUserId = randomUUID();
      const mockAssessment: UserAssessment = {
        id: randomUUID(),
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        currentStep: 1,
        status: 'not_started',
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
      const databaseUserId = randomUUID();
      const questionId = randomUUID();
      const existingAssessment: UserAssessment = {
        id: randomUUID(),
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        currentStep: 3,
        status: 'in_progress',
        answers: {}, // Now stored in user_assessment_answers table
        scores: null,
        programmeId: null,
        startedAt: new Date(),
        submittedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock answers from the new table
      const storedAnswers: UserAssessmentAnswer[] = [
        {
          id: randomUUID(),
          tenantId: context.tenantId,
          userAssessmentId: existingAssessment.id,
          questionId,
          answerValue: { value: 4 },
          answeredAt: new Date(),
        },
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(createMockFlow(flowId));
      mockedUserAssessmentRepo.findResumable.mockResolvedValue(existingAssessment);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(storedAnswers);

      const result = await assessmentService.startAssessment(flowId, context);

      expect(result.isResumed).toBe(true);
      expect(result.currentStep).toBe(3);
      expect(result.answers[questionId]).toBeDefined();
      expect(result.answers[questionId].answerValue).toBe(4);
      expect(mockedUserAssessmentRepo.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for invalid flow', async () => {
      const context = createUserContext();
      const flowId = randomUUID();
      const databaseUserId = randomUUID();

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(null);

      await expect(assessmentService.startAssessment(flowId, context)).rejects.toThrow(
        NotFoundError
      );
      expect(mockedUserAssessmentRepo.findResumable).not.toHaveBeenCalled();
    });
  });

  describe('submitAssessment', () => {
    const createMockAssessment = (overrides: Partial<UserAssessment> = {}): UserAssessment => ({
      id: randomUUID(),
      tenantId: randomUUID(),
      userId: randomUUID(),
      flowId: randomUUID(),
      currentStep: 3,
      status: 'in_progress',
      answers: {},
      scores: null,
      programmeId: null,
      startedAt: new Date(),
      submittedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    const createMockFlowWithQuestions = (flowId: string, templateId: string): AssessmentFlow => ({
      id: flowId,
      name: 'Test Flow',
      description: null,
      steps: [
        { order: 1, type: 'intro', config: { title: 'Welcome' } },
        { order: 2, type: 'questions', templateId, config: { title: 'Questions' } },
        { order: 3, type: 'results', config: { title: 'Results' } },
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createMockQuestion = (
      id: string,
      type: QuestionWithConfig['type'],
      required = true
    ): QuestionWithConfig => ({
      id,
      slug: `question-${id.slice(0, 8)}`,
      type,
      questionText: `Question ${id.slice(0, 8)}`,
      options: null,
      validation: { required },
      displayOrder: 1,
      description: null,
      videoId: null,
      scoreDimension: null,
      isActive: true,
      configOverrides: null,
    });

    beforeEach(() => {
      mockedDatabaseModule.withRLS.mockImplementation(async (_tenantId, _userId, callback) => {
        const mockTx = {} as Parameters<typeof callback>[0];
        return await callback(mockTx);
      });
    });

    it('successfully submits assessment with merged answers and enqueues scoring job', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();
      const templateId = randomUUID();
      const questionId1 = randomUUID();
      const questionId2 = randomUUID();
      const jobId = randomUUID();

      // Existing answers in the database
      const existingDbAnswers: UserAssessmentAnswer[] = [
        {
          id: randomUUID(),
          tenantId: context.tenantId,
          userAssessmentId: assessmentId,
          questionId: questionId1,
          answerValue: { value: 3 },
          answeredAt: new Date(),
        },
      ];

      // New answers being submitted
      const newAnswers = {
        [questionId2]: { questionId: questionId2, answerValue: 5 },
      };

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      const flow = createMockFlowWithQuestions(flowId, templateId);

      // Questions from the questions table
      const questions: QuestionWithConfig[] = [
        createMockQuestion(questionId1, 'scale', true),
        createMockQuestion(questionId2, 'scale', true),
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);
      mockedAnswerRepo.saveAnswers.mockResolvedValue([]);

      const submittedAssessment: UserAssessment = {
        ...assessment,
        status: 'submitted',
        submittedAt: new Date(),
      };
      mockedUserAssessmentRepo.transitionStatus.mockResolvedValue(submittedAssessment);
      mockedJobQueueService.queueJob.mockResolvedValue(jobId);

      const result = await assessmentService.submitAssessment(
        assessmentId,
        { answers: newAnswers },
        context
      );

      expect(result.jobId).toBe(jobId);
      expect(result.message).toBe('Assessment submitted successfully. Scoring in progress.');

      // Verify answers saved via answerRepository
      expect(mockedAnswerRepo.saveAnswers).toHaveBeenCalledWith(
        context.tenantId,
        assessmentId,
        expect.arrayContaining([expect.objectContaining({ questionId: questionId2 })]),
        expect.objectContaining({ tx: expect.anything() as unknown })
      );

      expect(mockedUserAssessmentRepo.transitionStatus).toHaveBeenCalledWith(
        context.tenantId,
        assessmentId,
        'submitted',
        expect.objectContaining({ tx: expect.anything() as unknown })
      );

      expect(mockedJobQueueService.queueJob).toHaveBeenCalledWith(
        'score_assessment',
        {
          assessmentSubmissionId: assessmentId,
          templateId,
          userId: databaseUserId,
          responses: expect.arrayContaining([
            expect.objectContaining({ questionId: questionId1, answerValue: 3 }),
            expect.objectContaining({ questionId: questionId2, answerValue: 5 }),
          ]) as unknown[],
        },
        context,
        expect.objectContaining({ priority: 2, tx: expect.anything() as unknown })
      );
    });

    it('throws ValidationError when assessment is already submitted', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        status: 'submitted',
        submittedAt: new Date(),
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow(ValidationError);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow('Assessment already submitted');

      expect(mockedFlowRepo.findById).not.toHaveBeenCalled();
      expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
      expect(mockedJobQueueService.queueJob).not.toHaveBeenCalled();
    });

    it('throws ValidationError when assessment is completed', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        status: 'completed',
        completedAt: new Date(),
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow(ValidationError);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow('Assessment already submitted');
    });

    it('throws ValidationError with missingQuestionIds when required questions are unanswered', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();
      const templateId = randomUUID();
      const questionId1 = randomUUID();
      const questionId2 = randomUUID();
      const questionId3 = randomUUID();

      // Only question 1 is answered
      const existingDbAnswers: UserAssessmentAnswer[] = [
        {
          id: randomUUID(),
          tenantId: context.tenantId,
          userAssessmentId: assessmentId,
          questionId: questionId1,
          answerValue: { value: 3 },
          answeredAt: new Date(),
        },
      ];

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      const flow = createMockFlowWithQuestions(flowId, templateId);

      // Questions from the questions table - q1 and q2 required, q3 optional
      const questions: QuestionWithConfig[] = [
        createMockQuestion(questionId1, 'scale', true),
        createMockQuestion(questionId2, 'scale', true),
        createMockQuestion(questionId3, 'scale', false),
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);

      try {
        await assessmentService.submitAssessment(assessmentId, { answers: {} }, context);
        expect.fail('Expected ValidationError to be thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toBe('Required questions are missing answers');
        expect(validationError.details).toEqual({
          missingQuestionIds: expect.arrayContaining([questionId2]) as string[],
        });
      }

      expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
      expect(mockedUserAssessmentRepo.transitionStatus).not.toHaveBeenCalled();
      expect(mockedJobQueueService.queueJob).not.toHaveBeenCalled();
    });

    it('correctly builds job payload with responses from all answers', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();
      const templateId = randomUUID();
      const questionId1 = randomUUID();
      const questionId2 = randomUUID();
      const jobId = randomUUID();

      // All answers already in database
      const existingDbAnswers: UserAssessmentAnswer[] = [
        {
          id: randomUUID(),
          tenantId: context.tenantId,
          userAssessmentId: assessmentId,
          questionId: questionId1,
          answerValue: { value: 7 },
          answeredAt: new Date(),
        },
        {
          id: randomUUID(),
          tenantId: context.tenantId,
          userAssessmentId: assessmentId,
          questionId: questionId2,
          answerValue: { value: 3 },
          answeredAt: new Date(),
        },
      ];

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      const flow = createMockFlowWithQuestions(flowId, templateId);

      const questions: QuestionWithConfig[] = [
        createMockQuestion(questionId1, 'scale', true),
        createMockQuestion(questionId2, 'single-choice', true),
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);
      mockedAnswerRepo.saveAnswers.mockResolvedValue([]);

      const submittedAssessment: UserAssessment = {
        ...assessment,
        status: 'submitted',
      };
      mockedUserAssessmentRepo.transitionStatus.mockResolvedValue(submittedAssessment);
      mockedJobQueueService.queueJob.mockResolvedValue(jobId);

      await assessmentService.submitAssessment(assessmentId, { answers: {} }, context);

      expect(mockedJobQueueService.queueJob).toHaveBeenCalledWith(
        'score_assessment',
        expect.objectContaining({
          assessmentSubmissionId: assessmentId,
          templateId,
          userId: databaseUserId,
          responses: expect.arrayContaining([
            { questionId: questionId1, answerValue: 7 },
            { questionId: questionId2, answerValue: 3 },
          ]) as unknown[],
        }),
        context,
        expect.objectContaining({ priority: 2 })
      );
    });

    it('throws NotFoundError when assessment does not exist', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(null);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow(NotFoundError);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow('Assessment');
    });

    it('throws NotFoundError when flow does not exist', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(null);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow(NotFoundError);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow('Assessment flow');
    });

    it('throws ValidationError when flow has no questions template', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      const flowWithNoQuestions: AssessmentFlow = {
        id: flowId,
        name: 'Test Flow',
        description: null,
        steps: [
          { order: 1, type: 'intro', config: { title: 'Welcome' } },
          { order: 2, type: 'results', config: { title: 'Results' } },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flowWithNoQuestions);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue([]);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue([]);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow(ValidationError);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow('Assessment flow has no questions template');
    });

    it('handles optional questions correctly (does not require them)', async () => {
      const context = createUserContext();
      const databaseUserId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();
      const templateId = randomUUID();
      const requiredQuestionId = randomUUID();
      const optionalQuestionId = randomUUID();
      const jobId = randomUUID();

      // Only required question answered
      const existingDbAnswers: UserAssessmentAnswer[] = [
        {
          id: randomUUID(),
          tenantId: context.tenantId,
          userAssessmentId: assessmentId,
          questionId: requiredQuestionId,
          answerValue: { value: 5 },
          answeredAt: new Date(),
        },
      ];

      const assessment = createMockAssessment({
        id: assessmentId,
        tenantId: context.tenantId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      const flow = createMockFlowWithQuestions(flowId, templateId);

      const questions: QuestionWithConfig[] = [
        createMockQuestion(requiredQuestionId, 'scale', true),
        createMockQuestion(optionalQuestionId, 'text', false),
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);
      mockedAnswerRepo.saveAnswers.mockResolvedValue([]);

      const submittedAssessment: UserAssessment = {
        ...assessment,
        status: 'submitted',
      };
      mockedUserAssessmentRepo.transitionStatus.mockResolvedValue(submittedAssessment);
      mockedJobQueueService.queueJob.mockResolvedValue(jobId);

      const result = await assessmentService.submitAssessment(
        assessmentId,
        { answers: {} },
        context
      );

      expect(result.jobId).toBe(jobId);
      expect(mockedJobQueueService.queueJob).toHaveBeenCalled();
    });
  });
});
