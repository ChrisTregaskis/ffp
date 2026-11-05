import { eq, inArray } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { createLogger } from '../src/lib/logger.js';
import { sessionExercises, templateSessions } from '../src/schema/index.js';

import { requireSeedId } from './requireSeedId.js';
import { TEMPLATE_SESSION_IDS } from './seedTemplateHierarchy.js';
import { VIDEO_IDS } from './seedVideos.js';

import type * as schema from '../src/schema/index.js';
import type { NewSessionExercise } from '../src/schema/session-exercises.js';

const logger = createLogger('seed-template-exercises');

/**
 * Deterministic UUIDs for session exercises
 *
 * UUID Pattern: 22222222-2222-2222-8222-2222222200XX
 * One per exercise of the level shells
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
  'aw-p1s1-e0': '22222222-2222-2222-8222-222222220041',
  'aw-p1s1-e1': '22222222-2222-2222-8222-222222220042',
  'ed-p1s1-e0': '22222222-2222-2222-8222-222222220043',
  'ed-p1s1-e1': '22222222-2222-2222-8222-222222220044',
} as const;

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
    notes:
      'Sit with one leg crossed over the other. Slowly rotate the ankle in full circles.\n' +
      '**Keep the movement smooth and controlled** — avoid jerky motions.\n\n' +
      'If you feel clicking, reduce the circle size. Switch directions halfway through each set.',
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
    notes:
      'Sit on the edge of a chair with one leg extended, heel on floor.\n' +
      'Lean forward from the hips until you feel a gentle pull behind the knee. **Hold steady — no bouncing.**\n\n' +
      'Keep a slight bend in the extended knee. Breathe deeply and relax into the stretch.',
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
    notes:
      'Start on all fours with wrists under shoulders and knees under hips.\n' +
      'Inhale: drop belly, lift chest and tailbone (cow). Exhale: round spine, tuck chin (cat).\n\n' +
      '**Move slowly with your breath.** Each transition should take 3-4 seconds.',
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
    notes:
      'Seated or standing. Draw smooth, full circles with each ankle. Reverse direction halfway.',
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
    notes:
      'Focus on initiating the movement from your pelvis, not your shoulders.\n' +
      '**Exhale fully on the cat position** to deepen the core activation.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s1-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-1'],
    videoId: V['wall-push-up'],
    orderIndex: 2,
    sets: 2,
    reps: '10',
    restSeconds: 45,
    notes:
      "Stand arm's length from the wall. Place hands shoulder-width apart at chest height.\n" +
      'Bend elbows to lower chest towards the wall, then push back. **Keep your body in a straight line.**\n\n' +
      "Don't let your hips sag. Engage your core throughout.",
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
    notes:
      'Stand with feet shoulder-width apart, arms by your sides.\n' +
      'Lower your hips back and down as if sitting into a chair. Keep chest up and knees tracking over toes. Push through heels to stand.\n\n' +
      '**Use a chair behind you** for confidence. Keep weight in your heels. Go only as low as comfortable.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['resistance-band-row'],
    orderIndex: 1,
    sets: 2,
    reps: '8-12',
    restSeconds: 45,
    notes:
      'Sit tall on a chair with feet flat. Loop resistance band around feet and hold ends.\n' +
      'Pull elbows back, **squeezing shoulder blades together**. Slowly return to start.\n\n' +
      'Keep shoulders down, away from ears. Squeeze at the top for 2 seconds.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['seated-hamstring-stretch'],
    orderIndex: 2,
    sets: 2,
    reps: '30s hold',
    restSeconds: 30,
    notes:
      'Sit on the edge of a chair with one leg extended straight ahead, heel on floor.\n' +
      'Hinge forward at the hips keeping back straight. **Hold the stretch without bouncing.**\n\n' +
      'Keep the extended leg slightly soft at the knee. Breathe deeply into the stretch.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p2s3-e3'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s2-3'],
    videoId: V['glute-bridge'],
    orderIndex: 3,
    sets: 2,
    reps: '10',
    restSeconds: 45,
    notes:
      'Lie on your back with knees bent, feet flat on the floor, hip-width apart. Arms by your sides.\n' +
      'Push through your heels to lift your hips toward the ceiling until your body forms a straight line from shoulders to knees. **Squeeze your glutes at the top.** Lower slowly.\n\n' +
      "Drive through your heels, not your toes. Don't arch your lower back — keep your core engaged.",
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
    notes:
      'Feet shoulder-width apart, toes slightly turned out.\n' +
      'Sit back and down, keeping chest proud and knees tracking over toes. **Aim for thighs parallel to the floor.**\n\n' +
      'Push through your whole foot to stand. Control the descent — 3 seconds down, 1 second up.',
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
    notes:
      'Stand on one leg, pull opposite heel towards your glute. Hold the top of your foot.\n' +
      '**Keep knees close together** and hips square. Use a wall for balance if needed.\n\n' +
      'You should feel a stretch along the front of your thigh. Avoid arching your lower back.',
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
    notes:
      'Sit tall with band looped around feet. Pull handles towards your ribcage.\n' +
      '**Focus on squeezing your shoulder blades together** at the end of each pull.\n\n' +
      'Keep elbows close to your body. Resist the urge to lean back — stay upright.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p3s2-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s3-2'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 2,
    sets: 2,
    reps: '15',
    restSeconds: 30,
    notes:
      'Use as a cool-down. Emphasise the exhale on the cat position to release upper back tension.',
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
    notes:
      'Increase the size of the circles compared to earlier phases. **Full range of motion** is the goal.',
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
    notes:
      'You should feel confident with this movement by now. Focus on depth and control.\n' +
      '**Aim for full depth** — hips below knees if comfortable. Pause briefly at the bottom.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['wall-push-up'],
    orderIndex: 1,
    sets: 3,
    reps: '12-15',
    restSeconds: 45,
    notes:
      'Progress check: can you move to a lower surface (e.g., kitchen counter)?\n' +
      'If wall push-ups feel easy, **try a slight incline** for more challenge.\n\n' +
      'Maintain strict form — body in a straight line throughout.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['glute-bridge'],
    orderIndex: 2,
    sets: 3,
    reps: '15',
    restSeconds: 45,
    notes:
      'Add a 3-second hold at the top of each rep.\n' +
      '**Squeeze glutes hard at the top** before lowering slowly. Keep core braced throughout.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s1-e3'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-1'],
    videoId: V['resistance-band-row'],
    orderIndex: 3,
    sets: 3,
    reps: '12',
    restSeconds: 45,
    notes:
      'Use a heavier band if the current one feels too easy. **Full squeeze at the back**, slow return.',
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
    notes:
      'Extended hold — focus on stillness. Fix your gaze on a point at eye level.\n' +
      '**If 45 seconds feels manageable**, try closing your eyes for the last 10 seconds.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s2-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-2'],
    videoId: V['cat-cow-stretch'],
    orderIndex: 1,
    sets: 3,
    reps: '15',
    restSeconds: 30,
    notes: 'Slow, flowing transitions. Let each breath guide the movement fully before switching.',
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
    notes:
      'Deep stretch — pull heel closer to glute than in earlier phases.\n' +
      '**Keep hips square and core tight.** Breathe steadily through the hold.',
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
    notes:
      "Final session — show yourself how far you've come.\n" +
      '**Full depth, controlled tempo.** 3 seconds down, pause, 1 second up.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s3-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    videoId: V['resistance-band-row'],
    orderIndex: 1,
    sets: 3,
    reps: '12',
    restSeconds: 45,
    notes: 'Strong, deliberate pulls. Squeeze at the back for 2 seconds on every rep.',
  },
  {
    id: SESSION_EXERCISE_IDS['gm-p4s3-e2'],
    templateSessionId: TEMPLATE_SESSION_IDS['gentle-mobility-s4-3'],
    videoId: V['glute-bridge'],
    orderIndex: 2,
    sets: 3,
    reps: '15',
    restSeconds: 45,
    notes:
      "Hold at the top for 3 seconds each rep. **Keep tension in your glutes** throughout — don't rest at the bottom.",
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
  {
    id: SESSION_EXERCISE_IDS['aw-p1s1-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['active-wellness-s1-1'],
    videoId: V['bodyweight-squat'],
    orderIndex: 0,
    sets: 3,
    reps: '10',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['aw-p1s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['active-wellness-s1-1'],
    videoId: V['glute-bridge'],
    orderIndex: 1,
    sets: 3,
    reps: '12',
    restSeconds: 45,
  },
  {
    id: SESSION_EXERCISE_IDS['ed-p1s1-e0'],
    templateSessionId: TEMPLATE_SESSION_IDS['energised-dynamic-s1-1'],
    videoId: V['bodyweight-squat'],
    orderIndex: 0,
    sets: 4,
    reps: '15',
    restSeconds: 30,
  },
  {
    id: SESSION_EXERCISE_IDS['ed-p1s1-e1'],
    templateSessionId: TEMPLATE_SESSION_IDS['energised-dynamic-s1-1'],
    videoId: V['wall-push-up'],
    orderIndex: 1,
    sets: 4,
    reps: '15',
    restSeconds: 30,
  },
];

// ─── Seed Functions ────────────────────────────────────────────────────────────

/**
 * Seeds the level shells' fixed exercises from the sample videos. IDEMPOTENT: an existing
 * exercise, matched by ID, is left as it is, and a session an admin removed gets none back.
 * Runs after seedTemplateHierarchy and seedVideos. The session_exercises table has no RLS.
 */
