import type { AdminQuestionDetail, QuestionType } from '@ffp/core';

import { pluralise } from '@web/utils/string';

import { takesOptions, takesRange } from './question-form-values';

const storedHasRange = (stored: AdminQuestionDetail): boolean =>
  stored.validation?.min !== undefined || stored.validation?.max !== undefined;

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

  if (storedHasRange(stored) && !takesRange(nextType)) {
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

  if (storedHasRange(stored) && takesRange(stored.type) && takesRange(nextType)) {
    notes.push('Its minimum and maximum are kept, but will now mean something different.');
  }

  return notes;
};
