import type { AnswerValue } from '@ffp/database/types';

import type {
  QuestionOption,
  QuestionType,
  questionValidationSchema,
} from './assessment-question.schema';
import type { z } from 'zod';

/** The range a scale question offers when its validation names no bounds. */
export const DEFAULT_SCALE_RANGE = { min: 1, max: 10 } as const;

/** The validation rules an answer is checked against; `required` defaults to true. */
export type AnswerRules = Pick<
  z.input<typeof questionValidationSchema>,
  'required' | 'min' | 'max' | 'maxSelections' | 'customError'
>;

/** The parts of a question its answer is checked against. */
export interface AnswerRuleQuestion {
  type: QuestionType;
  options?: QuestionOption[] | null;
  validation?: AnswerRules | null;
}

export type AnswerIssueCode =
  | 'required'
  | 'invalid_type'
  | 'invalid_option'
  | 'too_many_selections'
  | 'too_small'
  | 'too_big';

/** One reason an answer breaks its question's rules, worded for the member. */
export interface AnswerIssue {
  code: AnswerIssueCode;
  message: string;
}

/**
 * The validation a member is held to: a template's override replaces the
 * question's own rules whole, the same way the member's question view applies it.
 */
export function resolveEffectiveValidation<TRules>(question: {
  validation?: TRules | null;
  configOverrides?: { validation?: TRules } | null;
}): TRules | null {
  return question.configOverrides?.validation ?? question.validation ?? null;
}

export function isAnswerRequired(validation: AnswerRules | null | undefined): boolean {
  return validation?.required !== false;
}

/** An empty selection, or blank text, is no answer at all. */
export function isAnswerProvided(value: AnswerValue | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

const issue = (code: AnswerIssueCode, message: string): AnswerIssue[] => [{ code, message }];

const isFiniteNumber = (value: AnswerValue): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function checkRange(
  amount: number,
  min: number | undefined,
  max: number | undefined,
  describe: { tooSmall: string; tooBig: string },
  customError: string | undefined
): AnswerIssue[] {
  if (min !== undefined && amount < min) {
    return issue('too_small', customError ?? describe.tooSmall);
  }

  if (max !== undefined && amount > max) {
    return issue('too_big', customError ?? describe.tooBig);
  }

  return [];
}

function validateChoice(
  question: AnswerRuleQuestion,
  value: AnswerValue,
  rules: AnswerRules | null | undefined
): AnswerIssue[] {
  const offered = new Set((question.options ?? []).map((option) => option.value));
  const customError = rules?.customError;

  if (question.type === 'single-choice') {
    if (typeof value !== 'string') {
      return issue('invalid_type', 'Choose one of the options.');
    }

    return offered.has(value)
      ? []
      : issue('invalid_option', customError ?? 'Choose one of the options shown.');
  }

  if (!Array.isArray(value)) {
    return issue('invalid_type', 'Choose from the options.');
  }

  if (new Set(value).size !== value.length || value.some((choice) => !offered.has(choice))) {
    return issue('invalid_option', customError ?? 'Choose from the options shown.');
  }

  const maxSelections = rules?.maxSelections;

  if (maxSelections !== undefined && value.length > maxSelections) {
    return issue(
      'too_many_selections',
      customError ??
        `Choose up to ${String(maxSelections)} ${maxSelections === 1 ? 'option' : 'options'}.`
    );
  }

  return [];
}

/**
 * Check one answer against its question's effective rules. Returns the issues
 * rather than throwing, so the member's browser and the server share it.
 * An optional question left empty passes; nothing else is checked until a
 * value is present.
 */
export function validateAnswer(
  question: AnswerRuleQuestion,
  value: AnswerValue | null | undefined
): AnswerIssue[] {
  const rules = question.validation;

  if (value === null || value === undefined || !isAnswerProvided(value)) {
    return isAnswerRequired(rules) ? issue('required', 'Please answer this question.') : [];
  }

  const customError = rules?.customError;

  switch (question.type) {
    case 'single-choice':
    case 'multi-choice':
      return validateChoice(question, value, rules);

    case 'numeric':
    case 'video-response': {
      if (!isFiniteNumber(value)) {
        return issue('invalid_type', 'Enter a number.');
      }

      return checkRange(
        value,
        rules?.min,
        rules?.max,
        {
          tooSmall: `Enter a number of at least ${String(rules?.min)}.`,
          tooBig: `Enter a number no greater than ${String(rules?.max)}.`,
        },
        customError
      );
    }

    case 'scale': {
      const min = rules?.min ?? DEFAULT_SCALE_RANGE.min;
      const max = rules?.max ?? DEFAULT_SCALE_RANGE.max;
      const outOfScale = `Choose a value from ${String(min)} to ${String(max)}.`;

      if (!isFiniteNumber(value) || !Number.isInteger(value)) {
        return issue('invalid_type', outOfScale);
      }

      return checkRange(value, min, max, { tooSmall: outOfScale, tooBig: outOfScale }, customError);
    }

    case 'text': {
      if (typeof value !== 'string') {
        return issue('invalid_type', 'Enter your answer as text.');
      }

      return checkRange(
        value.length,
        rules?.min,
        rules?.max,
        {
          tooSmall: `Use at least ${String(rules?.min)} characters.`,
          tooBig: `Use no more than ${String(rules?.max)} characters.`,
        },
        customError
      );
    }
  }
}

/** The `details` path naming an answer, as a rejected request body names it. */
export const answerErrorPath = (questionId: string): string => `answers.${questionId}`;

/** The question a field error names, or null when it names something else. */
export function questionIdFromErrorPath(path: string): string | null {
  const [root, questionId] = path.split('.');

  return root === 'answers' && questionId ? questionId : null;
}
