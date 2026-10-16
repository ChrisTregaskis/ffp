import type { AnswerValue, DbClient } from '@ffp/database';

import { ValidationError } from '../lib/errors';
import { findByTemplateIds } from '../questions/question.repository';
import { findTemplateIdsOfSteps } from '../schemas/assessment-flow.schema';
import {
  answerErrorPath,
  isAnswerProvided,
  isAnswerRequired,
  resolveEffectiveValidation,
  validateAnswer,
  type AnswerRuleQuestion,
} from '../schemas/question-answer.schema';

import type { FlowStepWithConfig } from './flow.repository';
import type { ApiFieldError } from '../schemas/api-error.schema';
import type { QuestionType } from '../schemas/assessment-question.schema';

/** A question a flow can show, with the rules a member's answer to it is held to. */
export interface FlowQuestion {
  rules: AnswerRuleQuestion;
  /** Every one of the flow's templates showing the question, in step order. */
  templateIds: string[];
}

export type AnswerValuesById = ReadonlyMap<string, AnswerValue>;

const UNKNOWN_QUESTION_MESSAGE = 'This question is not part of your assessment.';

/**
 * Every question the flow's steps show, keyed by ID and in step order, under its
 * effective validation. A deactivated question still assigned to a template is
 * shown to members, so its answers are accepted and checked, but it is never
 * required. A question assigned to two of the flow's templates keeps the rules
 * of the first step that shows it.
 */
export async function loadFlowQuestions(
  db: DbClient,
  flowSteps: FlowStepWithConfig[]
): Promise<Map<string, FlowQuestion>> {
  const templateIds = [...new Set(findTemplateIdsOfSteps(flowSteps))];

  const questions = await findByTemplateIds(db, templateIds, { includeInactive: true });
  const flowQuestions = new Map<string, FlowQuestion>();

  for (const templateId of templateIds) {
    for (const question of questions.filter((q) => q.templateId === templateId)) {
      const existing = flowQuestions.get(question.id);

      if (existing) {
        existing.templateIds.push(templateId);
        continue;
      }

      const validation = resolveEffectiveValidation(question);

      flowQuestions.set(question.id, {
        templateIds: [templateId],
        rules: {
          // `questions.type` is the question-type enum; the shared row type widens it
          type: question.type as QuestionType,
          options: question.options,
          validation: question.isActive ? validation : { ...validation, required: false },
        },
      });
    }
  }

  return flowQuestions;
}

function toFieldError(questionId: string, code: string, message: string): ApiFieldError {
  return { path: answerErrorPath(questionId), code, message };
}

function ruleErrors(
  questionId: string,
  value: AnswerValue | undefined,
  flowQuestions: ReadonlyMap<string, FlowQuestion>
): ApiFieldError[] {
  const question = flowQuestions.get(questionId);

  if (!question) {
    return [toFieldError(questionId, 'unknown_question', UNKNOWN_QUESTION_MESSAGE)];
  }

  return validateAnswer(question.rules, value)
    .slice(0, 1)
    .map((issue) => toFieldError(questionId, issue.code, issue.message));
}

const isSameAnswer = (a: AnswerValue | undefined, b: AnswerValue): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * The answers a request actually changes. The member's client resends every
 * answer it holds, so an answer echoed back as stored is neither re-checked nor
 * rewritten: one gone stale under a later catalogue edit (its question
 * unassigned, its rules tightened) must not block every save and Back.
 */
export function findChangedAnswers(
  sent: AnswerValuesById,
  stored: AnswerValuesById
): Map<string, AnswerValue> {
  return new Map(
    [...sent].filter(([questionId, value]) => !isSameAnswer(stored.get(questionId), value))
  );
}

/**
 * The answers being saved: each must belong to the flow and keep its question's
 * rules. A blank answer clears the stored one, so a member can empty a required
 * question and still move back; submit is where required is enforced.
 */
export function findSaveErrors(
  answers: AnswerValuesById,
  flowQuestions: ReadonlyMap<string, FlowQuestion>
): ApiFieldError[] {
  return [...answers].flatMap(([questionId, value]) =>
    isAnswerProvided(value) || !flowQuestions.has(questionId)
      ? ruleErrors(questionId, value, flowQuestions)
      : []
  );
}

/**
 * The whole assessment at submit: every answer keeps its rules, the submitted
 * ones must belong to the flow, and each required question on a template the
 * member reached has a real answer. A template counts as reached when it holds
 * an answer to a question no other template shows; an answer to a shared
 * question cannot say which step it was given on. A stored answer to a question
 * since removed from the flow is left out of the check, since the member can no
 * longer see or change it.
 */
export function findSubmitErrors(
  storedAnswers: AnswerValuesById,
  submittedAnswers: AnswerValuesById,
  flowQuestions: ReadonlyMap<string, FlowQuestion>
): ApiFieldError[] {
  const answers = new Map([...storedAnswers, ...submittedAnswers]);
  // A blank answer reaches nothing: save deletes it, so it must not count only until a reload
  const reachedTemplateIds = new Set(
    [...answers]
      .filter(([, value]) => isAnswerProvided(value))
      .flatMap(([id]) => {
        const templateIds = flowQuestions.get(id)?.templateIds ?? [];

        return templateIds.length === 1 ? templateIds : [];
      })
  );

  const flowErrors = [...flowQuestions].flatMap(([questionId, question]) => {
    const value = answers.get(questionId);

    if (value !== undefined && isAnswerProvided(value)) {
      return ruleErrors(questionId, value, flowQuestions);
    }

    const isRequired =
      question.templateIds.some((id) => reachedTemplateIds.has(id)) &&
      isAnswerRequired(question.rules.validation);

    return isRequired ? ruleErrors(questionId, value, flowQuestions) : [];
  });

  const unknownErrors = [...submittedAnswers.keys()]
    .filter((questionId) => !flowQuestions.has(questionId))
    .map((questionId) => toFieldError(questionId, 'unknown_question', UNKNOWN_QUESTION_MESSAGE));

  return [...flowErrors, ...unknownErrors];
}

/**
 * Refuses the request when any answer failed. `details` lists one
 * `{ path: 'answers.<questionId>', code, message }` per failing question, the
 * same shape a request body that fails to parse reports, with a message worded
 * for the member.
 */
export function assertNoAnswerErrors(errors: ApiFieldError[]): void {
  if (errors.length > 0) {
    throw new ValidationError('Some answers need your attention', errors);
  }
}
