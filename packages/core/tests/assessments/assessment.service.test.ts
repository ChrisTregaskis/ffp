import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as answerRepository from '../../src/assessments/answer.repository';
import * as assessmentService from '../../src/assessments/assessment.service';
import * as flowRepository from '../../src/assessments/flow.repository';
import * as safetyTriggerRepository from '../../src/assessments/safety-trigger.repository';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import * as jobQueueService from '../../src/jobs/job-queue.service';
import * as contextModule from '../../src/lib/context';
import * as databaseModule from '../../src/lib/database';
import { NotFoundError, ValidationError } from '../../src/lib/errors';
import * as programmeRepository from '../../src/programmes/programme.repository';
import * as questionRepository from '../../src/questions/question.repository';

import type { UserAssessmentAnswer } from '../../src/assessments/answer.repository';
import type { AssessmentFlow, FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { AssessmentSafetyTrigger } from '../../src/assessments/safety-trigger.repository';
import type { UserAssessment } from '../../src/assessments/user-assessment.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type {
  QuestionWithConfig,
  TemplateQuestionWithConfig,
} from '../../src/questions/question.repository';

type ContextModule = typeof contextModule;
type DatabaseModule = typeof databaseModule;
type FFPDatabaseModule = typeof ffpDatabase;
type AnswerValue = ffpDatabase.AnswerValue;

vi.mock('../../src/assessments/flow.repository');
vi.mock('../../src/assessments/user-assessment.repository');
vi.mock('../../src/assessments/answer.repository');
vi.mock('../../src/assessments/safety-trigger.repository');
vi.mock('../../src/questions/question.repository');
vi.mock('../../src/programmes/programme.repository');
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
const mockedProgrammeRepo = vi.mocked(programmeRepository);
const mockedSafetyTriggerRepo = vi.mocked(safetyTriggerRepository);

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

const inTemplate = (
  questions: QuestionWithConfig[],
  templateId: string
): TemplateQuestionWithConfig[] => questions.map((question) => ({ ...question, templateId }));

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
  safetyAcknowledgedAt: null,
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

