import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { templatePhases, templateSessions, sessionExercises } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { PROGRAMME_TEMPLATE_IDS } from './seedProgrammeTemplates.js';
import { VIDEO_IDS } from './seedVideos.js';

import type { NewTemplatePhase } from '../src/schema/template-phases.js';
import type { NewTemplateSession } from '../src/schema/template-sessions.js';
import type { NewSessionExercise } from '../src/schema/session-exercises.js';

const logger = createLogger('seed-template-hierarchy');

/**
 * Deterministic UUIDs for template phases
 *
 * UUID Pattern: 88888888-8888-8888-8888-8888888800XX
 * Gentle Mobility Programme — 4 phases (01–04)
 */
export const TEMPLATE_PHASE_IDS = {
  'gentle-mobility-phase-1': '88888888-8888-8888-8888-888888880001',
  'gentle-mobility-phase-2': '88888888-8888-8888-8888-888888880002',
  'gentle-mobility-phase-3': '88888888-8888-8888-8888-888888880003',
  'gentle-mobility-phase-4': '88888888-8888-8888-8888-888888880004',
} as const;

/**
 * Deterministic UUIDs for template sessions
 *
 * UUID Pattern: 99999999-9999-9999-8999-9999999900XX
 * 12 sessions total (3 per phase)
 */
export const TEMPLATE_SESSION_IDS = {
  'gentle-mobility-s1-1': '99999999-9999-9999-8999-999999990001',
  'gentle-mobility-s1-2': '99999999-9999-9999-8999-999999990002',
  'gentle-mobility-s1-3': '99999999-9999-9999-8999-999999990003',
  'gentle-mobility-s2-1': '99999999-9999-9999-8999-999999990004',
  'gentle-mobility-s2-2': '99999999-9999-9999-8999-999999990005',
  'gentle-mobility-s2-3': '99999999-9999-9999-8999-999999990006',
  'gentle-mobility-s3-1': '99999999-9999-9999-8999-999999990007',
  'gentle-mobility-s3-2': '99999999-9999-9999-8999-999999990008',
  'gentle-mobility-s3-3': '99999999-9999-9999-8999-999999990009',
  'gentle-mobility-s4-1': '99999999-9999-9999-8999-999999990010',
  'gentle-mobility-s4-2': '99999999-9999-9999-8999-999999990011',
  'gentle-mobility-s4-3': '99999999-9999-9999-8999-999999990012',
} as const;

/**
 * Deterministic UUIDs for session exercises
 *
 * UUID Pattern: 22222222-2222-2222-8222-2222222200XX
 * ~38 exercises across 12 sessions
 */
