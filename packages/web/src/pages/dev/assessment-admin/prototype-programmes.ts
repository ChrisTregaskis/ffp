/**
 * Mock programme + exercise data (prototype-local).
 *
 * The confirmed model: one shell per level, plus a single library of exercises
 * tagged by typed category (goal, body area, movement, difficulty, audience). A
 * member's goal and focus draw tagged exercises into the level shell's slots. This
 * module holds the tagged library and the goal/focus vocabulary. Throwaway, no DB.
 */
import { type Level } from './prototype-level-model';

export type GoalId = 'relieve' | 'strength' | 'energy';
export type FocusId = 'neck_shoulders' | 'back_core' | 'hips_lower' | 'full_body';

export interface GoalOption {
  id: GoalId;
  label: string;
}

export interface FocusOption {
  id: FocusId;
  label: string;
}

export const GOALS: GoalOption[] = [
  { id: 'relieve', label: 'Relieve tension & stiffness' },
  { id: 'strength', label: 'Build strength & stability' },
  { id: 'energy', label: 'Boost energy & get moving' },
];

export const FOCUS_AREAS: FocusOption[] = [
  { id: 'neck_shoulders', label: 'Neck & shoulders' },
  { id: 'back_core', label: 'Lower back & core' },
  { id: 'hips_lower', label: 'Hips & lower body' },
  { id: 'full_body', label: 'Full body refresh' },
];

export const LEVELS: Level[] = [1, 2, 3];

export const focusLabel = (id: FocusId): string =>
  FOCUS_AREAS.find((f) => f.id === id)?.label ?? id;

/**
 * Tags are typed — every tag belongs to a category (a namespace) rather than
 * sitting in one flat list. The assembler and admin UI can then reason per
 * category: fill a movement slot, filter by difficulty, surface an audience hint.
 * This mirrors the tag-category schema the real exercise library will need.
 */
export type MovementType = 'mobility' | 'strength' | 'stretch' | 'cardio';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type AudienceTag = 'good_for_beginners' | 'low_impact';

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  mobility: 'Mobility',
  strength: 'Strength',
  stretch: 'Stretch',
  cardio: 'Cardio',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const AUDIENCE_LABELS: Record<AudienceTag, string> = {
  good_for_beginners: 'Good for beginners',
  low_impact: 'Low impact',
};

export interface Exercise {
  id: string;
  name: string;
  levels: Level[];
  /** Goal tags — the outcome this exercise serves. */
  goals: GoalId[];
  /** Body-area tags — where it works. */
  areas: FocusId[];
  /** Movement tags — the slot categories it can fill (mobility *and* strength, say). */
  movements: MovementType[];
  /** Difficulty tag — one band per exercise. */
  difficulty: Difficulty;
  /** Audience tags — finer hints like "good for beginners". */
  audience: AudienceTag[];
  /** Marks a core, must-have exercise — the assembler favours these for the essential thread. */
  essential?: boolean;
  minutes: number;
}

