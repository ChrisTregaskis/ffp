import { getDb, type AnswerValue, type DbClient } from '@ffp/database';

import { hasProgrammeGenerationFailed, queueJob } from '../jobs/job-queue.service';
import { getUserIdFromContext } from '../lib/context';
import { withRLS, type Transaction } from '../lib/database';
import { InternalServerError, NotFoundError, ValidationError } from '../lib/errors';
import { createSystemLogger } from '../lib/logger';
import { programmeRepository } from '../programmes';
import { findSlugsByIds } from '../questions/question.repository';
import { isAnswerProvided } from '../schemas/question-answer.schema';

import {
  assertNoAnswerErrors,
  findChangedAnswers,
  findSaveErrors,
  findSubmitErrors,
  loadFlowQuestions,
} from './answer-validation';
import * as answerRepository from './answer.repository';
import { evaluateNextStep, createEvaluationContext, type BranchingAnswers } from './branching';
import * as flowRepository from './flow.repository';
import { toResumableStep } from './resume-step';
import { findSafetyTrigger, toSafetyGate } from './safety-gate';
import * as safetyTriggerRepository from './safety-trigger.repository';
import * as userAssessmentRepository from './user-assessment.repository';

// System logger for assessment data integrity issues (no organisation context needed)
const systemLogger = createSystemLogger('assessment-service');

import type { UserAssessmentAnswer, SaveAnswerInput } from './answer.repository';
import type { FlowStepWithConfig } from './flow.repository';
import type { UserAssessment } from './user-assessment.repository';
import type { OrganisationContext } from '../lib/context';
import type {
  AssessmentResultsResponse,
  ProgrammeReadiness,
  FlowStepSummary,
  SafetyGate,
  StartAssessmentResponse,
  SaveProgressRequest,
  SaveProgressResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
  UserAssessmentAnswers,
  UserAssessmentStatusResponse,
} from '../schemas/user-assessment/user-assessment.schema';

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

function toAnswerValuesById(answers: SaveAnswerInput[]): Map<string, AnswerValue> {
  return new Map(answers.map((answer) => [answer.questionId, answer.answerValue]));
}

/** Store a request's changed answers; a blank one deletes the stored answer instead. */
async function writeAnswerChanges(
  tx: Transaction,
  organisationId: string,
  assessmentId: string,
  changedAnswers: ReadonlyMap<string, AnswerValue>
): Promise<void> {
  const changes = [...changedAnswers];
  const given = changes
    .filter(([, answerValue]) => isAnswerProvided(answerValue))
    .map(([questionId, answerValue]) => ({ questionId, answerValue }));
  const clearedIds = changes
    .filter(([, answerValue]) => !isAnswerProvided(answerValue))
    .map(([questionId]) => questionId);

  if (given.length > 0) {
    await answerRepository.saveAnswers(organisationId, assessmentId, given, { tx });
  }

  await answerRepository.deleteByQuestionIds(organisationId, assessmentId, clearedIds, { tx });
}

function toStoredValuesById(answers: UserAssessmentAnswer[]): Map<string, AnswerValue> {
  return new Map(
    answers.map((answer) => [answer.questionId, extractAnswerValue(answer.answerValue)])
  );
}

/**
 * Load the caller's own assessment. RLS isolates organisations, not members, so
 * another member's assessment in the same organisation is refused here, as not
 * found so its existence is not disclosed.
 */
async function findOwnAssessment(
  organisationId: string,
  assessmentId: string,
  userId: string
): Promise<UserAssessment> {
  const assessment = await userAssessmentRepository.findUserAssessmentById(
    organisationId,
    assessmentId,
    {
      userId,
    }
  );

  if (!assessment || assessment.userId !== userId) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  return assessment;
}

async function toBranchingAnswers(
  db: DbClient,
  assessmentId: string,
  answers: SaveAnswerInput[]
): Promise<BranchingAnswers> {
  const idToSlugMap = await findSlugsByIds(
    db,
    answers.map((answer) => answer.questionId)
  );

  return answers.map((answer) => {
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
      value: answer.answerValue,
    };
  });
}

async function loadSafetyGate(
  organisationId: string,
  assessment: UserAssessment,
  userId: string
): Promise<SafetyGate> {
  const trigger = await safetyTriggerRepository.findByAssessmentId(organisationId, assessment.id, {
    userId,
  });

  return toSafetyGate(trigger, assessment);
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
        currentStep: toResumableStep(existingAssessment.currentStep, flowSteps),
        status: existingAssessment.status,
        answers,
        flowId: existingAssessment.flowId,
        isResumed: true,
        steps,
        safetyGate: null,
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
        safetyGate: await loadSafetyGate(organisationId, submittedAssessment, userId),
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
    safetyGate: null,
  };
}

