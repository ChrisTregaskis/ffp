import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as answerRepository from '../../src/assessments/answer.repository';
import * as assessmentService from '../../src/assessments/assessment.service';
import * as flowRepository from '../../src/assessments/flow.repository';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import * as jobQueueService from '../../src/jobs/job-queue.service';
import * as contextModule from '../../src/lib/context';
import * as databaseModule from '../../src/lib/database';
import { NotFoundError, ValidationError } from '../../src/lib/errors';
import * as questionRepository from '../../src/questions/question.repository';

import type { UserAssessmentAnswer } from '../../src/assessments/answer.repository';
import type { AssessmentFlow, FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { UserAssessment } from '../../src/assessments/user-assessment.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { QuestionWithConfig } from '../../src/questions/question.repository';

type ContextModule = typeof contextModule;
type DatabaseModule = typeof databaseModule;
type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/assessments/flow.repository');
vi.mock('../../src/assessments/user-assessment.repository');
vi.mock('../../src/assessments/answer.repository');
vi.mock('../../src/questions/question.repository');
vi.mock('../../src/jobs/job-queue.service');
vi.mock('../../src/lib/context', async (importOriginal) => {
  const actual = await importOriginal<ContextModule>();
  return {
    ...actual,
    getUserIdFromContext: vi.fn(),
  };
});
vi.mock('../../src/lib/database', async (importOriginal) => {
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

const createUserContext = (): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'programme_user',
    email: 'test@example.com',
  } as UserActor,
  organisationId: randomUUID(),
  locationId: randomUUID(),
  requestId: randomUUID(),
  timestamp: new Date(),
});