export const SESSION_EXERCISE_IDS = {
  // Phase 1, Session 1 (3 exercises)
  'gm-p1s1-e0': '22222222-2222-2222-8222-222222220001',
  'gm-p1s1-e1': '22222222-2222-2222-8222-222222220002',
  'gm-p1s1-e2': '22222222-2222-2222-8222-222222220003',
  // Phase 1, Session 2 (3 exercises)
  'gm-p1s2-e0': '22222222-2222-2222-8222-222222220004',
  'gm-p1s2-e1': '22222222-2222-2222-8222-222222220005',
  'gm-p1s2-e2': '22222222-2222-2222-8222-222222220006',
  // Phase 1, Session 3 (3 exercises)
  'gm-p1s3-e0': '22222222-2222-2222-8222-222222220007',
  'gm-p1s3-e1': '22222222-2222-2222-8222-222222220008',
  'gm-p1s3-e2': '22222222-2222-2222-8222-222222220009',
  // Phase 2, Session 1 (3 exercises)
  'gm-p2s1-e0': '22222222-2222-2222-8222-222222220010',
  'gm-p2s1-e1': '22222222-2222-2222-8222-222222220011',
  'gm-p2s1-e2': '22222222-2222-2222-8222-222222220012',
  // Phase 2, Session 2 (3 exercises)
  'gm-p2s2-e0': '22222222-2222-2222-8222-222222220013',
  'gm-p2s2-e1': '22222222-2222-2222-8222-222222220014',
  'gm-p2s2-e2': '22222222-2222-2222-8222-222222220015',
  // Phase 2, Session 3 (4 exercises)
  'gm-p2s3-e0': '22222222-2222-2222-8222-222222220016',
  'gm-p2s3-e1': '22222222-2222-2222-8222-222222220017',
  'gm-p2s3-e2': '22222222-2222-2222-8222-222222220018',
  'gm-p2s3-e3': '22222222-2222-2222-8222-222222220019',
  // Phase 3, Session 1 (3 exercises)
  'gm-p3s1-e0': '22222222-2222-2222-8222-222222220020',
  'gm-p3s1-e1': '22222222-2222-2222-8222-222222220021',
  'gm-p3s1-e2': '22222222-2222-2222-8222-222222220022',
  // Phase 3, Session 2 (3 exercises)
  'gm-p3s2-e0': '22222222-2222-2222-8222-222222220023',
  'gm-p3s2-e1': '22222222-2222-2222-8222-222222220024',
  'gm-p3s2-e2': '22222222-2222-2222-8222-222222220025',
  // Phase 3, Session 3 (3 exercises)
  'gm-p3s3-e0': '22222222-2222-2222-8222-222222220026',
  'gm-p3s3-e1': '22222222-2222-2222-8222-222222220027',
  'gm-p3s3-e2': '22222222-2222-2222-8222-222222220028',
  // Phase 4, Session 1 (4 exercises)
  'gm-p4s1-e0': '22222222-2222-2222-8222-222222220029',
  'gm-p4s1-e1': '22222222-2222-2222-8222-222222220030',
  'gm-p4s1-e2': '22222222-2222-2222-8222-222222220031',
  'gm-p4s1-e3': '22222222-2222-2222-8222-222222220032',
  // Phase 4, Session 2 (4 exercises)
  'gm-p4s2-e0': '22222222-2222-2222-8222-222222220033',
  'gm-p4s2-e1': '22222222-2222-2222-8222-222222220034',
  'gm-p4s2-e2': '22222222-2222-2222-8222-222222220035',
  'gm-p4s2-e3': '22222222-2222-2222-8222-222222220036',
  // Phase 4, Session 3 (4 exercises)
  'gm-p4s3-e0': '22222222-2222-2222-8222-222222220037',
  'gm-p4s3-e1': '22222222-2222-2222-8222-222222220038',
  'gm-p4s3-e2': '22222222-2222-2222-8222-222222220039',
  'gm-p4s3-e3': '22222222-2222-2222-8222-222222220040',
} as const;

// ─── Template Phases ───────────────────────────────────────────────────────────

const GENTLE_MOBILITY_TEMPLATE_ID = PROGRAMME_TEMPLATE_IDS['gentle-mobility-programme'];

const DEFAULT_TEMPLATE_PHASES: NewTemplatePhase[] = [
  {
    id: TEMPLATE_PHASE_IDS['gentle-mobility-phase-1'],
    programmeTemplateId: GENTLE_MOBILITY_TEMPLATE_ID,
    phaseNumber: 1,
    name: 'Gentle Awareness',
    description:
      'Introductory phase focusing on body awareness, gentle stretching, and basic mobility. ' +
      'Low intensity to build confidence and establish movement habits.',
    sessionCount: 3,
  },
  {
    id: TEMPLATE_PHASE_IDS['gentle-mobility-phase-2'],
    programmeTemplateId: GENTLE_MOBILITY_TEMPLATE_ID,
    phaseNumber: 2,
    name: 'Building Foundations',
    description:
      'Progresses to light strength and balance work alongside continued mobility. ' +
      'Introduces resistance exercises at low volume.',
    sessionCount: 3,
  },
  {
    id: TEMPLATE_PHASE_IDS['gentle-mobility-phase-3'],
    programmeTemplateId: GENTLE_MOBILITY_TEMPLATE_ID,
    phaseNumber: 3,
    name: 'Progressive Mobility',
    description:
      'Increases sets, reps, and exercise variety. Builds on foundation phase ' +
      'with slightly higher demands while maintaining gentle approach.',
    sessionCount: 3,
  },
  {
    id: TEMPLATE_PHASE_IDS['gentle-mobility-phase-4'],
    programmeTemplateId: GENTLE_MOBILITY_TEMPLATE_ID,
    phaseNumber: 4,
    name: 'Consolidation',
    description:
      'Review and consolidation phase combining all movement patterns. ' +
      'Prepares the user for reassessment or progression to a new programme.',
    sessionCount: 3,
  },
];