/** A small tagged library — Option B assembles each member's set by filtering this. */
export const EXERCISE_LIBRARY: Exercise[] = [
  // Relieve — mobility & stretch
  {
    id: 'ex-neck-release',
    name: 'Neck rolls & shoulder release',
    levels: [1, 2],
    goals: ['relieve'],
    areas: ['neck_shoulders'],
    movements: ['mobility', 'stretch'],
    difficulty: 'beginner',
    audience: ['good_for_beginners', 'low_impact'],
    minutes: 4,
  },
  {
    id: 'ex-cat-cow',
    name: 'Upper-back cat-cow',
    levels: [1, 2],
    goals: ['relieve', 'strength'],
    areas: ['back_core', 'neck_shoulders'],
    movements: ['mobility'],
    difficulty: 'beginner',
    audience: ['good_for_beginners'],
    essential: true,
    minutes: 5,
  },
  {
    id: 'ex-spinal-twist',
    name: 'Seated spinal twist',
    levels: [1, 2, 3],
    goals: ['relieve'],
    areas: ['back_core'],
    movements: ['mobility', 'stretch'],
    difficulty: 'beginner',
    audience: ['good_for_beginners', 'low_impact'],
    essential: true,
    minutes: 5,
  },
  {
    id: 'ex-hip-flexor',
    name: 'Standing hip-flexor stretch',
    levels: [1, 2, 3],
    goals: ['relieve'],
    areas: ['hips_lower'],
    movements: ['stretch'],
    difficulty: 'beginner',
    audience: ['good_for_beginners'],
    essential: true,
    minutes: 4,
  },
  {
    id: 'ex-glute-stretch',
    name: 'Glute & hamstring stretch',
    levels: [1, 2],
    goals: ['relieve'],
    areas: ['hips_lower'],
    movements: ['stretch'],
    difficulty: 'beginner',
    audience: ['low_impact'],
    minutes: 5,
  },
  {
    id: 'ex-mobility-flow',
    name: 'Gentle full-body mobility flow',
    levels: [1],
    goals: ['relieve', 'energy'],
    areas: ['full_body'],
    movements: ['mobility'],
    difficulty: 'beginner',
    audience: ['good_for_beginners', 'low_impact'],
    minutes: 8,
  },
  // Strength — stability
  {
    id: 'ex-wall-press',
    name: 'Wall press-ups',
    levels: [1, 2],
    goals: ['strength'],
    areas: ['neck_shoulders'],
    movements: ['strength'],
    difficulty: 'beginner',
    audience: ['good_for_beginners'],
    minutes: 5,
  },
  {
    id: 'ex-dead-bug',
    name: 'Dead bug core hold',
    levels: [1, 2, 3],
    goals: ['strength'],
    areas: ['back_core'],
    movements: ['strength'],
    difficulty: 'intermediate',
    audience: [],
    essential: true,
    minutes: 6,
  },
  {
    id: 'ex-glute-bridge',
    name: 'Glute bridge',
    levels: [1, 2, 3],
    goals: ['strength'],
    areas: ['hips_lower', 'back_core'],
    movements: ['strength'],
    difficulty: 'beginner',
    audience: ['good_for_beginners'],
    essential: true,
    minutes: 5,
  },
  {
    id: 'ex-bird-dog',
    name: 'Bird-dog',
    levels: [2, 3],
    goals: ['strength'],
    areas: ['back_core'],
    movements: ['strength', 'mobility'],
    difficulty: 'intermediate',
    audience: [],
    minutes: 5,
  },
  {
    id: 'ex-goblet-squat',
    name: 'Goblet squat',
    levels: [2, 3],
    goals: ['strength'],
    areas: ['hips_lower'],
    movements: ['strength'],
    difficulty: 'intermediate',
    audience: [],
    minutes: 6,
  },
  {
    id: 'ex-plank',
    name: 'Plank progression',
    levels: [2, 3],
    goals: ['strength'],
    areas: ['back_core', 'full_body'],
    movements: ['strength'],
    difficulty: 'advanced',
    audience: [],
    minutes: 5,
  },
  // Energy — dynamic
  {
    id: 'ex-marching',
    name: 'Marching on the spot',
    levels: [1, 2],
    goals: ['energy'],
    areas: ['full_body', 'hips_lower'],
    movements: ['cardio', 'mobility'],
    difficulty: 'beginner',
    audience: ['good_for_beginners', 'low_impact'],
    essential: true,
    minutes: 5,
  },
  {
    id: 'ex-step-touch',
    name: 'Step-touch cardio',
    levels: [1, 2],
    goals: ['energy'],
    areas: ['full_body'],
    movements: ['cardio'],
    difficulty: 'beginner',
    audience: ['low_impact'],
    minutes: 6,
  },
  {
    id: 'ex-squat-pulse',
    name: 'Bodyweight squat pulses',
    levels: [2, 3],
    goals: ['energy', 'strength'],
    areas: ['hips_lower'],
    movements: ['cardio', 'strength'],
    difficulty: 'intermediate',
    audience: [],
    minutes: 5,
  },
  {
    id: 'ex-shoulder-taps',
    name: 'Shoulder taps & mountain climbers',
    levels: [2, 3],
    goals: ['energy'],
    areas: ['neck_shoulders', 'back_core', 'full_body'],
    movements: ['cardio', 'strength'],
    difficulty: 'advanced',
    audience: [],
    minutes: 6,
  },
  {
    id: 'ex-star-jumps',
    name: 'Star-jump intervals',
    levels: [3],
    goals: ['energy'],
    areas: ['full_body'],
    movements: ['cardio'],
    difficulty: 'advanced',
    audience: [],
    minutes: 6,
  },
  {
    id: 'ex-lunge-flow',
    name: 'Dynamic lunge flow',
    levels: [2, 3],
    goals: ['energy', 'strength'],
    areas: ['hips_lower', 'full_body'],
    movements: ['cardio', 'strength'],
    difficulty: 'intermediate',
    audience: [],
    minutes: 7,
  },
];

/** A single assessment result — the level, goal and focus a member's set is built from. */
export interface Scenario {
  level: Level;
  goalId: GoalId;
  focusIds: FocusId[];
}
