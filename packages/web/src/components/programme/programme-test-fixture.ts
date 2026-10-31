import { programmeDetailResponseSchema, type ProgrammeDetailResponse } from '@ffp/core';

type Phase = ProgrammeDetailResponse['phases'][number];
type SessionStatus = NonNullable<Phase['sessions'][number]['userSession']>['status'];

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
  status: SessionStatus,
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

/** The member's programme read with one phase, holding one session per status given */
export const memberProgrammeDetail = (
  statuses: SessionStatus[],
  status: Phase['status'] = 'in_progress'
): ProgrammeDetailResponse =>
  programmeDetailResponseSchema.parse({
    programme: {
      id: crypto.randomUUID(),
      name: 'Level 1: Gentle Mobility',
      description: null,
      status: 'active',
      startedAt: null,
      totalPhases: 1,
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
        status,
        sessions: statuses.map((sessionStatus, index) =>
          session(index + 1, sessionStatus, [exercise(0, `Exercise ${String(index + 1)}`, null)])
        ),
      },
    ],
  });

/** That programme's one phase */
export const memberPhase = (statuses: SessionStatus[], status?: Phase['status']): Phase =>
  memberProgrammeDetail(statuses, status).phases[0];