// ─── Template Sessions ─────────────────────────────────────────────────────────

const DEFAULT_TEMPLATE_SESSIONS: NewTemplateSession[] = [
  // Phase 1 sessions
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s1-1'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-1'],
    sessionNumber: 1,
    name: 'Introduction to Movement',
    description: 'Gentle stretching and mobility exercises to begin the programme.',
    estimatedDurationMinutes: 15,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s1-2'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-1'],
    sessionNumber: 2,
    name: 'Lower Body Basics',
    description: 'Focusing on lower body stretches and balance awareness.',
    estimatedDurationMinutes: 20,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s1-3'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-1'],
    sessionNumber: 3,
    name: 'Upper Body Mobility',
    description: 'Spinal mobility and upper body movement patterns.',
    estimatedDurationMinutes: 15,
  },
  // Phase 2 sessions
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s2-1'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-2'],
    sessionNumber: 1,
    name: 'Core Activation',
    description: 'Introducing light strength work focused on the core and posterior chain.',
    estimatedDurationMinutes: 20,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s2-2'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-2'],
    sessionNumber: 2,
    name: 'Balance Focus',
    description: 'Balance and coordination exercises with light lower body strengthening.',
    estimatedDurationMinutes: 20,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-2'],
    sessionNumber: 3,
    name: 'Full Body Introduction',
    description: 'Combining upper and lower body exercises with continued mobility work.',
    estimatedDurationMinutes: 25,
  },
  // Phase 3 sessions
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s3-1'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-3'],
    sessionNumber: 1,
    name: 'Lower Body Strength',
    description: 'Progressive lower body work with increased sets and reps.',
    estimatedDurationMinutes: 25,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s3-2'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-3'],
    sessionNumber: 2,
    name: 'Upper Body and Core',
    description: 'Upper body strength and spinal mobility progression.',
    estimatedDurationMinutes: 25,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s3-3'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-3'],
    sessionNumber: 3,
    name: 'Balance and Coordination',
    description: 'Advanced balance challenges with supplementary lower body work.',
    estimatedDurationMinutes: 20,
  },
  // Phase 4 sessions
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-4'],
    sessionNumber: 1,
    name: 'Strength Review',
    description: 'Full body strength review at the highest volume of the programme.',
    estimatedDurationMinutes: 30,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s4-2'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-4'],
    sessionNumber: 2,
    name: 'Mobility and Balance Review',
    description: 'Comprehensive mobility and balance session combining all learned movements.',
    estimatedDurationMinutes: 25,
  },
  {
    id: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    templatePhaseId: TEMPLATE_PHASE_IDS['gentle-mobility-phase-4'],
    sessionNumber: 3,
    name: 'Full Programme Review',
    description: 'Final session combining strength, mobility, and balance from all phases.',
    estimatedDurationMinutes: 30,
  },
];

// ─── Session Exercises ─────────────────────────────────────────────────────────

const V = VIDEO_IDS; // shorthand for readability