describe('Assessment Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedQuestionRepo.findSlugsByIds.mockResolvedValue(new Map());
    mockedSafetyTriggerRepo.findByAssessmentId.mockResolvedValue(null);
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
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(inTemplate(questions, templateId));
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

    it('names each unanswered required question in the details', async () => {
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
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(inTemplate(questions, templateId));

      try {
        await assessmentService.submitAssessment(assessmentId, { answers: {} }, context);
        expect.fail('Expected ValidationError to be thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toBe('Some answers need your attention');
        expect(validationError.details).toEqual([
          {
            path: `answers.${questionId2}`,
            code: 'required',
            message: 'Please answer this question.',
          },
        ]);
      }

      expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
      expect(mockedUserAssessmentRepo.transitionAssessmentStatus).not.toHaveBeenCalled();
      expect(mockedJobQueueService.queueJob).not.toHaveBeenCalled();
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
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue([]);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow(ValidationError);

      await expect(
        assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
      ).rejects.toThrow('Assessment flow has no questions template');
    });
  });

  describe('answer validation and ownership', () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ];

    interface ValidationSetUp {
      context: OrganisationContext;
      userId: string;
      assessmentId: string;
      assessment: UserAssessment;
      capped: QuestionWithConfig;
      optional: QuestionWithConfig;
    }

    const setUp = (): ValidationSetUp => {
      const context = createUserContext();
      const userId = randomUUID();
      const assessmentId = randomUUID();
      const flowId = randomUUID();
      const templateId = randomUUID();
      const capped = {
        ...createMockQuestion(randomUUID(), 'multi-choice', true),
        options,
        validation: { required: true, maxSelections: 2 },
      };
      const optional = createMockQuestion(randomUUID(), 'numeric', false);
      const assessment = createMockAssessment({
        id: assessmentId,
        organisationId: context.organisationId,
        userId,
        flowId,
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(userId);
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(createMockFlow(flowId));
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(createMockFlowSteps(flowId, templateId));
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(
        inTemplate([capped, optional], templateId)
      );
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue([]);
      mockedDatabaseModule.withRLS.mockImplementation(async (_org, _user, callback) => {
        return await callback({} as Parameters<typeof callback>[0]);
      });

      return { context, userId, assessmentId, assessment, capped, optional };
    };

    const answer = (
      questionId: string,
      answerValue: AnswerValue
    ): Record<string, { questionId: string; answerValue: AnswerValue }> => ({
      [questionId]: { questionId, answerValue },
    });

    const storedAnswer = (
      context: OrganisationContext,
      assessmentId: string,
      questionId: string,
      answerValue: AnswerValue
    ): UserAssessmentAnswer => ({
      id: randomUUID(),
      organisationId: context.organisationId,
      userAssessmentId: assessmentId,
      questionId,
      answerValue,
      answeredAt: new Date(),
    });

    const rejectionDetails = async (promise: Promise<unknown>): Promise<unknown> => {
      const error = await promise.then(
        () => expect.fail('Expected a ValidationError'),
        (caught: unknown) => caught
      );

      expect(error).toBeInstanceOf(ValidationError);

      return (error as ValidationError).details;
    };

    describe('saveProgress', () => {
      it('saves answers that keep their rules', async () => {
        const { context, assessmentId, capped } = setUp();

        mockedUserAssessmentRepo.updateAssessmentProgress.mockResolvedValue(createMockAssessment());

        await assessmentService.saveProgress(
          assessmentId,
          { answers: answer(capped.id, ['a', 'b']), currentStep: 99 },
          context
        );

        expect(mockedAnswerRepo.saveAnswers).toHaveBeenCalledWith(
          context.organisationId,
          assessmentId,
          [{ questionId: capped.id, answerValue: ['a', 'b'] }],
          expect.objectContaining({ tx: expect.anything() as unknown })
        );
        // A deactivated question still shown to members keeps its rules
        expect(mockedQuestionRepo.findByTemplateIds.mock.calls[0]?.[2]).toEqual({
          includeInactive: true,
        });
      });

      it.each([
        ['over the cap', ['a', 'b', 'c'], 'too_many_selections'],
        ['an option not offered', ['z'], 'invalid_option'],
      ])('rejects %s', async (_case, value, code) => {
        const { context, assessmentId, capped } = setUp();

        const details = await rejectionDetails(
          assessmentService.saveProgress(
            assessmentId,
            { answers: answer(capped.id, value), currentStep: 2 },
            context
          )
        );

        expect(details).toEqual([expect.objectContaining({ path: `answers.${capped.id}`, code })]);
        expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
        expect(mockedDatabaseModule.withRLS).not.toHaveBeenCalled();
      });

      it.each([
        ['an empty selection', []],
        ['blank text', '  '],
      ])('clears a stored answer on %s, even for a required question', async (_case, value) => {
        const { context, assessmentId, capped } = setUp();

        mockedAnswerRepo.findByAssessmentId.mockResolvedValue([
          storedAnswer(context, assessmentId, capped.id, ['a']),
        ]);
        mockedUserAssessmentRepo.updateAssessmentProgress.mockResolvedValue(createMockAssessment());

        await assessmentService.saveProgress(
          assessmentId,
          { answers: answer(capped.id, value), currentStep: 99 },
          context
        );

        expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
        expect(mockedAnswerRepo.deleteByQuestionIds).toHaveBeenCalledWith(
          context.organisationId,
          assessmentId,
          [capped.id],
          expect.objectContaining({ tx: expect.anything() as unknown })
        );
      });

      it('still rejects a blank answer to a question outside the flow', async () => {
        const { context, assessmentId } = setUp();
        const strangerId = randomUUID();

        const details = await rejectionDetails(
          assessmentService.saveProgress(
            assessmentId,
            { answers: answer(strangerId, []), currentStep: 2 },
            context
          )
        );

        expect(details).toEqual([expect.objectContaining({ code: 'unknown_question' })]);
      });

      it('rejects an answer to a question outside the flow', async () => {
        const { context, assessmentId } = setUp();
        const strangerId = randomUUID();

        const details = await rejectionDetails(
          assessmentService.saveProgress(
            assessmentId,
            { answers: answer(strangerId, 'x'), currentStep: 2 },
            context
          )
        );

        expect(details).toEqual([
          {
            path: `answers.${strangerId}`,
            code: 'unknown_question',
            message: 'This question is not part of your assessment.',
          },
        ]);
        expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
      });

      it('lets an answer echoed back unchanged through, even when it has gone stale', async () => {
        const { context, assessmentId, capped } = setUp();
        const unassignedId = randomUUID();

        // Stored before the cap tightened and before the other question was unassigned
        mockedAnswerRepo.findByAssessmentId.mockResolvedValue([
          storedAnswer(context, assessmentId, capped.id, ['a', 'b', 'c']),
          storedAnswer(context, assessmentId, unassignedId, 'kept'),
        ]);
        mockedUserAssessmentRepo.updateAssessmentProgress.mockResolvedValue(createMockAssessment());

        await assessmentService.saveProgress(
          assessmentId,
          {
            answers: { ...answer(capped.id, ['a', 'b', 'c']), ...answer(unassignedId, 'kept') },
            currentStep: 99,
          },
          context
        );

        expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
      });

      it('checks a stale answer once the member changes it', async () => {
        const { context, assessmentId, capped } = setUp();

        mockedAnswerRepo.findByAssessmentId.mockResolvedValue([
          storedAnswer(context, assessmentId, capped.id, ['a', 'b', 'c']),
        ]);

        const details = await rejectionDetails(
          assessmentService.saveProgress(
            assessmentId,
            { answers: answer(capped.id, ['c', 'b', 'a']), currentStep: 2 },
            context
          )
        );

        expect(details).toEqual([expect.objectContaining({ code: 'too_many_selections' })]);
      });

      it('refuses another member’s assessment as not found', async () => {
        const { context, assessmentId, assessment, capped } = setUp();

        mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue({
          ...assessment,
          userId: randomUUID(),
        });

        await expect(
          assessmentService.saveProgress(
            assessmentId,
            { answers: answer(capped.id, ['a']), currentStep: 2 },
            context
          )
        ).rejects.toThrow(NotFoundError);
        expect(mockedDatabaseModule.withRLS).not.toHaveBeenCalled();
      });
    });

    describe('submitAssessment', () => {
      it('treats a stored empty selection as unanswered', async () => {
        const { context, assessmentId, capped, optional } = setUp();

        mockedAnswerRepo.findByAssessmentId.mockResolvedValue([
          storedAnswer(context, assessmentId, capped.id, []),
          storedAnswer(context, assessmentId, optional.id, 4),
        ]);

        const details = await rejectionDetails(
          assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
        );

        expect(details).toEqual([
          expect.objectContaining({ path: `answers.${capped.id}`, code: 'required' }),
        ]);
        expect(mockedJobQueueService.queueJob).not.toHaveBeenCalled();
      });

      it('ignores a stored answer to an unassigned question that the client echoes back', async () => {
        const { context, assessmentId, capped } = setUp();
        const unassignedId = randomUUID();

        mockedAnswerRepo.findByAssessmentId.mockResolvedValue([
          storedAnswer(context, assessmentId, capped.id, ['a']),
          storedAnswer(context, assessmentId, unassignedId, 'kept'),
        ]);
        mockedJobQueueService.queueJob.mockResolvedValue(randomUUID());

        await assessmentService.submitAssessment(
          assessmentId,
          { answers: { ...answer(capped.id, ['a']), ...answer(unassignedId, 'kept') } },
          context
        );

        expect(mockedJobQueueService.queueJob).toHaveBeenCalled();
        expect(mockedAnswerRepo.saveAnswers).not.toHaveBeenCalled();
      });

      it('rejects a submitted answer over the cap and one outside the flow', async () => {
        const { context, assessmentId, capped } = setUp();
        const strangerId = randomUUID();

        const details = await rejectionDetails(
          assessmentService.submitAssessment(
            assessmentId,
            { answers: { ...answer(capped.id, ['a', 'b', 'c']), ...answer(strangerId, 1) } },
            context
          )
        );

        expect(details).toEqual([
          expect.objectContaining({ path: `answers.${capped.id}`, code: 'too_many_selections' }),
          expect.objectContaining({ path: `answers.${strangerId}`, code: 'unknown_question' }),
        ]);
      });

      it('clears an emptied optional answer and leaves it out of scoring', async () => {
        const { context, assessmentId, capped, optional } = setUp();

        mockedAnswerRepo.findByAssessmentId.mockResolvedValue([
          storedAnswer(context, assessmentId, capped.id, ['a']),
          storedAnswer(context, assessmentId, optional.id, 4),
        ]);
        mockedJobQueueService.queueJob.mockResolvedValue(randomUUID());

        await assessmentService.submitAssessment(
          assessmentId,
          { answers: { ...answer(capped.id, ['a']), ...answer(optional.id, '') } },
          context
        );

        expect(mockedAnswerRepo.deleteByQuestionIds).toHaveBeenCalledWith(
          context.organisationId,
          assessmentId,
          [optional.id],
          expect.objectContaining({ tx: expect.anything() as unknown })
        );
        expect(mockedJobQueueService.queueJob).toHaveBeenCalledWith(
          'score_assessment',
          expect.objectContaining({ responses: [{ questionId: capped.id, answerValue: ['a'] }] }),
          context,
          expect.anything()
        );
      });

      it('refuses another member’s assessment as not found', async () => {
        const { context, assessmentId, assessment } = setUp();

        mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue({
          ...assessment,
          userId: randomUUID(),
        });

        await expect(
          assessmentService.submitAssessment(assessmentId, { answers: {} }, context)
        ).rejects.toThrow(NotFoundError);
        expect(mockedUserAssessmentRepo.transitionAssessmentStatus).not.toHaveBeenCalled();
      });
    });
  });

  describe('getAssessmentResults', () => {
    const userId = randomUUID();
    const programmeId = randomUUID();

    const createScoredAssessment = (recommendedTemplateSlug?: string): UserAssessment => ({
      id: randomUUID(),
      organisationId: randomUUID(),
      userId,
      flowId: randomUUID(),
      currentStep: 4,
      status: 'completed',
      scores: { dimensions: [], recommendedTemplateSlug, scoredAt: new Date() },
      programmeId,
      visitedStepIds: [],
      warningsShown: [],
      startedAt: new Date(),
      submittedAt: new Date(),
      completedAt: new Date(),
      safetyAcknowledgedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    beforeEach(() => {
      mockedContextModule.getUserIdFromContext.mockResolvedValue(userId);
      mockedProgrammeRepo.findProgrammeById.mockResolvedValue({
        name: 'Level 1: Gentle Mobility',
      } as Awaited<ReturnType<typeof programmeRepository.findProgrammeById>>);
    });

    it('names the recommended programme, not the linked one, on a reassessment', async () => {
      const assessment = createScoredAssessment('level-2-active-wellness');
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedProgrammeRepo.findTemplateBySlug.mockResolvedValue({
        name: 'Level 2: Active Wellness',
        isActive: true,
      } as Awaited<ReturnType<typeof programmeRepository.findTemplateBySlug>>);

      const result = await assessmentService.getAssessmentResults(
        assessment.id,
        createUserContext()
      );

      expect(mockedProgrammeRepo.findTemplateBySlug).toHaveBeenCalledWith(
        'level-2-active-wellness'
      );
      expect(result.programmeName).toBe('Level 2: Active Wellness');
      expect(result.programmeId).toBe(programmeId);
      expect(mockedProgrammeRepo.findProgrammeById).not.toHaveBeenCalled();
    });

    it.each([
      ['no longer exists', null],
      ['is inactive', { name: 'Level 2: Active Wellness', isActive: false }],
    ])(
      'falls back to the linked programme when the recommended template %s',
      async (_, template) => {
        const assessment = createScoredAssessment('level-2-active-wellness');
        mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
        mockedProgrammeRepo.findTemplateBySlug.mockResolvedValue(
          template as Awaited<ReturnType<typeof programmeRepository.findTemplateBySlug>>
        );

        const result = await assessmentService.getAssessmentResults(
          assessment.id,
          createUserContext()
        );

        expect(result.programmeName).toBe('Level 1: Gentle Mobility');
      }
    );

    it('falls back to the linked programme when scoring recommended nothing', async () => {
      const assessment = createScoredAssessment();
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);

      const result = await assessmentService.getAssessmentResults(
        assessment.id,
        createUserContext()
      );

      expect(mockedProgrammeRepo.findTemplateBySlug).not.toHaveBeenCalled();
      expect(result.programmeName).toBe('Level 1: Gentle Mobility');
    });
  });

  describe('safety gate', () => {
    const SAFETY_SLUG = 'safety-check';
    const ADVICE = 'Please speak to a health professional before you start.';

    interface SafetySetUp {
      context: OrganisationContext;
      userId: string;
      assessment: UserAssessment;
      questionId: string;
    }

    const setUp = (overrides: Partial<UserAssessment> = {}): SafetySetUp => {
      const context = createUserContext();
      const userId = randomUUID();
      const flowId = randomUUID();
      const templateId = randomUUID();
      const questionId = randomUUID();
      const steps = createMockFlowSteps(flowId, templateId);

      steps[1].nextStepRules = [
        {
          priority: 1,
          conditions: [
            {
              type: 'answer_value',
              questionSlug: SAFETY_SLUG,
              answerValue: ['chest-pain', 'dizziness', 'night-pain'],
            },
          ],
          action: {
            type: 'show_warning',
            warningMessage: ADVICE,
            warningType: 'seek_medical',
            continueAfterWarning: true,
          },
        },
      ];

      const question = {
        ...createMockQuestion(questionId, 'multi-choice', true),
        slug: SAFETY_SLUG,
        options: ['chest-pain', 'dizziness', 'night-pain', 'none'].map((value) => ({
          value,
          label: value,
        })),
      };
      const assessment = createMockAssessment({
        organisationId: context.organisationId,
        userId,
        flowId,
        ...overrides,
      });

      mockedContextModule.getUserIdFromContext.mockResolvedValue(userId);
      mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue(assessment);
      mockedFlowRepo.findById.mockResolvedValue(createMockFlow(flowId));
      mockedFlowRepo.findStepsByFlowId.mockResolvedValue(steps);
      mockedQuestionRepo.findByTemplateIds.mockResolvedValue(inTemplate([question], templateId));
      mockedQuestionRepo.findSlugsByIds.mockResolvedValue(new Map([[questionId, SAFETY_SLUG]]));
      mockedAnswerRepo.findByAssessmentId.mockResolvedValue([]);
      mockedJobQueueService.queueJob.mockResolvedValue(randomUUID());
      mockedDatabaseModule.withRLS.mockImplementation(async (_org, _user, callback) => {
        return await callback({} as Parameters<typeof callback>[0]);
      });

      return { context, userId, assessment, questionId };
    };

    const submit = async (
      { context, assessment, questionId }: SafetySetUp,
      answerValue: AnswerValue
    ): Promise<unknown> =>
      assessmentService.submitAssessment(
        assessment.id,
        { answers: { [questionId]: { questionId, answerValue } } },
        context
      );

    const createTrigger = (assessment: UserAssessment): AssessmentSafetyTrigger => ({
      id: randomUUID(),
      organisationId: assessment.organisationId,
      userAssessmentId: assessment.id,
      userId: assessment.userId,
      questionSlug: SAFETY_SLUG,
      selectedOptions: ['dizziness'],
      warningMessage: ADVICE,
      triggeredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    describe('submitAssessment', () => {
      it('records a red flag once, inside the submit transaction', async () => {
        const setUpResult = setUp();

        await submit(setUpResult, ['dizziness', 'night-pain']);

        expect(mockedSafetyTriggerRepo.recordTrigger).toHaveBeenCalledTimes(1);
        expect(mockedSafetyTriggerRepo.recordTrigger).toHaveBeenCalledWith(
          {
            organisationId: setUpResult.context.organisationId,
            userAssessmentId: setUpResult.assessment.id,
            userId: setUpResult.userId,
            questionSlug: SAFETY_SLUG,
            selectedOptions: ['dizziness', 'night-pain'],
            warningMessage: ADVICE,
          },
          { tx: expect.anything() as unknown }
        );
      });

      it('records nothing when no red flag is chosen', async () => {
        const setUpResult = setUp();

        await submit(setUpResult, ['none']);

        expect(mockedSafetyTriggerRepo.recordTrigger).not.toHaveBeenCalled();
        expect(mockedJobQueueService.queueJob).toHaveBeenCalledTimes(1);
      });

      it('records nothing for a refused submit or a repeat submit', async () => {
        const refused = setUp();

        await expect(submit(refused, ['not-an-option'])).rejects.toThrow(ValidationError);

        const repeated = setUp({ status: 'submitted' });

        await expect(submit(repeated, ['dizziness'])).rejects.toThrow(ValidationError);
        expect(mockedSafetyTriggerRepo.recordTrigger).not.toHaveBeenCalled();
      });
    });

    describe('gate state', () => {
      it('reports the gate on results until the member acknowledges it', async () => {
        const { context, assessment } = setUp({ status: 'completed' });

        mockedSafetyTriggerRepo.findByAssessmentId.mockResolvedValue(createTrigger(assessment));

        const result = await assessmentService.getAssessmentResults(assessment.id, context);

        expect(result.safetyGate).toEqual({ required: true, acknowledgedAt: null, advice: ADVICE });
      });

      it('reports no gate on results when nothing was triggered', async () => {
        const { context, assessment } = setUp({ status: 'completed' });

        const result = await assessmentService.getAssessmentResults(assessment.id, context);

        expect(result.safetyGate).toEqual({ required: false, acknowledgedAt: null, advice: null });
      });

      it('carries the same gate when resuming a submitted assessment', async () => {
        const acknowledgedAt = new Date('2026-10-16T09:00:00.000Z');
        const { context, assessment } = setUp({
          status: 'completed',
          safetyAcknowledgedAt: acknowledgedAt,
        });

        mockedFlowRepo.findActiveById.mockResolvedValue(createMockFlow(assessment.flowId));
        mockedUserAssessmentRepo.findResumableAssessment.mockResolvedValue(null);
        mockedUserAssessmentRepo.findSubmittedAssessment.mockResolvedValue(assessment);
        mockedSafetyTriggerRepo.findByAssessmentId.mockResolvedValue(createTrigger(assessment));

        const result = await assessmentService.startAssessment(assessment.flowId, context);

        expect(result.safetyGate).toEqual({
          required: true,
          acknowledgedAt: acknowledgedAt.toISOString(),
          advice: ADVICE,
        });
      });
    });

    describe('acknowledgeSafetyAdvice', () => {
      it('records the acknowledgement', async () => {
        const { context, assessment } = setUp({ status: 'completed' });
        const acknowledgedAt = new Date();

        mockedSafetyTriggerRepo.findByAssessmentId.mockResolvedValue(createTrigger(assessment));
        mockedUserAssessmentRepo.acknowledgeSafetyAdvice.mockResolvedValue({
          ...assessment,
          safetyAcknowledgedAt: acknowledgedAt,
        });

        const gate = await assessmentService.acknowledgeSafetyAdvice(assessment.id, context);

        expect(gate.acknowledgedAt).toBe(acknowledgedAt.toISOString());
        expect(mockedUserAssessmentRepo.acknowledgeSafetyAdvice).toHaveBeenCalledWith(
          context.organisationId,
          assessment.id,
          assessment.userId
        );
      });

      it('keeps the first acknowledgement on a repeat', async () => {
        const firstAcknowledgedAt = new Date('2026-10-16T09:00:00.000Z');
        const { context, assessment } = setUp({
          status: 'completed',
          safetyAcknowledgedAt: firstAcknowledgedAt,
        });

        mockedSafetyTriggerRepo.findByAssessmentId.mockResolvedValue(createTrigger(assessment));

        const gate = await assessmentService.acknowledgeSafetyAdvice(assessment.id, context);

        expect(gate.acknowledgedAt).toBe(firstAcknowledgedAt.toISOString());
        expect(mockedUserAssessmentRepo.acknowledgeSafetyAdvice).not.toHaveBeenCalled();
      });

      it('refuses an assessment that raised no safety advice', async () => {
        const { context, assessment } = setUp({ status: 'completed' });

        await expect(
          assessmentService.acknowledgeSafetyAdvice(assessment.id, context)
        ).rejects.toThrow(ValidationError);
        expect(mockedUserAssessmentRepo.acknowledgeSafetyAdvice).not.toHaveBeenCalled();
      });

      it('refuses another member’s assessment as not found', async () => {
        const { context, assessment } = setUp({ status: 'completed' });

        mockedUserAssessmentRepo.findUserAssessmentById.mockResolvedValue({
          ...assessment,
          userId: randomUUID(),
        });
        mockedSafetyTriggerRepo.findByAssessmentId.mockResolvedValue(createTrigger(assessment));

        await expect(
          assessmentService.acknowledgeSafetyAdvice(assessment.id, context)
        ).rejects.toThrow(NotFoundError);
        expect(mockedUserAssessmentRepo.acknowledgeSafetyAdvice).not.toHaveBeenCalled();
      });
    });
  });
});
