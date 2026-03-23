import { getDb } from '@ffp/database';
import type { AnswerValue } from '@ffp/database';

import { queueJob } from '../jobs/job-queue.service';
import { getUserIdFromContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import { createSystemLogger } from '../lib/logger';
import { programmeRepository } from '../programmes';
import {
  findByTemplateIds as findQuestionsByTemplateIds,
  findSlugsByIds,
} from '../questions/question.repository';

import * as answerRepository from './answer.repository';
import { evaluateNextStep, createEvaluationContext } from './branching';
import * as flowRepository from './flow.repository';
import * as userAssessmentRepository from './user-assessment.repository';

// System logger for assessment data integrity issues (no organisation context needed)
const systemLogger = createSystemLogger('assessment-service');

import type { UserAssessmentAnswer, SaveAnswerInput } from './answer.repository';
import type { FlowStepWithConfig } from './flow.repository';
import type { OrganisationContext } from '../lib/context';
import type {
  AssessmentResultsResponse,
  FlowStepSummary,
  StartAssessmentResponse,
  SaveProgressRequest,
  SaveProgressResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  UserAssessmentAnswers,
  UserAssessmentStatusResponse,
} from '../schemas/user-assessment.schema';

/**
 * Convert answers from database table format to API response format
 *
 * The user_assessment_answers table stores one row per answer, while the
 * API returns answers as a record keyed by questionId for efficient lookup.
 */
function convertAnswersToResponseFormat(answers: UserAssessmentAnswer[]): UserAssessmentAnswers {
  const result: UserAssessmentAnswers = {};

  for (const answer of answers) {
    // Extract the value from the JSONB structure using the shared helper
    const answerValue = extractAnswerValue(answer.answerValue);

    result[answer.questionId] = {
      questionId: answer.questionId,
      answerValue,
      answeredAt: answer.answeredAt,
    };
  }

  return result;
}

/**
 * Convert answers from API request format to database input format
 *
 * The API accepts answers as a record keyed by questionId, while the
 * repository expects an array of SaveAnswerInput objects.
 */
function convertAnswersToSaveFormat(answers: UserAssessmentAnswers): SaveAnswerInput[] {
  return Object.values(answers).map((answer) => ({
    questionId: answer.questionId,
    answerValue: answer.answerValue,
  }));
}

/**
 * Convert flow steps from database format to API summary format
 *
 * Maps the full FlowStepWithConfig record to the minimal FlowStepSummary
 * needed by the client for navigation.
 */
function convertStepsToSummaryFormat(steps: FlowStepWithConfig[]): FlowStepSummary[] {
  return steps.map((step) => ({
    id: step.id,
    order: step.order,
    type: step.type,
    config: {
      title: step.config.title,
      description: step.config.description,
    },
    templateId: step.templateId,
    hasBranchingRules: step.nextStepRules !== null && step.nextStepRules.length > 0,
    defaultNextStepId: step.defaultNextStepId,
  }));
}

/**
 * Extract the answer value from database JSONB
 *
 * Values are stored directly as string, number, boolean, or string[] (for multi-select).
 * Also handles legacy wrapped formats for backwards compatibility.
 */
function extractAnswerValue(answerValue: unknown): AnswerValue {
  // Handle direct primitive values (current format)
  if (
    typeof answerValue === 'string' ||
    typeof answerValue === 'number' ||
    typeof answerValue === 'boolean'
  ) {
    return answerValue;
  }

  // Handle string arrays (multi-select)
  if (Array.isArray(answerValue)) {
    if (answerValue.every((item) => typeof item === 'string')) {
      return answerValue;
    }

    systemLogger.warn('Array contains non-string values', { answerValue });

    throw new ValidationError('Invalid answer value format: array contains non-string values');
  }

  // Handle legacy wrapped formats: { value: ... }, { selected: ... }, { text: ... }
  if (typeof answerValue === 'object' && answerValue !== null) {
    const obj = answerValue as Record<string, unknown>;

    if ('value' in obj && (typeof obj.value === 'string' || typeof obj.value === 'number')) {
      return obj.value;
    }

    if ('selected' in obj && typeof obj.selected === 'string') {
      return obj.selected;
    }

    if ('text' in obj && typeof obj.text === 'string') {
      return obj.text;
    }

    systemLogger.warn('Unexpected answer value structure', { answerValue, keys: Object.keys(obj) });

    throw new ValidationError('Invalid answer value format: unrecognised object structure');
  }

  systemLogger.warn('Unexpected answer value type', { answerValue, type: typeof answerValue });

  throw new ValidationError(
    'Invalid answer value format: expected string, number, boolean, or string[]'
  );
}

/**
 * Start a new assessment or resume an existing one
 * @returns StartAssessmentResponse with the assessment data and isResumed flag
 *
 * @throws NotFoundError if flow doesn't exist or is inactive
 * @throws UnauthorisedError if context doesn't have a user actor or user not in database
 *
 * @example
 * ```typescript
 * const response = await startAssessment(flowId, context);
 * if (response.isResumed) {
 *   // User is continuing an existing assessment
 * } else {
 *   // User started a fresh assessment
 * }
 * ```
 */
export async function startAssessment(
  flowId: string,
  context: OrganisationContext,
  options: { isReassessment?: boolean } = {}
): Promise<StartAssessmentResponse> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  // Validate flow exists and is active
  const flow = await flowRepository.findActiveById(flowId);

  if (!flow) {
    // Treat inactive flows the same as non-existent for security
    throw new NotFoundError('Assessment flow', flowId);
  }

  // Fetch flow steps from normalised table
  const db = getDb();
  const flowSteps = await flowRepository.findStepsByFlowId(db, flowId);
  const steps = convertStepsToSummaryFormat(flowSteps);

  if (options.isReassessment) {
    // Reassessment: abandon any in-progress assessments for this flow, then create fresh
    await userAssessmentRepository.abandonInProgressAssessments(organisationId, userId, flowId);
  } else {
    // Normal path: try to resume an existing assessment

    // Check for existing resumable assessment
    const existingAssessment = await userAssessmentRepository.findResumableAssessment(
      organisationId,
      userId,
      flowId
    );

    if (existingAssessment) {
      // Load answers from user_assessment_answers table
      const storedAnswers = await answerRepository.findByAssessmentId(
        organisationId,
        existingAssessment.id,
        { userId }
      );

      const answers = convertAnswersToResponseFormat(storedAnswers);

      // Return existing assessment with isResumed=true
      return {
        assessmentId: existingAssessment.id,
        currentStep: existingAssessment.currentStep,
        status: existingAssessment.status,
        answers,
        flowId: existingAssessment.flowId,
        isResumed: true,
        steps,
      };
    }

    // Check for already-submitted assessment (handles hard reload after submission)
    const submittedAssessment = await userAssessmentRepository.findSubmittedAssessment(
      organisationId,
      userId,
      flowId
    );

    if (submittedAssessment) {
      // Find the results step order so the frontend navigates directly to results
      const resultsStep = steps.find((s) => s.type === 'results');
      const resultsStepOrder = resultsStep?.order ?? steps.length;

      const storedAnswers = await answerRepository.findByAssessmentId(
        organisationId,
        submittedAssessment.id,
        { userId }
      );

      const answers = convertAnswersToResponseFormat(storedAnswers);

      return {
        assessmentId: submittedAssessment.id,
        currentStep: resultsStepOrder,
        currentStepId: resultsStep?.id,
        status: submittedAssessment.status,
        answers,
        flowId: submittedAssessment.flowId,
        isResumed: true,
        steps,
      };
    }
  }

  // Create new assessment
  const newAssessment = await userAssessmentRepository.createUserAssessment({
    organisationId,
    userId,
    flowId,
  });

  return {
    assessmentId: newAssessment.id,
    currentStep: newAssessment.currentStep,
    status: newAssessment.status,
    answers: {}, // New assessment has no answers yet
    flowId: newAssessment.flowId,
    isResumed: false,
    steps,
  };
}