/**
 * Save assessment progress
 *
 * Persists user's answers and current step when navigating (Continue/Back). The stored step
 * moves on to the next one only when `advance` is set, on a step-level Continue.
 * Handles status transition from 'not_started' to 'in_progress' on first save.
 * Evaluates branching rules to determine the next step and any warnings.
 *
 * @throws NotFoundError if assessment doesn't exist or belongs to another member
 * @throws ValidationError if assessment is submitted/completed
 * @throws ValidationError if an answer is not part of the flow or breaks its question's
 *   rules; `details` names each failing question (see `assertNoAnswerErrors`)
 *
 * @example
 * ```typescript
 * const response = await saveProgress(assessmentId, {
 *   answers: { 'q1-uuid': { questionId: 'q1-uuid', answerValue: 5 } },
 *   currentStep: 2,
 *   advance: true,
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

  const assessment = await findOwnAssessment(organisationId, assessmentId, userId);

  // Validate assessment is not submitted/completed
  if (assessment.status === 'submitted' || assessment.status === 'completed') {
    throw new ValidationError('Cannot modify submitted assessment');
  }

  const flowSteps = await flowRepository.findStepsByFlowId(db, assessment.flowId);
  const sentAnswers = convertAnswersToSaveFormat(data.answers);
  let changedAnswers = new Map<string, AnswerValue>();

  if (sentAnswers.length > 0) {
    const storedAnswers = await answerRepository.findByAssessmentId(organisationId, assessmentId, {
      userId,
    });
    changedAnswers = findChangedAnswers(
      toAnswerValuesById(sentAnswers),
      toStoredValuesById(storedAnswers)
    );

    if (changedAnswers.size > 0) {
      const flowQuestions = await loadFlowQuestions(db, flowSteps);

      assertNoAnswerErrors(findSaveErrors(changedAnswers, flowQuestions));
    }
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

    await writeAnswerChanges(tx, organisationId, assessmentId, changedAnswers);

    // Update currentStep
    const updatedAssessment = await userAssessmentRepository.updateAssessmentProgress(
      organisationId,
      assessmentId,
      { currentStep: data.currentStep },
      { tx }
    );

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

    const answersForBranching = await toBranchingAnswers(
      db,
      assessmentId,
      allAnswers.map((answer) => ({
        questionId: answer.questionId,
        answerValue: extractAnswerValue(answer.answerValue),
      }))
    );

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

    // On a step-level advance, store the step branching picks so a resume lands there. Saves
    // made between questions inside a step keep the position on that step, or a resume would
    // skip the questions still to come.
    if (data.advance && branchResult.nextStepId) {
      const nextStepRecord = flowSteps.find((s) => s.id === branchResult.nextStepId);

      if (nextStepRecord) {
        await userAssessmentRepository.updateAssessmentProgress(
          organisationId,
          assessmentId,
          { currentStep: toResumableStep(nextStepRecord.order, flowSteps) },
          { tx }
        );
      }
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
 * Submit an assessment for scoring
 *
 * Validates the assessment can be submitted, saves final answers,
 * transitions status to 'submitted', and enqueues a scoring job. Answers that
 * raise a safety warning are recorded once, which gates the member's result
 * until they acknowledge it (`acknowledgeSafetyAdvice`).
 *
 * @throws NotFoundError if assessment doesn't exist or belongs to another member
 * @throws ValidationError if assessment is already submitted
 * @throws ValidationError if an answer breaks its rules, a submitted answer is not part of
 *   the flow, or a required question is unanswered; `details` names each failing question
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

  const assessment = await findOwnAssessment(organisationId, assessmentId, userId);

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

  const storedValues = toStoredValuesById(existingAnswers);
  const submittedValues = findChangedAnswers(
    toAnswerValuesById(convertAnswersToSaveFormat(data.answers)),
    storedValues
  );
  const flowQuestions = await loadFlowQuestions(db, flowSteps);

  assertNoAnswerErrors(findSubmitErrors(storedValues, submittedValues, flowQuestions));

  // The scoring job reads every answer, the submitted ones overriding those stored
  const responses = [...new Map([...storedValues, ...submittedValues])]
    .filter(([, answerValue]) => isAnswerProvided(answerValue))
    .map(([questionId, answerValue]) => ({ questionId, answerValue }));

  const safetyTrigger = findSafetyTrigger(
    flowSteps,
    await toBranchingAnswers(db, assessmentId, responses)
  );

  // Execute all writes in a single transaction for atomicity
  // If any step fails, all changes are rolled back
  return await withRLS(organisationId, userId, async (tx) => {
    await writeAnswerChanges(tx, organisationId, assessmentId, submittedValues);

    if (safetyTrigger) {
      await safetyTriggerRepository.recordTrigger(
        { organisationId, userAssessmentId: assessmentId, userId, ...safetyTrigger },
        { tx }
      );
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

/** Generation is queued once scoring finishes, so only a scored assessment can have failed it */
async function findProgrammeReadiness(
  organisationId: string,
  assessment: UserAssessment
): Promise<ProgrammeReadiness> {
  if (assessment.programmeId) {
    return 'ready';
  }

  if (
    assessment.status === 'scored' &&
    (await hasProgrammeGenerationFailed(organisationId, assessment.id))
  ) {
    return 'failed';
  }

  return 'pending';
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

  const assessment = await findOwnAssessment(organisationId, assessmentId, userId);

  // Validate assessment has been submitted
  if (assessment.status === 'not_started' || assessment.status === 'in_progress') {
    throw new ValidationError('Assessment not yet submitted');
  }

  // Name the programme scoring recommended. On a reassessment the linked
  // programme is still the member's current one, so it names only the fallback.
  const recommendedSlug = assessment.scores?.recommendedTemplateSlug;
  const recommendedTemplate = recommendedSlug
    ? await programmeRepository.findTemplateBySlug(recommendedSlug)
    : null;
  let programmeName: string | null = recommendedTemplate?.isActive
    ? recommendedTemplate.name
    : null;

  if (!programmeName && assessment.programmeId) {
    const programme = await programmeRepository.findProgrammeById(
      organisationId,
      assessment.programmeId,
      {
        userId,
      }
    );

    programmeName = programme?.name ?? null;
  }

  return {
    status: assessment.status,
    scores: assessment.scores,
    programmeId: assessment.programmeId,
    programmeReadiness: await findProgrammeReadiness(organisationId, assessment),
    programmeName,
    safetyGate: await loadSafetyGate(organisationId, assessment, userId),
  };
}

