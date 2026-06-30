/**
 * The confirmed level-scoring model (prototype-local, pure functions).
 *
 * Activity answers set a base level by a *modal* tally — mostly lower → Level 1,
 * mixed → Level 2, mostly higher → Level 3 — and under-40s are bumped up one
 * level, capped at Level 3. Age is a single cut: under 40 = younger, 40+ = older.
 *
 * This is a deliberately different shape from a summed-threshold engine: the
 * model is a category vote, not a points total, so it lives here as its own
 * computation rather than reusing the old summed simulation. Throwaway.
 */
import { scoreQuestion, type SampleAnswers } from './prototype-scoring';

import type { PrototypeQuestion } from './prototype-types';

export type Level = 1 | 2 | 3;
export type AgeBand = 'younger' | 'older';
/** The three activity answers each land in one of these bands (A / B / C). */
export type ActivityCategory = 'lower' | 'moderate' | 'higher';

/** The three questions whose modal answer sets the base level. */
export const ACTIVITY_QUESTION_IDS = [
  'q-weekly-activity',
  'q-exercise-tolerance',
  'q-movement-comfort',
];

/** The scored demographics question that drives the under-40 bump. */
export const AGE_QUESTION_ID = 'q-demographics-age';

/** Age-bracket values that count as "younger" (under 40) for the +1 bump. */
export const YOUNGER_AGE_VALUES = ['under_20', '20_30', '31_40'];

export const LEVEL_META: Record<Level, { slug: string; name: string; tagline: string }> = {
  1: {
    slug: 'level-1-gentle-mobility',
    name: 'Level 1 — Gentle / Mobility',
    tagline: 'Lower intensity, mobility-led',
  },
  2: {
    slug: 'level-2-active-wellness',
    name: 'Level 2 — Active Wellness',
    tagline: 'Moderate, balanced effort',
  },
  3: {
    slug: 'level-3-energized-dynamic',
    name: 'Level 3 — Energized / Dynamic',
    tagline: 'Higher intensity, dynamic',
  },
};

/** The level name without the "Level N — " prefix (e.g. "Active Wellness"). */
export const levelTitle = (level: Level): string => {
  const parts = LEVEL_META[level].name.split('—');

  return parts.length > 1 ? parts[1].trim() : LEVEL_META[level].name;
};

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  lower: 'Lower',
  moderate: 'Moderate',
  higher: 'Higher',
};

/** An activity answer scores 1/2/3 → lower/moderate/higher. */
const categoryForScore = (score: number): ActivityCategory | null => {
  switch (score) {
    case 1:
      return 'lower';
    case 2:
      return 'moderate';
    case 3:
      return 'higher';
    default:
      return null;
  }
};

const LEVEL_BY_CATEGORY: Record<ActivityCategory, Level> = {
  lower: 1,
  moderate: 2,
  higher: 3,
};

export interface LevelResult {
  /** The category each answered activity question fell into, in question order. */
  activityCategories: ActivityCategory[];
  /** How many of the three answers landed in each category. */
  counts: Record<ActivityCategory, number>;
  /** The single category with a strict majority, or null when the answers are mixed. */
  modalCategory: ActivityCategory | null;
  /** Level before the age bump (mixed answers fall to Level 2). */
  baseLevel: Level;
  ageBand: AgeBand;
  /** True when "younger" pushed the level up one. */
  bumped: boolean;
  finalLevel: Level;
}

const clampLevel = (level: number): Level => Math.max(1, Math.min(3, level)) as Level;

/** Younger unless the age bracket is 40+. An unanswered age is treated as older (no bump). */
export const ageBandFor = (ageValue: unknown): AgeBand =>
  typeof ageValue === 'string' && YOUNGER_AGE_VALUES.includes(ageValue) ? 'younger' : 'older';

/** Run the confirmed model over a set of sample answers. */
export const computeLevel = (
  questions: PrototypeQuestion[],
  answers: SampleAnswers
): LevelResult => {
  const activityCategories: ActivityCategory[] = [];
  const counts: Record<ActivityCategory, number> = { lower: 0, moderate: 0, higher: 0 };

  for (const id of ACTIVITY_QUESTION_IDS) {
    const question = questions.find((q) => q.id === id);

    if (!question) {
      continue;
    }

    const category = categoryForScore(scoreQuestion(question, answers[id]));

    if (category) {
      activityCategories.push(category);
      counts[category] += 1;
    }
  }

  // Strict modal majority → that category; a three-way split (or no clear lead)
  // is "mixed" and falls to the middle band.
  const ranked = (Object.keys(counts) as ActivityCategory[]).sort((a, b) => counts[b] - counts[a]);
  const [top, second] = ranked;
  const modalCategory = counts[top] > 0 && counts[top] > counts[second] ? top : null;

  const baseLevel: Level = modalCategory ? LEVEL_BY_CATEGORY[modalCategory] : 2;
  const ageBand = ageBandFor(answers[AGE_QUESTION_ID]);
  const finalLevel = ageBand === 'younger' ? clampLevel(baseLevel + 1) : baseLevel;

  return {
    activityCategories,
    counts,
    modalCategory,
    baseLevel,
    ageBand,
    bumped: finalLevel > baseLevel,
    finalLevel,
  };
};