/**
 * Save assessment progress
 *
 * Persists user's answers and current step when navigating (Continue/Back).
 * Handles status transition from 'not_started' to 'in_progress' on first save.
 * Evaluates branching rules to determine the next step and any warnings.
 *
 * @throws NotFoundError if assessment doesn't exist or not accessible
 * @throws ValidationError if assessment is submitted/completed
 *
 * @example
 * ```typescript
 * const response = await saveProgress(assessmentId, {
 *   answers: { 'q1-uuid': { questionId: 'q1-uuid', answerValue: 5 } },
 *   currentStep: 2
 * }, context);
 * // response.nextStepId - UUID of next step (from branching evaluation)
 * // response.warnings - Any warnings triggered by branching rules
 * ```
 */
export async function saveProgress(
  assessmentId: string,
  data: SaveProgressRequest,
  context: OrganisationContext
): Promise<SaveProgressResponse> {
  const { organisationId } = context;
  const userId = await getUserIdFromContext(context);
  const db = getDb();

  // Fetch assessment by ID (RLS enforced)
  const assessment = await userAssessmentRepository.findUserAssessmentById(
    organisationId,
    assessmentId
  );

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Validate assessment is not submitted/completed
  if (assessment.status === 'submitted' || assessment.status === 'completed') {
    throw new ValidationError('Cannot modify submitted assessment');
  }

  // Execute all writes in a single transaction for atomicity
  return await withRLS(organisationId, userId, async (tx) => {
    // If status is 'not_started', transition to 'in_progress'
    if (assessment.status === 'not_started') {
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationId,
        assessmentId,
        'in_progress',
        {
          tx,
        }
      );
    }

    // Save answers to user_assessment_answers table
    const answersToSave = convertAnswersToSaveFormat(data.answers);

    if (answersToSave.length > 0) {
      await answerRepository.saveAnswers(organisationId, assessmentId, answersToSave, { tx });
    }

    // Update currentStep
    const updatedAssessment = await userAssessmentRepository.updateAssessmentProgress(
      organisationId,
      assessmentId,
      { currentStep: data.currentStep },
      { tx }
    );

    // Fetch flow steps for branching evaluation
    const flowSteps = await flowRepository.findStepsByFlowId(db, assessment.flowId);

    // Find the current step record by order
    const currentStepRecord = flowSteps.find((s) => s.order === data.currentStep);

    if (!currentStepRecord) {
      // Step not found - return success without branching evaluation
      // This can happen if order doesn't match any step (edge case)
      systemLogger.warn('Current step not found in flow steps', {
        assessmentId,
        currentStep: data.currentStep,
        flowId: assessment.flowId,
      });

      return {
        success: true as const,
        updatedAt: updatedAssessment.updatedAt.toISOString(),
        nextStepId: null,
        warnings: [],
        shouldTerminate: false,
        terminationReason: null,
      };
    }

    // Fetch all answers for the assessment (including ones just saved)
    // Pass tx to read within the same transaction (sees uncommitted writes)
    const allAnswers = await answerRepository.findByAssessmentId(organisationId, assessmentId, {
      userId,
      tx,
    });

    // Build question ID to slug map for branching conditions
    const questionIds = allAnswers.map((a) => a.questionId);
    const idToSlugMap = await findSlugsByIds(db, questionIds);

    // Convert answers to slug-keyed format for branching evaluation
    const answersForBranching = allAnswers.map((answer) => {
      const slug = idToSlugMap.get(answer.questionId);

      if (!slug) {
        // Log but don't fail - not essential
        systemLogger.warn('Question slug not found for answer', {
          questionId: answer.questionId,
          assessmentId,
        });
      }

      return {
        questionSlug: slug ?? answer.questionId, // Fallback to ID if slug not found
        value: extractAnswerValue(answer.answerValue),
      };
    });

    // Create evaluation context and evaluate branching rules
    const evalContext = createEvaluationContext(
      currentStepRecord.id,
      flowSteps,
      answersForBranching
    );

    const branchResult = evaluateNextStep(currentStepRecord, evalContext);

    // Persist warnings if any were triggered
    if (branchResult.warnings.length > 0) {
      await userAssessmentRepository.appendAssessmentWarnings(
        organisationId,
        assessmentId,
        branchResult.warnings,
        {
          tx,
        }
      );
    }

    // Return success response with branching evaluation results
    return {
      success: true as const,
      updatedAt: updatedAssessment.updatedAt.toISOString(),
      nextStepId: branchResult.nextStepId,
      warnings: branchResult.warnings,
      shouldTerminate: branchResult.shouldTerminate,
      terminationReason: branchResult.terminationReason ?? null,
    };
  });
}