const DEFAULT_SESSION_EXERCISES: NewSessionExercise[] = [
  // ── Phase 1, Session 1: Introduction to Movement ──
  {
    id: SESSION_EXERCISE_IDS['gm-p1s1-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-1'],
    videoId: V['seated-hamstring-stretch'],
    orderIndex: 0,
    sets: 2,
    reps: '30s hold',
    restSeconds: 30,
    notes: 'Keep back straight, breathe steadily through each hold.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p1s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-1'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 1,
    sets: 2,
    reps: '10',
    restSeconds: 30,
    notes: 'Slow, controlled movements synchronised with breathing.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p1s1-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-1'],
    videoId: V['ankle-mobility-circles'],
    orderIndex: 2,
    sets: 2,
    reps: '10 each side',
    restSeconds: 20,
  },
  // ── Phase 1, Session 2: Lower Body Basics ──
  {
    id: SESSION_EXERCISE_IDS['gm-p1s2-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-2'],
    videoId: V['standing-quad-stretch'],
    orderIndex: 0,
    sets: 2,
    reps: '30s hold',
    restSeconds: 30,
    notes: 'Use a wall or chair for balance support if needed.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p1s2-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-2'],
    videoId: V['single-leg-balance'],
    orderIndex: 1,
    sets: 2,
    reps: '20s hold',
    restSeconds: 30,
    notes: 'Stand near a wall for safety. Focus on a fixed point ahead.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p1s2-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-2'],
    videoId: V['seated-hamstring-stretch'],
    orderIndex: 2,
    sets: 2,
    reps: '30s hold',
    restSeconds: 30,
  },
  // ── Phase 1, Session 3: Upper Body Mobility ──
  {
    id: SESSION_EXERCISE_IDS['gm-p1s3-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-3'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 0,
    sets: 2,
    reps: '10',
    restSeconds: 30,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p1s3-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-3'],
    videoId: V['wall-push-up'],
    orderIndex: 1,
    sets: 2,
    reps: '8',
    restSeconds: 45,
    notes: 'Hands shoulder-width apart on the wall. Slow lowering phase.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p1s3-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s1-3'],
    videoId: V['ankle-mobility-circles'],
    orderIndex: 2,
    sets: 2,
    reps: '10 each side',
    restSeconds: 20,
  },
  // ── Phase 2, Session 1: Core Activation ──
  {
    id: SESSION_EXERCISE_IDS['gm-p2s1-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-1'],
    videoId: V['glute-bridge'],
    orderIndex: 0,
    sets: 2,
    reps: '8',
    restSeconds: 45,
    notes: 'Squeeze glutes at the top and hold for 2 seconds.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-1'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 1,
    sets: 2,
    reps: '12',
    restSeconds: 30,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s1-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-1'],
    videoId: V['wall-push-up'],
    orderIndex: 2,
    sets: 2,
    reps: '10',
    restSeconds: 45,
  },
  // ── Phase 2, Session 2: Balance Focus ──
  {
    id: SESSION_EXERCISE_IDS['gm-p2s2-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-2'],
    videoId: V['single-leg-balance'],
    orderIndex: 0,
    sets: 3,
    reps: '30s hold',
    restSeconds: 30,
    notes: 'Progress from wall-assisted to freestanding when confident.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s2-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-2'],
    videoId: V['bodyweight-squat'],
    orderIndex: 1,
    sets: 2,
    reps: '8',
    restSeconds: 45,
    notes: 'Use a chair behind you for confidence. Sit-to-stand pattern.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s2-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-2'],
    videoId: V['ankle-mobility-circles'],
    orderIndex: 2,
    sets: 2,
    reps: '12 each side',
    restSeconds: 20,
  },
  // ── Phase 2, Session 3: Full Body Introduction ──
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['bodyweight-squat'],
    orderIndex: 0,
    sets: 2,
    reps: '10',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['resistance-band-row'],
    orderIndex: 1,
    sets: 2,
    reps: '8-12',
    restSeconds: 45,
    notes: 'Light resistance band. Focus on squeezing shoulder blades together.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['seated-hamstring-stretch'],
    orderIndex: 2,
    sets: 2,
    reps: '30s hold',
    restSeconds: 30,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e3'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['glute-bridge'],
    orderIndex: 3,
    sets: 2,
    reps: '10',
    restSeconds: 45,
  },
  // ── Phase 3, Session 1: Lower Body Strength ──
  {
    id: SESSION_EXERCISE_IDS['gm-p3s1-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-1'],
    videoId: V['bodyweight-squat'],
    orderIndex: 0,
    sets: 3,
    reps: '10-12',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-1'],
    videoId: V['glute-bridge'],
    orderIndex: 1,
    sets: 3,
    reps: '12',
    restSeconds: 45,
    notes: 'Hold at the top for 3 seconds on each rep.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s1-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-1'],
    videoId: V['standing-quad-stretch'],
    orderIndex: 2,
    sets: 2,
    reps: '30s hold',
    restSeconds: 30,
  },
  // ── Phase 3, Session 2: Upper Body and Core ──
  {
    id: SESSION_EXERCISE_IDS['gm-p3s2-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-2'],
    videoId: V['wall-push-up'],
    orderIndex: 0,
    sets: 3,
    reps: '10-12',
    restSeconds: 45,
    notes: 'Slow 3-second lowering phase for each rep.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s2-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-2'],
    videoId: V['resistance-band-row'],
    orderIndex: 1,
    sets: 3,
    reps: '10-12',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s2-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-2'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 2,
    sets: 2,
    reps: '15',
    restSeconds: 30,
  },
  // ── Phase 3, Session 3: Balance and Coordination ──
  {
    id: SESSION_EXERCISE_IDS['gm-p3s3-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-3'],
    videoId: V['single-leg-balance'],
    orderIndex: 0,
    sets: 3,
    reps: '30s hold',
    restSeconds: 30,
    notes: 'Try closing your eyes briefly if the standard hold feels easy.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s3-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-3'],
    videoId: V['ankle-mobility-circles'],
    orderIndex: 1,
    sets: 3,
    reps: '15 each side',
    restSeconds: 20,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s3-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-3'],
    videoId: V['bodyweight-squat'],
    orderIndex: 2,
    sets: 2,
    reps: '12',
    restSeconds: 45,
  },
  // ── Phase 4, Session 1: Strength Review ──
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['bodyweight-squat'],
    orderIndex: 0,
    sets: 3,
    reps: '12-15',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['wall-push-up'],
    orderIndex: 1,
    sets: 3,
    reps: '12-15',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['glute-bridge'],
    orderIndex: 2,
    sets: 3,
    reps: '15',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e3'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['resistance-band-row'],
    orderIndex: 3,
    sets: 3,
    reps: '12',
    restSeconds: 45,
  },
  // ── Phase 4, Session 2: Mobility and Balance Review ──
  {
    id: SESSION_EXERCISE_IDS['gm-p4s2-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-2'],
    videoId: V['single-leg-balance'],
    orderIndex: 0,
    sets: 3,
    reps: '45s hold',
    restSeconds: 30,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s2-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-2'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 1,
    sets: 3,
    reps: '15',
    restSeconds: 30,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s2-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-2'],
    videoId: V['ankle-mobility-circles'],
    orderIndex: 2,
    sets: 3,
    reps: '15 each side',
    restSeconds: 20,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s2-e3'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-2'],
    videoId: V['standing-quad-stretch'],
    orderIndex: 3,
    sets: 2,
    reps: '45s hold',
    restSeconds: 30,
  },
  // ── Phase 4, Session 3: Full Programme Review ──
  {
    id: SESSION_EXERCISE_IDS['gm-p4s3-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    videoId: V['bodyweight-squat'],
    orderIndex: 0,
    sets: 3,
    reps: '15',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s3-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    videoId: V['resistance-band-row'],
    orderIndex: 1,
    sets: 3,
    reps: '12',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s3-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    videoId: V['glute-bridge'],
    orderIndex: 2,
    sets: 3,
    reps: '15',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s3-e3'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    videoId: V['single-leg-balance'],
    orderIndex: 3,
    sets: 2,
    reps: '45s hold',
    restSeconds: 30,
    notes: 'Final balance challenge — try with eyes closed for 10 seconds.',
  },
];