export const seedTemplateExercises = async (db: NodePgDatabase<typeof schema>): Promise<number> => {
  logger.info('Seeding session exercises...');

  const sessionIds = [...new Set(DEFAULT_SESSION_EXERCISES.map((e) => e.templateSessionId))];
  const existingSessions = await db
    .select({ id: templateSessions.id })
    .from(templateSessions)
    .where(inArray(templateSessions.id, sessionIds));
  const sessions = new Set(existingSessions.map((session) => session.id));
  const exercises = DEFAULT_SESSION_EXERCISES.filter((e) => sessions.has(e.templateSessionId));

  let createdCount = 0;

  for (const exercise of exercises) {
    const exerciseId = requireSeedId(
      exercise,
      `exercise ${String(exercise.orderIndex)} of template session ${exercise.templateSessionId}`
    );

    const existing = await db.query.sessionExercises.findFirst({
      where: eq(sessionExercises.id, exerciseId),
    });

    if (existing) {
      logger.warn(`Session exercise already exists: id=${exerciseId}`);
      continue;
    }

    await db.insert(sessionExercises).values(exercise);
    createdCount++;
  }

  logger.info('Session exercises seed complete', {
    created: createdCount,
    alreadyExisted: exercises.length - createdCount,
    sessionMissing: DEFAULT_SESSION_EXERCISES.length - exercises.length,
  });

  return createdCount;
};
