/**
 * Slot-based assembly for Option B (prototype-local, mock data).
 *
 * Each level shell defines a few named slots by movement category (one mobility,
 * one strength, one stretch…). A slot draws only from its matching tagged pool, so
 * any draw is a balanced session — the guardrail that stops a "pick N at random"
 * model producing a lopsided programme. Essential slots are the persistent thread
 * (always filled, stable across a regenerate); nice-to-have slots fill the remaining
 * room and rotate freely. An exercise carries several movement tags, so once it is
 * drawn for one slot it is removed from the remaining pools — no duplicates. Throwaway.
 */
import { type Level } from './prototype-level-model';
import {
  EXERCISE_LIBRARY,
  type Exercise,
  type FocusId,
  type GoalId,
  type MovementType,
} from './prototype-programmes';

/** A named slot in a level shell — one movement category, essential or optional. */
export interface ProgrammeSlot {
  id: string;
  movement: MovementType;
  essential: boolean;
}

/**
 * Each level shell defines 3–5 slots. Lower levels lean mobility/stretch, higher
 * levels lean strength/cardio — the shell sets the balance, the pools fill it.
 */
export const LEVEL_SLOTS: Record<Level, ProgrammeSlot[]> = {
  1: [
    { id: 'l1-mobility', movement: 'mobility', essential: true },
    { id: 'l1-stretch', movement: 'stretch', essential: true },
    { id: 'l1-mobility-2', movement: 'mobility', essential: false },
    { id: 'l1-stretch-2', movement: 'stretch', essential: false },
  ],
  2: [
    { id: 'l2-mobility', movement: 'mobility', essential: true },
    { id: 'l2-strength', movement: 'strength', essential: true },
    { id: 'l2-stretch', movement: 'stretch', essential: false },
    { id: 'l2-cardio', movement: 'cardio', essential: false },
  ],
  3: [
    { id: 'l3-strength', movement: 'strength', essential: true },
    { id: 'l3-cardio', movement: 'cardio', essential: true },
    { id: 'l3-strength-2', movement: 'strength', essential: false },
    { id: 'l3-cardio-2', movement: 'cardio', essential: false },
    { id: 'l3-stretch', movement: 'stretch', essential: false },
  ],
};

/**
 * Emphasis nudges the optional slots from the assessment profile, not just the goal —
 * a sedentary member leans toward stretch & mobility; an already-active one toward
 * strength & cardio. Essential slots never move; the shell's core stays put.
 */
export type EmphasisId = 'balanced' | 'sedentary' | 'active';

export interface EmphasisOption {
  id: EmphasisId;
  label: string;
  hint: string;
}

export const EMPHASIS_OPTIONS: EmphasisOption[] = [
  { id: 'balanced', label: 'Balanced', hint: 'Use the shell as authored' },
  {
    id: 'sedentary',
    label: 'Sedentary profile',
    hint: 'Leans the optional slots toward stretch & mobility',
  },
  {
    id: 'active',
    label: 'Already active',
    hint: 'Leans the optional slots toward strength & cardio',
  },
];

/** Movements the optional slots lean toward, by emphasis. Empty = keep the shell's defaults. */
const EMPHASIS_OPTIONAL_MOVEMENTS: Record<EmphasisId, MovementType[]> = {
  balanced: [],
  sedentary: ['stretch', 'mobility'],
  active: ['strength', 'cardio'],
};

/** Apply emphasis: essential slots stay fixed; optional slots take the emphasis movements. */
export const slotsFor = (level: Level, emphasis: EmphasisId): ProgrammeSlot[] => {
  const base = LEVEL_SLOTS[level];
  const lean = EMPHASIS_OPTIONAL_MOVEMENTS[emphasis];

  if (lean.length === 0) {
    return base;
  }

  let leanIndex = 0;

  return base.map((slot) => {
    if (slot.essential) {
      return slot;
    }

    const movement = lean[leanIndex % lean.length];
    leanIndex += 1;

    return { ...slot, movement };
  });
};

/** A slot paired with the exercise drawn for it — null when empty (removed, or no match). */
export interface AssembledSlot {
  slot: ProgrammeSlot;
  exercise: Exercise | null;
}

export interface AssembleInput {
  level: Level;
  goalId: GoalId;
  focusIds: FocusId[];
  emphasis: EmphasisId;
}

const matchesFocus = (exercise: Exercise, focusIds: FocusId[]): boolean =>
  focusIds.length === 0 ||
  focusIds.includes('full_body') ||
  exercise.areas.some((area) => focusIds.includes(area));

/** Goal and focus are soft preferences — they order a slot's pool, they don't empty it. */
const candidateScore = (exercise: Exercise, goalId: GoalId, focusIds: FocusId[]): number =>
  (exercise.goals.includes(goalId) ? 2 : 0) + (matchesFocus(exercise, focusIds) ? 1 : 0);

const poolForMovement = (movement: MovementType, level: Level, usedIds: Set<string>): Exercise[] =>
  EXERCISE_LIBRARY.filter(
    (exercise) =>
      exercise.levels.includes(level) &&
      exercise.movements.includes(movement) &&
      !usedIds.has(exercise.id)
  );