// ─── Seed Functions ────────────────────────────────────────────────────────────

/**
 * Seeds template phases for the Gentle Mobility Programme.
 *
 * This seed is IDEMPOTENT — safe to run multiple times.
 * Phases are checked by ID before inserting (existing records are skipped).
 *
 * Note: template_phases has NO RLS (system-managed lookup table).
 */
const seedPhases = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding template phases...');

  let createdCount = 0;

  for (const phase of DEFAULT_TEMPLATE_PHASES) {
    const existing = await db.query.templatePhases.findFirst({
      where: eq(templatePhases.id, phase.id!),
    });

    if (existing) {
      logger.warn(`Template phase already exists: "${phase.name}"`);
      continue;
    }

    const [newPhase] = await db.insert(templatePhases).values(phase).returning({
      id: templatePhases.id,
      name: templatePhases.name,
      phaseNumber: templatePhases.phaseNumber,
    });

    logger.info('Template phase created', {
      id: newPhase.id,
      name: newPhase.name,
      phaseNumber: newPhase.phaseNumber,
    });

    createdCount++;
  }

  logger.info('Template phases seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_TEMPLATE_PHASES.length - createdCount,
  });

  return createdCount;
};

/**
 * Seeds template sessions for all seeded phases.
 *
 * Must run AFTER seedPhases (FK dependency on template_phases).
 */