/**
 * Record the member's confirmation that they have acted on the safety advice their
 * answers raised, which releases their result. A repeat keeps the first confirmation.
 * The programme is generated either way: this gates what the member is shown, not
 * what the system does.
 *
 * @throws NotFoundError if assessment doesn't exist or belongs to another member
 * @throws ValidationError if the assessment raised no safety advice
 */
export async function acknowledgeSafetyAdvice(
  assessmentId: string,
  context: OrganisationContext
): Promise<SafetyGate> {
  const { organisationId } = context;
  const userId = await getUserIdFromContext(context);

  const assessment = await findOwnAssessment(organisationId, assessmentId, userId);
  const trigger = await safetyTriggerRepository.findByAssessmentId(organisationId, assessmentId, {
    userId,
  });

  if (!trigger) {
    throw new ValidationError('This assessment has no safety advice to acknowledge');
  }

  if (assessment.safetyAcknowledgedAt) {
    return toSafetyGate(trigger, assessment);
  }

  const acknowledged = await userAssessmentRepository.acknowledgeSafetyAdvice(
    organisationId,
    assessmentId,
    userId
  );

  return toSafetyGate(trigger, acknowledged);
}

/**
 * Checks the user's programme status and returns the default assessment flow ID.
 *
 * The frontend uses this to decide whether to redirect to the assessment flow:
 * - `hasProgramme` — user has an active programme (no redirect)
 * - `hasEverHadProgramme` — user has had a programme before (no forced redirect,
 *   but can optionally reassess)
 * - Neither — first-time user, redirect to assessment
 */
export async function getUserAssessmentStatus(
  context: OrganisationContext
): Promise<UserAssessmentStatusResponse> {
  const userId = await getUserIdFromContext(context);

  // Check if user has an active programme
  const programme = await programmeRepository.findProgrammeByUserId(context.organisationId, userId);

  // Check if user has ever had any programme (regardless of status)
  const hasEverHadProgramme = await programmeRepository.hasAnyProgrammeByUserId(
    context.organisationId,
    userId
  );

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
    hasEverHadProgramme,
    assessmentFlowId: flowId,
  };
}
