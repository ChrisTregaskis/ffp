import { CHOICE_QUESTION_TYPES, RANGED_QUESTION_TYPES } from '@ffp/core';
import type {
  AdminQuestionDetail,
  CreateQuestionInput,
  QuestionOption,
  QuestionType,
  QuestionValidation,
  UpdateQuestionInput,
} from '@ffp/core';

import { pluralise } from '@web/utils/string';

import type { QuestionFormValues, QuestionOptionFormValues } from './types';

export const EMPTY_OPTION: QuestionOptionFormValues = {
  value: '',
  label: '',
  score: '',
  isStored: false,
};

export const EMPTY_QUESTION_VALUES: QuestionFormValues = {
  questionText: '',
  slug: '',
  description: '',
  type: 'single-choice',
  scoreDimension: '',
  // A choice type needs at least two, so start with two to fill in
  options: [EMPTY_OPTION, EMPTY_OPTION],
  required: true,
  min: '',
  max: '',
  maxSelections: '',
  videoId: '',
  videoPublicId: '',
  videoTitle: '',
  pattern: '',
  customError: '',
};

export const takesOptions = (type: QuestionType): boolean => CHOICE_QUESTION_TYPES.includes(type);

export const takesRange = (type: QuestionType): boolean => RANGED_QUESTION_TYPES.includes(type);

const numberToField = (value: number | undefined): string =>
  value === undefined ? '' : String(value);

const fieldToNumber = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export const toQuestionFormValues = (question: AdminQuestionDetail): QuestionFormValues => ({
  questionText: question.questionText,
  slug: question.slug,
  description: question.description ?? '',
  type: question.type,
  scoreDimension: question.scoreDimension ?? '',
  options: (question.options ?? []).map((option) => ({
    value: option.value,
    label: option.label,
    score: numberToField(option.score),
    isStored: true,
  })),
  // A stored question without rules is required — the member side reads it that way
  required: question.validation?.required !== false,
  min: numberToField(question.validation?.min),
  max: numberToField(question.validation?.max),
  maxSelections: numberToField(question.validation?.maxSelections),
  videoId: question.videoId ?? '',
  videoPublicId: question.linkedVideo?.publicId ?? '',
  videoTitle: question.linkedVideo?.title ?? '',
  pattern: question.validation?.pattern ?? '',
  customError: question.validation?.customError ?? '',
});

const toOptions = (options: QuestionOptionFormValues[]): QuestionOption[] =>
  options.map((option) => ({
    value: option.value.trim(),
    label: option.label.trim(),
    score: fieldToNumber(option.score),
  }));

/**
 * The whole rule set for the chosen type — a field the type does not use is
 * left out even if the form still holds it, so switching type back and forth
 * never saves a stale rule. `null` when nothing departs from the defaults: a
 * question with no rules is required, so the two mean the same thing.
 */
export const toQuestionValidation = (values: QuestionFormValues): QuestionValidation | null => {
  const ranged = takesRange(values.type);
  const pattern = values.pattern.trim();
  const customError = values.customError.trim();

  const validation: QuestionValidation = {
    required: values.required,
    min: ranged ? fieldToNumber(values.min) : undefined,
    max: ranged ? fieldToNumber(values.max) : undefined,
    maxSelections: values.type === 'multi-choice' ? fieldToNumber(values.maxSelections) : undefined,
    pattern: pattern || undefined,
    customError: customError || undefined,
  };

  const hasRules = [
    validation.min,
    validation.max,
    validation.maxSelections,
    validation.pattern,
    validation.customError,
  ].some((rule) => rule !== undefined);

  return validation.required && !hasRules ? null : validation;
};

export const toCreateQuestionInput = (values: QuestionFormValues): CreateQuestionInput => {
  const description = values.description.trim();

  return {
    slug: values.slug.trim(),
    type: values.type,
    questionText: values.questionText.trim(),
    description: description || undefined,
    options: takesOptions(values.type) ? toOptions(values.options) : undefined,
    validation: toQuestionValidation(values) ?? undefined,
    videoId: values.type === 'video-response' ? values.videoId || undefined : undefined,
    scoreDimension: values.scoreDimension || undefined,
    isActive: true,
  };
};

/**
 * Cleared fields are sent as `null` so the stored value goes. Two fields lean on
 * the server instead of the form:
 * - `videoId` is omitted off video-response, which lets the server's type-change
 *   clean-up drop the stored link.
 * - `options` is never cleaned up by the server, so a type that takes none sends
 *   an empty list whenever the stored question still carries some.
 */
export const toUpdateQuestionInput = (
  values: QuestionFormValues,
  stored: AdminQuestionDetail
): UpdateQuestionInput => {
  const choice = takesOptions(values.type);
  const hasStoredOptions = (stored.options?.length ?? 0) > 0;
  const staleOptions = !choice && hasStoredOptions ? [] : undefined;

  return {
    type: values.type,
    questionText: values.questionText.trim(),
    description: values.description.trim() || null,
    options: choice ? toOptions(values.options) : staleOptions,
    validation: toQuestionValidation(values),
    videoId: values.type === 'video-response' ? values.videoId || null : undefined,
    scoreDimension: values.scoreDimension || null,
  };
};

/** What saving under a new type will drop from the stored question, for the warning. */
export const describeTypeChangeLoss = (
  stored: AdminQuestionDetail,
  nextType: QuestionType
): string[] => {
  if (nextType === stored.type) {
    return [];
  }

  const losses: string[] = [];
  const optionCount = stored.options?.length ?? 0;

  if (optionCount > 0 && !takesOptions(nextType)) {
    losses.push(`its ${String(optionCount)} answer options and their scores`);
  }

  if (stored.validation?.maxSelections !== undefined && nextType !== 'multi-choice') {
    losses.push('the cap on how many options a member can pick');
  }

  const hasRange = stored.validation?.min !== undefined || stored.validation?.max !== undefined;

  if (hasRange && !takesRange(nextType)) {
    losses.push('its minimum and maximum');
  }

  if (stored.videoId && nextType !== 'video-response') {
    losses.push('its linked video');
  }

  return losses;
};

/** What a type change alters without dropping, for the same warning. */
export const describeTypeChangeNotes = (
  stored: AdminQuestionDetail,
  nextType: QuestionType
): string[] => {
  if (nextType === stored.type) {
    return [];
  }

  const notes: string[] = [];
  const { templateCount, scoringFlowCount } = stored.usage;

  if (scoringFlowCount > 0) {
    notes.push(
      `${pluralise(scoringFlowCount, 'flow scores', 'flows score')} this question, and its answers will count differently.`
    );
  }

  if (templateCount > 0) {
    notes.push(
      `It is on ${pluralise(templateCount, 'assessment template', 'assessment templates')}, so members will see the new type there.`
    );
  }

  const hasRange = stored.validation?.min !== undefined || stored.validation?.max !== undefined;

  if (hasRange && takesRange(stored.type) && takesRange(nextType)) {
    notes.push('Its minimum and maximum are kept, but will now mean something different.');
  }

  return notes;
};