const seedSessions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding template sessions...');

  let createdCount = 0;

  for (const session of DEFAULT_TEMPLATE_SESSIONS) {
    const existing = await db.query.templateSessions.findFirst({
      where: eq(templateSessions.id, session.id!),
    });

    if (existing) {
      logger.warn(`Template session already exists: "${session.name}"`);
      continue;
    }

    const [newSession] = await db.insert(templateSessions).values(session).returning({
      id: templateSessions.id,
      name: templateSessions.name,
      sessionNumber: templateSessions.sessionNumber,
    });

    logger.info('Template session created', {
      id: newSession.id,
      name: newSession.name,
      sessionNumber: newSession.sessionNumber,
    });

    createdCount++;
  }

  logger.info('Template sessions seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_TEMPLATE_SESSIONS.length - createdCount,
  });

  return createdCount;
};

/**
 * Seeds session exercises for all seeded sessions.
 *
 * Must run AFTER seedSessions (FK dependency on template_sessions)
 * and AFTER seedVideos (FK dependency on videos).
 */
const seedExercises = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding session exercises...');

  let createdCount = 0;

  for (const exercise of DEFAULT_SESSION_EXERCISES) {
    const existing = await db.query.sessionExercises.findFirst({
      where: eq(sessionExercises.id, exercise.id!),
    });

    if (existing) {
      logger.warn(`Session exercise already exists: id=${exercise.id}`);
      continue;
    }

    const [newExercise] = await db.insert(sessionExercises).values(exercise).returning({
      id: sessionExercises.id,
      orderIndex: sessionExercises.orderIndex,
    });

    logger.info('Session exercise created', {
      id: newExercise.id,
      orderIndex: newExercise.orderIndex,
    });

    createdCount++;
  }

  logger.info('Session exercises seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_SESSION_EXERCISES.length - createdCount,
  });

  return createdCount;
};

/**
 * Seeds the complete template hierarchy for the Gentle Mobility Programme.
 *
 * Calls seedPhases → seedSessions → seedExercises in FK dependency order.
 * Each sub-seed is idempotent — safe to run multiple times.
 *
 * Must run AFTER:
 * - seedProgrammeTemplates (FK: template_phases.programme_template_id)
 * - seedVideos (FK: session_exercises.video_id)
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Total records created across all three tables
 */
export const seedTemplateHierarchy = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding template hierarchy (Gentle Mobility Programme)...');

  const phasesCreated = await seedPhases(db);
  const sessionsCreated = await seedSessions(db);
  const exercisesCreated = await seedExercises(db);

  const totalCreated = phasesCreated + sessionsCreated + exercisesCreated;

  logger.info('Template hierarchy seed complete', {
    phases: phasesCreated,
    sessions: sessionsCreated,
    exercises: exercisesCreated,
    totalCreated,
  });

  return totalCreated;
};
