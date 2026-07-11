/**
 * Mock 12-week programme structure for the member-programme prototype.
 *
 * Mirrors the real hierarchy — programme → phases → sessions → exercises, where each
 * exercise is a video from the library plus a prescription (sets/reps). It is built
 * deterministically from a member's level, standing in for the template the programme
 * was generated from.
 *
 * Note on the real system: exercises live on the *shared template* (session_exercises
 * hangs off template_sessions), not per member. The planned build adds a per-member
 * override layer (copy-on-write: a session inherits the template until edited, then
 * becomes the member's own copy, resettable back to the template). Here the edits are
 * mock and scoped to one member.
 */
import { type Level } from './prototype-level-model';
import { type PrototypeVideo, VIDEO_LIBRARY } from './prototype-videos';

export interface ProgrammeExercise {
  id: string;
  video: PrototypeVideo;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface ProgrammeSession {
  id: string;
  name: string;
  exercises: ProgrammeExercise[];
}

export interface ProgrammePhase {
  id: string;
  name: string;
  weeks: string;
  description: string;
  sessions: ProgrammeSession[];
}

export type MoveDirection = 'up' | 'down';

const PHASE_DEFS = [
  {
    name: 'Foundation',
    weeks: 'Weeks 1–4',
    description:
      'Introductory phase focusing on body awareness, gentle stretching, and basic mobility. Low intensity to build confidence and establish movement habits.',
  },
  {
    name: 'Build',
    weeks: 'Weeks 5–8',
    description:
      'Adds load and tempo — building strength and capacity on the foundation, with steady week-on-week progression.',
  },
  {
    name: 'Progress',
    weeks: 'Weeks 9–12',
    description:
      'Higher intensity and more variety to consolidate gains and keep the programme fresh through the final block.',
  },
];

const SESSIONS_PER_PHASE = 2;
const EXERCISES_PER_SESSION = 4;

const DIFFICULTY_RANK: Record<PrototypeVideo['difficulty'], number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

/** A default prescription by movement type — stands in for the video's default prescription. */
const prescriptionFor = (
  video: PrototypeVideo
): { sets: number; reps: string; restSeconds: number } => {
  switch (video.movementType) {
    case 'strength':
      return { sets: 3, reps: '8–12', restSeconds: 60 };
    case 'mobility':
      return { sets: 2, reps: '10 each side', restSeconds: 30 };
    case 'balance':
      return { sets: 2, reps: '30s hold', restSeconds: 30 };
    case 'stretch':
    default:
      return { sets: 1, reps: '30s hold', restSeconds: 30 };
  }
};

/** Active videos, ordered by how close their difficulty sits to the member's level. */
const orderedPoolForLevel = (level: Level): PrototypeVideo[] =>
  VIDEO_LIBRARY.filter((video) => video.status === 'active').sort((a, b) => {
    const closeness =
      Math.abs(DIFFICULTY_RANK[a.difficulty] - level) -
      Math.abs(DIFFICULTY_RANK[b.difficulty] - level);

    return closeness !== 0 ? closeness : a.id.localeCompare(b.id);
  });

/** Build a member's full programme — phases → sessions → exercises — from their level. */
export const buildProgrammeStructure = (level: Level): ProgrammePhase[] => {
  const pool = orderedPoolForLevel(level);
  let cursor = 0;

  return PHASE_DEFS.map((phase, phaseIndex) => ({
    id: `ph-${String(phaseIndex)}`,
    name: phase.name,
    weeks: phase.weeks,
    description: phase.description,
    sessions: Array.from({ length: SESSIONS_PER_PHASE }, (_unused, sessionIndex) => ({
      id: `ph-${String(phaseIndex)}-s-${String(sessionIndex)}`,
      name: `Session ${String(sessionIndex + 1)}`,
      exercises: Array.from({ length: EXERCISES_PER_SESSION }, (_item, exerciseIndex) => {
        const video = pool[cursor % pool.length];
        cursor += 1;
        const prescription = prescriptionFor(video);

        return {
          id: `ph-${String(phaseIndex)}-s-${String(sessionIndex)}-e-${String(exerciseIndex)}`,
          video,
          sets: prescription.sets,
          reps: prescription.reps,
          restSeconds: prescription.restSeconds,
        };
      }),
    })),
  }));
};

const mapExercise = (
  phases: ProgrammePhase[],
  exerciseId: string,
  fn: (exercise: ProgrammeExercise) => ProgrammeExercise | null
): ProgrammePhase[] =>
  phases.map((phase) => ({
    ...phase,
    sessions: phase.sessions.map((session) => ({
      ...session,
      exercises: session.exercises
        .map((exercise) => (exercise.id === exerciseId ? fn(exercise) : exercise))
        .filter((exercise): exercise is ProgrammeExercise => exercise !== null),
    })),
  }));

/** Hand-edit: swap an exercise for the next same-movement video not already in its session. */
export const swapProgrammeExercise = (
  phases: ProgrammePhase[],
  exerciseId: string,
  level: Level
): ProgrammePhase[] => {
  const pool = orderedPoolForLevel(level);

  return phases.map((phase) => ({
    ...phase,
    sessions: phase.sessions.map((session) => {
      if (!session.exercises.some((exercise) => exercise.id === exerciseId)) {
        return session;
      }

      const usedElsewhere = new Set(
        session.exercises
          .filter((exercise) => exercise.id !== exerciseId)
          .map((exercise) => exercise.video.id)
      );

      return {
        ...session,
        exercises: session.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }

          const sameMovement = pool.filter(
            (video) => video.movementType === exercise.video.movementType
          );
          const base = sameMovement.length > 1 ? sameMovement : pool;
          const distinct = base.filter((video) => !usedElsewhere.has(video.id));
          const candidates = distinct.length > 0 ? distinct : base;
          const currentIndex = candidates.findIndex((video) => video.id === exercise.video.id);
          const nextVideo = candidates[(currentIndex + 1) % candidates.length];
          const prescription = prescriptionFor(nextVideo);

          return {
            ...exercise,
            video: nextVideo,
            sets: prescription.sets,
            reps: prescription.reps,
            restSeconds: prescription.restSeconds,
          };
        }),
      };
    }),
  }));
};