/**
 * Get required question IDs from the given templates
 * returns IDs where validation.required is true (or undefined,
 * as required defaults to true).
 * @returns Array of required question IDs
 */
async function getRequiredQuestionIds(templateIds: string[]): Promise<string[]> {
  if (templateIds.length === 0) {
    return [];
  }

  const db = getDb();

  // Fetch all questions via the template_questions join table
  const questions = await findQuestionsByTemplateIds(db, templateIds);

  // Extract required question IDs (validation.required defaults to true)
  return questions.filter((q) => q.validation?.required !== false).map((q) => q.id);
}

/**
 * Validate that all required questions have been answered
 *
 * @returns Array of missing question IDs (empty if all required questions answered)
 */
function findMissingRequiredQuestions(
  requiredQuestionIds: string[],
  answeredQuestionIds: string[]
): string[] {
  return requiredQuestionIds.filter((questionId) => !answeredQuestionIds.includes(questionId));
}

/**
 * Submit an assessment for scoring
 *
 * Validates the assessment can be submitted, saves final answers,
 * transitions status to 'submitted', and enqueues a scoring job.
 *
 * @throws NotFoundError if assessment doesn't exist or not accessible
 * @throws ValidationError if assessment is already submitted
 * @throws ValidationError if required questions are missing answers
 *
 * @example
 * ```typescript
 * const response = await submitAssessment(assessmentId, {
 *   answers: { 'q1-uuid': { questionId: 'q1-uuid', answerValue: 5 } }
 * }, context);
 * ```
 */
