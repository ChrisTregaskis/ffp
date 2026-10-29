import { adminProgrammeDetailResponseSchema, type AdminProgrammeDetailResponse } from '@ffp/core';

export const exercise = (orderIndex: number, title: string, notes: string | null): unknown => ({
  sessionExerciseId: crypto.randomUUID(),
  orderIndex,
  sets: 3,
  reps: '8-12',
  durationSeconds: null,
  restSeconds: 45,
  notes,
  video: {
    id: crypto.randomUUID(),
    publicId: 'vid000000001',
    title,
    durationSeconds: 60,
    difficulty: null,
  },
  completion: null,
});

export const session = (
  sessionNumber: number,
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped',
  exercises: unknown[]
): unknown => ({
  templateSessionId: crypto.randomUUID(),
  templateSessionPublicId: `session${String(sessionNumber)}xxxxx`.slice(0, 12),
  sessionNumber,
  name: `Session ${String(sessionNumber)}`,
  description: null,
  estimatedDurationMinutes: 20,
  exerciseCount: exercises.length,
  userSession: {
    id: crypto.randomUUID(),
    status,
    startedAt: null,
    completedAt: null,
    skippedAt: null,
  },
  exercises,
});

const PHASE_TWO_SESSIONS = (): unknown[] => [
  session(1, 'not_started', [
    exercise(0, 'Bodyweight Squat', '**Aim for full depth**'),
    exercise(1, 'Wall Press', null),
  ]),
];

/**
 * A member's programme as the admin read returns it: one phase in progress, one upcoming. Pass
 * the upcoming phase's sessions to build a different one.
 */
export const memberProgramme = (
  overrides: Partial<AdminProgrammeDetailResponse> = {},
  phaseTwoSessions: unknown[] = PHASE_TWO_SESSIONS()
): AdminProgrammeDetailResponse =>
  adminProgrammeDetailResponseSchema.parse({
    programme: {
      id: crypto.randomUUID(),
      name: 'Level 1: Gentle Mobility',
      description: 'Gentle movement to build confidence.',
      status: 'active',
      startedAt: null,
      totalPhases: 2,
      template: { name: 'Level 1: Gentle Mobility', difficulty: 'beginner' },
    },
    currentPhaseNumber: 1,
    phases: [
      {
        id: crypto.randomUUID(),
        publicId: 'phaseonexxxx',
        phaseNumber: 1,
        name: 'Foundations',
        description: null,
        status: 'in_progress',
        sessions: [
          session(1, 'completed', [exercise(0, 'Neck Rolls', null)]),
          session(2, 'in_progress', [exercise(0, 'Shoulder Circles', null)]),
        ],
      },
      {
        id: crypto.randomUUID(),
        publicId: 'phasetwoxxxx',
        phaseNumber: 2,
        name: 'Building Up',
        description: 'Adds a little more load.',
        status: 'not_started',
        sessions: phaseTwoSessions,
      },
    ],
    level: 1,
    keyAreas: [
      {
        questionId: crypto.randomUUID(),
        question: 'Which areas would you like to focus on?',
        answers: ['Neck & Shoulders', 'Hips & Lower Body'],
      },
    ],
    ...overrides,
  });