/** Hand-edit: remove an exercise from its session. */
export const removeProgrammeExercise = (
  phases: ProgrammePhase[],
  exerciseId: string
): ProgrammePhase[] => mapExercise(phases, exerciseId, () => null);

const swapAdjacent = <T>(items: T[], index: number, direction: MoveDirection): T[] => {
  const target = direction === 'up' ? index - 1 : index + 1;

  if (index === -1 || target < 0 || target >= items.length) {
    return items;
  }

  const next = [...items];
  const moved = next[index];
  next[index] = next[target];
  next[target] = moved;

  return next;
};

/** Hand-edit: move an exercise up or down within its session. */
export const moveProgrammeExercise = (
  phases: ProgrammePhase[],
  exerciseId: string,
  direction: MoveDirection
): ProgrammePhase[] =>
  phases.map((phase) => ({
    ...phase,
    sessions: phase.sessions.map((session) => {
      const index = session.exercises.findIndex((exercise) => exercise.id === exerciseId);

      return index === -1
        ? session
        : { ...session, exercises: swapAdjacent(session.exercises, index, direction) };
    }),
  }));

/** Hand-edit: move a session up or down within its phase. */
export const moveProgrammeSession = (
  phases: ProgrammePhase[],
  sessionId: string,
  direction: MoveDirection
): ProgrammePhase[] =>
  phases.map((phase) => {
    const index = phase.sessions.findIndex((session) => session.id === sessionId);

    return index === -1
      ? phase
      : { ...phase, sessions: swapAdjacent(phase.sessions, index, direction) };
  });

let addedExerciseCounter = 0;

/** Hand-edit: add a video as a new exercise at the end of a session. */
export const addExerciseToSession = (
  phases: ProgrammePhase[],
  sessionId: string,
  videoId: string
): ProgrammePhase[] => {
  const video = VIDEO_LIBRARY.find((item) => item.id === videoId);

  if (!video) {
    return phases;
  }

  const prescription = prescriptionFor(video);
  addedExerciseCounter += 1;
  const newExercise: ProgrammeExercise = {
    id: `${sessionId}-add-${String(addedExerciseCounter)}`,
    video,
    sets: prescription.sets,
    reps: prescription.reps,
    restSeconds: prescription.restSeconds,
  };

  return phases.map((phase) => ({
    ...phase,
    sessions: phase.sessions.map((session) =>
      session.id === sessionId
        ? { ...session, exercises: [...session.exercises, newExercise] }
        : session
    ),
  }));
};

/** Videos that could be added to a session — active, level-appropriate, not already in it. */
export const availableVideosForSession = (
  session: ProgrammeSession,
  level: Level
): PrototypeVideo[] => {
  const used = new Set(session.exercises.map((exercise) => exercise.video.id));

  return orderedPoolForLevel(level).filter((video) => !used.has(video.id));
};

export const sessionMinutes = (session: ProgrammeSession): number =>
  session.exercises.reduce(
    (sum, exercise) => sum + Math.round(exercise.video.durationSeconds / 60),
    0
  );