export async function submitAssessment(
  assessmentId: string,
  data: SubmitAssessmentRequest,
  context: OrganisationContext
): Promise<SubmitAssessmentResponse> {
  const { organisationId } = context;
  const userId = await getUserIdFromContext(context);

  // Fetch assessment (RLS enforced)
  const assessment = await userAssessmentRepository.findUserAssessmentById(
    organisationId,
    assessmentId
  );

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Validate not already submitted
  if (assessment.status === 'submitted' || assessment.status === 'completed') {
    throw new ValidationError('Assessment already submitted');
  }

  // Fetch the assessment flow to get required questions
  const flow = await flowRepository.findById(assessment.flowId);

  if (!flow) {
    throw new NotFoundError('Assessment flow', assessment.flowId);
  }

  // Validate flow has questions templates
  const db = getDb();
  const flowSteps = await flowRepository.findStepsByFlowId(db, flow.id);
  const questionSteps = flowSteps.filter((step) => step.type === 'questions');

  if (questionSteps.length === 0) {
    throw new ValidationError('Assessment flow has no questions template');
  }

  // Load existing answers from user_assessment_answers table
  const existingAnswers = await answerRepository.findByAssessmentId(organisationId, assessmentId, {
    userId,
  });

  // Convert request answers to save format
  const newAnswersToSave = convertAnswersToSaveFormat(data.answers);

  // Build array of all answered question IDs (existing + new)
  const answeredQuestionIds: string[] = [];

  for (const answer of existingAnswers) {
    answeredQuestionIds.push(answer.questionId);
  }

  for (const answer of newAnswersToSave) {
    answeredQuestionIds.push(answer.questionId);
  }

  // Get template IDs from visited steps (derived from saved answers)
  // This ensures we only validate required questions from steps the user actually visited,
  // supporting branching flows where some steps are skipped
  const visitedTemplateIds = await answerRepository.findVisitedTemplateIds(
    organisationId,
    assessmentId,
    userId
  );

  // Validate required questions are answered (only from visited templates)
  const requiredQuestionIds = await getRequiredQuestionIds(visitedTemplateIds);
  const missingQuestionIds = findMissingRequiredQuestions(requiredQuestionIds, answeredQuestionIds);

  if (missingQuestionIds.length > 0) {
    throw new ValidationError('Required questions are missing answers', {
      missingQuestionIds,
    });
  }

  // Build responses array for scoring job from all answers
  // Combine existing answers with new answers (new answers override existing)
  // Extract the actual value from JSONB structure for the job payload
  const allAnswersMap = new Map<string, { questionId: string; answerValue: AnswerValue }>();

  for (const answer of existingAnswers) {
    const extractedValue = extractAnswerValue(answer.answerValue);

    allAnswersMap.set(answer.questionId, {
      questionId: answer.questionId,
      answerValue: extractedValue,
    });
  }

  for (const answer of newAnswersToSave) {
    const extractedValue = extractAnswerValue(answer.answerValue);
    allAnswersMap.set(answer.questionId, {
      questionId: answer.questionId,
      answerValue: extractedValue,
    });
  }

  const responses = Array.from(allAnswersMap.values());

  // Execute all writes in a single transaction for atomicity
  // If any step fails, all changes are rolled back
  return await withRLS(organisationId, userId, async (tx) => {
    // Save new answers to user_assessment_answers table
    if (newAnswersToSave.length > 0) {
      await answerRepository.saveAnswers(organisationId, assessmentId, newAnswersToSave, { tx });
    }

    // Transition status to 'submitted'
    await userAssessmentRepository.transitionAssessmentStatus(
      organisationId,
      assessmentId,
      'submitted',
      {
        tx,
      }
    );

    // Enqueue score_assessment job
    // Uses flowId for scoring config (flow owns combined dimensions from all templates)
    const jobId = await queueJob(
      'score_assessment',
      {
        userAssessmentId: assessmentId,
        flowId: assessment.flowId,
        userId,
        responses,
      },
      context,
      { priority: 2, tx } // High priority for user-triggered submission
    );

    // Return response with jobId for polling
    return {
      jobId,
      message: 'Assessment submitted successfully. Scoring in progress.',
    };
  });
}