const createMockFlow = (id: string): AssessmentFlow => ({
  id,
  publicId: 'flow00000001',
  name: 'Test Flow',
  description: null,
  scoringConfig: null,
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
        organisationId: context.organisationId,
        userId: databaseUserId,
        flowId,
        currentStep: 1,
        status: 'not_started',
        scores: null,
        programmeId: null,
        visitedStepIds: [],
        warningsShown: [],
        startedAt: null,
        submittedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock flow steps (simple intro step matching createMockFlow)
      const mockFlowSteps: FlowStepWithConfig[] = [
        {
          id: randomUUID(),
          publicId: 'flowstep0001',
          flowId,
          templateId: null,
          order: 1,
          type: 'intro',
          config: { title: 'Intro' },
          nextStepRules: null,
          defaultNextStepId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(createMockFlow(flowId));
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(mockFlowSteps);
      mockedUserAssessmentRepo.findResumableAssessment.mockResolvedValue(null);
      mockedUserAssessmentRepo.createUserAssessment.mockResolvedValue(mockAssessment);

      const result = await assessmentService.startAssessment(flowId, context);

      expect(result.isResumed).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(mockedUserAssessmentRepo.createUserAssessment).toHaveBeenCalled();
    });

    it('returns existing assessment with isResumed=true', async () => {
      const context = createUserContext();
      const flowId = randomUUID();
      const databaseUserId = randomUUID();
      const questionId = randomUUID();
      const existingAssessment: UserAssessment = {
        id: randomUUID(),
        organisationId: context.organisationId,
        userId: databaseUserId,
        flowId,
        currentStep: 3,
        status: 'in_progress',
        scores: null,
        programmeId: null,
        visitedStepIds: [],
        warningsShown: [],
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
          organisationId: context.organisationId,
          userAssessmentId: existingAssessment.id,
          questionId,
          answerValue: 4,
          answeredAt: new Date(),
        },
      ];

      // Mock flow steps
      const mockFlowSteps: FlowStepWithConfig[] = [
        {
          id: randomUUID(),
          publicId: 'flowstep0001',
          flowId,
          templateId: null,
          order: 1,
          type: 'intro',
          config: { title: 'Intro' },
          nextStepRules: null,
          defaultNextStepId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedFlowRepo.findActiveById.mockResolvedValue(createMockFlow(flowId));
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(mockFlowSteps);
      mockedUserAssessmentRepo.findResumableAssessment.mockResolvedValue(existingAssessment);
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(storedAnswers);

      const result = await assessmentService.startAssessment(flowId, context);

      expect(result.isResumed).toBe(true);
      expect(result.currentStep).toBe(3);
      expect(result.steps).toHaveLength(1);
      expect(result.answers[questionId]).toBeDefined();
      expect(result.answers[questionId].answerValue).toBe(4);
      expect(mockedUserAssessmentRepo.createUserAssessment).not.toHaveBeenCalled();
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
      expect(mockedUserAssessmentRepo.findResumableAssessment).not.toHaveBeenCalled();
    });
  });

  describe('submitAssessment', () => {
    const createMockAssessment = (overrides: Partial<UserAssessment> = {}): UserAssessment => ({
      id: randomUUID(),
      organisationId: randomUUID(),
      userId: randomUUID(),
      flowId: randomUUID(),
      currentStep: 3,
      status: 'in_progress',
      scores: null,
      programmeId: null,
      visitedStepIds: [],
      warningsShown: [],
      startedAt: new Date(),
      submittedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    const createMockFlowWithQuestions = (flowId: string, _templateId: string): AssessmentFlow => ({
      id: flowId,
      publicId: 'flow00000001',
      name: 'Test Flow',
      description: null,
      scoringConfig: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    /**
     * Create mock normalised flow steps for findStepsByFlowId mock
     */
    const createMockFlowSteps = (flowId: string, templateId: string): FlowStepWithConfig[] => [
      {
        id: randomUUID(),
        publicId: 'flowstep0001',
        flowId,
        templateId: null,
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
        nextStepRules: null,
        defaultNextStepId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        publicId: 'flowstep0001',
        flowId,
        templateId,
        order: 2,
        type: 'questions',
        config: { title: 'Questions' },
        nextStepRules: null,
        defaultNextStepId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        publicId: 'flowstep0001',
        flowId,
        templateId: null,
        order: 3,
        type: 'results',
        config: { title: 'Results' },
        nextStepRules: null,
        defaultNextStepId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    /**
     * Create mock normalised flow steps with no questions template
     */
    const createMockFlowStepsNoQuestions = (flowId: string): FlowStepWithConfig[] => [
      {
        id: randomUUID(),
        publicId: 'flowstep0001',
        flowId,
        templateId: null,
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
        nextStepRules: null,
        defaultNextStepId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        publicId: 'flowstep0001',
        flowId,
        templateId: null,
        order: 2,
        type: 'results',
        config: { title: 'Results' },
        nextStepRules: null,
        defaultNextStepId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const createMockQuestion = (
      id: string,
      type: QuestionWithConfig['type'],
      required = true
    ): QuestionWithConfig => ({
      id,
      publicId: 'question0001',
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
      mockedDatabaseModule.withRLS.mockImplementation(
        async (_organisationId, _userId, callback) => {
          const mockTx = {} as Parameters<typeof callback>[0];
          return await callback(mockTx);
        }
      );
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
          organisationId: context.organisationId,
          userAssessmentId: assessmentId,
          questionId: questionId1,
          answerValue: 3,
          answeredAt: new Date(),
        },
      ];

      // New answers being submitted
      const newAnswers = {
        [questionId2]: { questionId: questionId2, answerValue: 5 },
      };

      const assessment = createMockAssessment({
        id: assessmentId,
        organisationId: context.organisationId,
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
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(createMockFlowSteps(flowId, templateId));
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedAnswerRepo.findVisitedTemplateIds.mockResolvedValue([templateId]);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);
      mockedAnswerRepo.saveAnswers.mockResolvedValue([]);

      const submittedAssessment: UserAssessment = {
        ...assessment,
        status: 'submitted',
        submittedAt: new Date(),
      };
      mockedUserAssessmentRepo.transitionAssessmentStatus.mockResolvedValue(submittedAssessment);
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
        context.organisationId,
        assessmentId,
        expect.arrayContaining([expect.objectContaining({ questionId: questionId2 })]),
        expect.objectContaining({ tx: expect.anything() as unknown })
      );

      expect(mockedUserAssessmentRepo.transitionAssessmentStatus).toHaveBeenCalledWith(
        context.organisationId,
        assessmentId,
        'submitted',
        expect.objectContaining({ tx: expect.anything() as unknown })
      );

      expect(mockedJobQueueService.queueJob).toHaveBeenCalledWith(
        'score_assessment',
        {
          userAssessmentId: assessmentId,
          flowId,
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
        organisationId: context.organisationId,
        userId: databaseUserId,
        status: 'submitted',
        submittedAt: new Date(),
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);

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
        organisationId: context.organisationId,
        userId: databaseUserId,
        status: 'completed',
        completedAt: new Date(),
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);

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
          organisationId: context.organisationId,
          userAssessmentId: assessmentId,
          questionId: questionId1,
          answerValue: 3,
          answeredAt: new Date(),
        },
      ];

      const assessment = createMockAssessment({
        id: assessmentId,
        organisationId: context.organisationId,
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
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(createMockFlowSteps(flowId, templateId));
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedAnswerRepo.findVisitedTemplateIds.mockResolvedValue([templateId]);
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
      expect(mockedUserAssessmentRepo.transitionAssessmentStatus).not.toHaveBeenCalled();
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
          organisationId: context.organisationId,
          userAssessmentId: assessmentId,
          questionId: questionId1,
          answerValue: 7,
          answeredAt: new Date(),
        },
        {
          id: randomUUID(),
          organisationId: context.organisationId,
          userAssessmentId: assessmentId,
          questionId: questionId2,
          answerValue: 3,
          answeredAt: new Date(),
        },
      ];

      const assessment = createMockAssessment({
        id: assessmentId,
        organisationId: context.organisationId,
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
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(createMockFlowSteps(flowId, templateId));
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedAnswerRepo.findVisitedTemplateIds.mockResolvedValue([templateId]);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);
      mockedAnswerRepo.saveAnswers.mockResolvedValue([]);

      const submittedAssessment: UserAssessment = {
        ...assessment,
        status: 'submitted',
      };
      mockedUserAssessmentRepo.transitionAssessmentStatus.mockResolvedValue(submittedAssessment);
      mockedJobQueueService.queueJob.mockResolvedValue(jobId);

      await assessmentService.submitAssessment(assessmentId, { answers: {} }, context);

      expect(mockedJobQueueService.queueJob).toHaveBeenCalledWith(
        'score_assessment',
        expect.objectContaining({
          userAssessmentId: assessmentId,
          flowId,
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
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(null);

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
        organisationId: context.organisationId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
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
        organisationId: context.organisationId,
        userId: databaseUserId,
        flowId,
        status: 'in_progress',
      });

      const flowWithNoQuestions: AssessmentFlow = {
        id: flowId,
        publicId: 'flow00000001',
        name: 'Test Flow',
        description: null,
        scoringConfig: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedContextModule.getUserIdFromContext.mockResolvedValue(databaseUserId);
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flowWithNoQuestions);
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(createMockFlowStepsNoQuestions(flowId));
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue([]);
      mockedAnswerRepo.findVisitedTemplateIds.mockResolvedValue([]);
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
          organisationId: context.organisationId,
          userAssessmentId: assessmentId,
          questionId: requiredQuestionId,
          answerValue: 5,
          answeredAt: new Date(),
        },
      ];

      const assessment = createMockAssessment({
        id: assessmentId,
        organisationId: context.organisationId,
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
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(flow);
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(createMockFlowSteps(flowId, templateId));
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue(existingDbAnswers);
      mockedAnswerRepo.findVisitedTemplateIds.mockResolvedValue([templateId]);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(questions);
      mockedAnswerRepo.saveAnswers.mockResolvedValue([]);

      const submittedAssessment: UserAssessment = {
        ...assessment,
        status: 'submitted',
      };
      mockedUserAssessmentRepo.transitionAssessmentStatus.mockResolvedValue(submittedAssessment);
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
