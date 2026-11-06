import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { LEVEL_PROGRAMME_SLUGS } from '../constants/level-scoring.constants.js';
import { createLogger } from '../lib/logger.js';
import { templatePhases, templateSessions } from '../schema/index.js';

import { requireSeedId } from './requireSeedId.js';
import { PROGRAMME_TEMPLATE_IDS } from './seedProgrammeTemplates.js';

import type * as schema from '../schema/index.js';
import type { NewTemplatePhase } from '../schema/template-phases.js';
import type { NewTemplateSession } from '../schema/template-sessions.js';

const logger = createLogger('seed-template-hierarchy');

/**
 * Deterministic UUIDs for template phases
 *
 * UUID Pattern: 88888888-8888-8888-8888-8888888800XX
 * Level 1 shell — 4 phases (01–04); level 2 and 3 shells — 1 phase each (05, 06)
 */
export const TEMPLATE_PHASE_IDS = {
  'gentle-mobility-phase-1': '88888888-8888-8888-8888-888888880001',
  'gentle-mobility-phase-2': '88888888-8888-8888-8888-888888880002',
  'gentle-mobility-phase-3': '88888888-8888-8888-8888-888888880003',
  'gentle-mobility-phase-4': '88888888-8888-8888-8888-888888880004',
  'active-wellness-phase-1': '88888888-8888-8888-8888-888888880005',
  'energised-dynamic-phase-1': '88888888-8888-8888-8888-888888880006',
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
  'active-wellness-s1-1': '99999999-9999-9999-8999-999999990013',
  'energised-dynamic-s1-1': '99999999-9999-9999-8999-999999990014',
} as const;

// ─── Template Phases ───────────────────────────────────────────────────────────

const GENTLE_MOBILITY_TEMPLATE_ID = PROGRAMME_TEMPLATE_IDS[LEVEL_PROGRAMME_SLUGS[1]];

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
  // Level 2 and level 3 shells: one phase, one session, just enough to generate a programme
  {
    id: TEMPLATE_PHASE_IDS['active-wellness-phase-1'],
    programmeTemplateId: PROGRAMME_TEMPLATE_IDS[LEVEL_PROGRAMME_SLUGS[2]],
    phaseNumber: 1,
    name: 'Getting Moving',
    description: 'Baseline movement and functional strength at a moderate pace.',
    sessionCount: 1,
  },
  {
    id: TEMPLATE_PHASE_IDS['energised-dynamic-phase-1'],
    programmeTemplateId: PROGRAMME_TEMPLATE_IDS[LEVEL_PROGRAMME_SLUGS[3]],
    phaseNumber: 1,
    name: 'Full Energy',
    description: 'Higher-intensity bodyweight work.',
    sessionCount: 1,
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
  {
    id: TEMPLATE_SESSION_IDS['active-wellness-s1-1'],
    templatePhaseId: TEMPLATE_PHASE_IDS['active-wellness-phase-1'],
    sessionNumber: 1,
    name: 'Active Wellness Starter',
    description: 'A moderate session of functional strength moves.',
    estimatedDurationMinutes: 20,
  },
  {
    id: TEMPLATE_SESSION_IDS['energised-dynamic-s1-1'],
    templatePhaseId: TEMPLATE_PHASE_IDS['energised-dynamic-phase-1'],
    sessionNumber: 1,
    name: 'Energised Starter',
    description: 'A brisk bodyweight session.',
    estimatedDurationMinutes: 25,
  },
];

/**
 * Seeds the given template phases. IDEMPOTENT: an existing phase, matched by ID, is left as it is.
 *
 * @returns The IDs of the phases created
 */
const seedPhases = async (
  db: NodePgDatabase<typeof schema>,
  phases: NewTemplatePhase[]
): Promise<string[]> => {
  const created: string[] = [];

  for (const phase of phases) {
    const phaseId = requireSeedId(phase, `template phase "${String(phase.name)}"`);
    const existing = await db.query.templatePhases.findFirst({
      where: eq(templatePhases.id, phaseId),
    });

    if (existing) {
      logger.warn(`Template phase already exists: "${String(phase.name)}"`);
      continue;
    }

    await db.insert(templatePhases).values(phase);
    created.push(phaseId);
  }

  return created;
};

/**
 * Seeds the given template sessions. IDEMPOTENT: an existing session, matched by ID, is left as
 * it is.
 */
const seedSessions = async (
  db: NodePgDatabase<typeof schema>,
  sessions: NewTemplateSession[]
): Promise<number> => {
  let createdCount = 0;

  for (const session of sessions) {
    const existing = await db.query.templateSessions.findFirst({
      where: eq(
        templateSessions.id,
        requireSeedId(session, `template session "${String(session.name)}"`)
      ),
    });

    if (existing) {
      logger.warn(`Template session already exists: "${String(session.name)}"`);
      continue;
    }

    await db.insert(templateSessions).values(session);
    createdCount++;
  }

  return createdCount;
};

/**
 * Seeds the phases and sessions of the given programme templates, as empty shells: the
 * exercises come from the sample videos, so they belong to the demo seed. Only templates the
 * caller has just created get their hierarchy, because an admin may have removed a phase or
 * session from an existing one and a re-run must not bring it back. Neither table has RLS.
 */
export const seedTemplateHierarchy = async (
  db: NodePgDatabase<typeof schema>,
  programmeTemplateIds: string[]
): Promise<void> => {
  logger.info('Seeding template hierarchy (level shells)...');

  const createdPhases = await seedPhases(
    db,
    DEFAULT_TEMPLATE_PHASES.filter((phase) =>
      programmeTemplateIds.includes(phase.programmeTemplateId)
    )
  );
  const sessionsCreated = await seedSessions(
    db,
    DEFAULT_TEMPLATE_SESSIONS.filter((session) => createdPhases.includes(session.templatePhaseId))
  );

  logger.info('Template hierarchy seed complete', {
    phases: createdPhases.length,
    sessions: sessionsCreated,
  });
};