/** Essential slots pick the best match deterministically, so the thread is stable. */
const bestCandidate = (pool: Exercise[], goalId: GoalId, focusIds: FocusId[]): Exercise | null => {
  if (pool.length === 0) {
    return null;
  }

  return [...pool].sort((a, b) => {
    const diff = candidateScore(b, goalId, focusIds) - candidateScore(a, goalId, focusIds);

    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  })[0];
};

/** Nice-to-have slots pick at random, so the same shell stays fresh across draws. */
const randomCandidate = (pool: Exercise[]): Exercise | null =>
  pool.length === 0 ? null : pool[Math.floor(Math.random() * pool.length)];

/**
 * Fill a set of slots, most-constrained first, removing each pick from the remaining
 * pools so nothing is drawn twice and no slot is stranded.
 */
const fillSlots = (
  slots: ProgrammeSlot[],
  level: Level,
  usedIds: Set<string>,
  pick: (pool: Exercise[]) => Exercise | null
): Map<string, Exercise | null> => {
  const result = new Map<string, Exercise | null>();
  const remaining = [...slots];

  while (remaining.length > 0) {
    remaining.sort(
      (a, b) =>
        poolForMovement(a.movement, level, usedIds).length -
        poolForMovement(b.movement, level, usedIds).length
    );

    const slot = remaining.shift();

    if (!slot) {
      break;
    }

    const exercise = pick(poolForMovement(slot.movement, level, usedIds));

    if (exercise) {
      usedIds.add(exercise.id);
    }

    result.set(slot.id, exercise);
  }

  return result;
};

/** Assemble a member's programme — essential thread first, then rotate the rest in. */
export const assembleProgramme = (input: AssembleInput): AssembledSlot[] => {
  const slots = slotsFor(input.level, input.emphasis);
  const usedIds = new Set<string>();

  const essentialPicks = fillSlots(
    slots.filter((slot) => slot.essential),
    input.level,
    usedIds,
    (pool) => bestCandidate(pool, input.goalId, input.focusIds)
  );
  const optionalPicks = fillSlots(
    slots.filter((slot) => !slot.essential),
    input.level,
    usedIds,
    randomCandidate
  );

  return slots.map((slot) => ({
    slot,
    exercise: essentialPicks.get(slot.id) ?? optionalPicks.get(slot.id) ?? null,
  }));
};

/** Re-draw only the nice-to-have slots — the essential thread persists unchanged. */
export const regenerateOptional = (current: AssembledSlot[], level: Level): AssembledSlot[] => {
  const usedIds = new Set<string>();

  for (const item of current) {
    if (item.slot.essential && item.exercise) {
      usedIds.add(item.exercise.id);
    }
  }

  const optionalPicks = fillSlots(
    current.filter((item) => !item.slot.essential).map((item) => item.slot),
    level,
    usedIds,
    randomCandidate
  );

  return current.map((item) =>
    item.slot.essential
      ? item
      : { slot: item.slot, exercise: optionalPicks.get(item.slot.id) ?? null }
  );
};

/** The exercises currently in another slot — what a hand-edit must avoid duplicating. */
const usedOutsideSlot = (current: AssembledSlot[], slotId: string): Set<string> => {
  const usedIds = new Set<string>();

  for (const item of current) {
    if (item.slot.id !== slotId && item.exercise) {
      usedIds.add(item.exercise.id);
    }
  }

  return usedIds;
};

/** The exercises a slot could hold by hand — its movement pool minus what other slots use. */
export const availableForSlot = (
  current: AssembledSlot[],
  slotId: string,
  level: Level
): Exercise[] => {
  const target = current.find((item) => item.slot.id === slotId);

  if (!target) {
    return [];
  }

  return poolForMovement(target.slot.movement, level, usedOutsideSlot(current, slotId));
};

/** Hand-edit: set a specific exercise into a slot. */
export const setSlotExercise = (
  current: AssembledSlot[],
  slotId: string,
  exerciseId: string
): AssembledSlot[] => {
  const exercise = EXERCISE_LIBRARY.find((item) => item.id === exerciseId) ?? null;

  return current.map((item) => (item.slot.id === slotId ? { ...item, exercise } : item));
};

/** Hand-edit: empty a slot (a removed exercise can be re-added by hand). */
export const clearSlotExercise = (current: AssembledSlot[], slotId: string): AssembledSlot[] =>
  current.map((item) => (item.slot.id === slotId ? { ...item, exercise: null } : item));

/** Hand-edit: swap a slot to the next available exercise in its pool. */
export const swapSlotExercise = (
  current: AssembledSlot[],
  slotId: string,
  level: Level
): AssembledSlot[] => {
  const target = current.find((item) => item.slot.id === slotId);
  const options = availableForSlot(current, slotId, level);

  if (!target || options.length <= 1) {
    return current;
  }

  const currentIndex = target.exercise
    ? options.findIndex((option) => option.id === target.exercise?.id)
    : -1;
  const next = options[(currentIndex + 1) % options.length];

  return setSlotExercise(current, slotId, next.id);
};

/** The drawn exercises in slot order, skipping any empty slots. */
export const assembledExercises = (assembled: AssembledSlot[]): Exercise[] =>
  assembled
    .map((item) => item.exercise)
    .filter((exercise): exercise is Exercise => exercise !== null);