/**
 * Get assessment results (scores and programme)
 *
 * Returns the current status, scores, and programme ID for a submitted assessment.
 */
export async function getAssessmentResults(
  assessmentId: string,
  context: OrganisationContext
): Promise<AssessmentResultsResponse> {
  const { organisationId } = context;
  const userId = await getUserIdFromContext(context);

  // Fetch assessment by ID (RLS enforced for organisation, userId for fine-grained RLS)
  const assessment = await userAssessmentRepository.findUserAssessmentById(
    organisationId,
    assessmentId,
    userId
  );

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Validate user ownership (RLS enforces organisation, not user isolation)
  if (assessment.userId !== userId) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Validate assessment has been submitted
  if (assessment.status === 'not_started' || assessment.status === 'in_progress') {
    throw new ValidationError('Assessment not yet submitted');
  }

  // Fetch programme name if a programme has been assigned
  let programmeName: string | null = null;

  if (assessment.programmeId) {
    const programme = await programmeRepository.findProgrammeById(
      organisationId,
      assessment.programmeId,
      {
        userId,
      }
    );

    programmeName = programme?.name ?? null;
  }

  // Return the assessment results
  return {
    status: assessment.status,
    scores: assessment.scores,
    programmeId: assessment.programmeId,
    programmeName,
  };
}

/**
 * Checks whether the user has an active programme. If not, returns the
 * default assessment flow ID so the frontend can redirect to the assessment.
 */
export async function getUserAssessmentStatus(
  context: OrganisationContext
): Promise<UserAssessmentStatusResponse> {
  const userId = await getUserIdFromContext(context);

  // Check if user has an active programme
  const programme = await programmeRepository.findProgrammeByUserId(context.organisationId, userId);

  // Always look up the default flow — needed for reassessments too.
  // findDefaultForOrganisation throws if no flow is configured, which is expected for
  // tenants that haven't set one up yet — return null gracefully.
  let flowId: string | null = null;

  try {
    const flow = await flowRepository.findDefaultForOrganisation(context.organisationId);

    flowId = flow?.id ?? null;
  } catch (error) {
    if (error instanceof InternalServerError) {
      // No default flow configured for this organisation — not an error for this endpoint
    } else {
      throw error;
    }
  }

  return {
    hasProgramme: !!programme,
    assessmentFlowId: flowId,
  };
}
