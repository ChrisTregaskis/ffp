import { difficultySchema } from '@ffp/core';
import type { Difficulty } from '@ffp/core';

import type { SelectOption } from '@web/components/molecules';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** For both form selects and list filters, in the order the schema declares them. */
export const DIFFICULTY_OPTIONS: SelectOption[] = difficultySchema.options.map((difficulty) => ({
  value: difficulty,
  label: DIFFICULTY_LABELS[difficulty],
}));
