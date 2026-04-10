import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { programmes, programmePhases, userSessions } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { PROGRAMME_TEMPLATE_IDS } from './seedProgrammeTemplates.js';
import { TEMPLATE_PHASE_IDS, TEMPLATE_SESSION_IDS } from './seedTemplateHierarchy.js';

import type { NewProgramme } from '../src/schema/programmes.js';
import type { NewProgrammePhase } from '../src/schema/programme-phases.js';
import type { NewUserSession } from '../src/schema/user-sessions.js';

const logger = createLogger('seed-programme-user-data');

/**
 * Test programme user and organisation IDs (from seed config)
 */
const TEST_USER_ID = '06c20204-90d1-70aa-3d3d-69843d65645a';
const TEST_ORGANISATION_ID = 'd82c67e9-b000-45cb-9105-c53ac48aec36';

/**
 * Deterministic UUIDs for programme user data
 *
 * UUID Pattern: AAAAAAAA-AAAA-AAAA-8AAA-AAAAAAAAA0XX
 */
export const PROGRAMME_IDS = {
  'test-user-active': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa01',
} as const;

export const PROGRAMME_PHASE_IDS = {
  'test-user-phase-1': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa11',
  'test-user-phase-2': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa12',
  'test-user-phase-3': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa13',
  'test-user-phase-4': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa14',
} as const;

export const USER_SESSION_IDS = {
  // Phase 1 sessions (all completed)
  'test-user-p1-s1': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa21',
  'test-user-p1-s2': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa22',
  'test-user-p1-s3': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa23',
  // Phase 2 sessions (2 completed, 1 in_progress)
  'test-user-p2-s1': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa24',
  'test-user-p2-s2': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa25',
  'test-user-p2-s3': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa26',
} as const;

// ─── Data Definitions ─────────────────────────────────────────────────────────

const TP = TEMPLATE_PHASE_IDS;
const TS = TEMPLATE_SESSION_IDS;
const PP = PROGRAMME_PHASE_IDS;
const US = USER_SESSION_IDS;

/**
 * Active programme for the test programme user.
 * Uses the Gentle Mobility Programme template (the only fully seeded template).
 */
const DEFAULT_PROGRAMME: NewProgramme = {
  id: PROGRAMME_IDS['test-user-active'],
  organisationId: TEST_ORGANISATION_ID,
  userId: TEST_USER_ID,
  programmeTemplateId: PROGRAMME_TEMPLATE_IDS['gentle-mobility-programme'],
  name: 'Gentle Mobility Programme',
  description:
    'A personalised programme focusing on gentle mobility, balance, and foundational strength.',
  status: 'active',
  totalPhases: 4,
  sessionsPerPhase: 3,
};

/**
 * Programme phases — Phase 1 completed, Phase 2 in progress, Phases 3-4 not started.
 * Names sourced from template phases for consistency.
 */
const DEFAULT_PROGRAMME_PHASES: NewProgrammePhase[] = [
  {
    id: PP['test-user-phase-1'],
    organisationId: TEST_ORGANISATION_ID,
    programmeId: PROGRAMME_IDS['test-user-active'],
    templatePhaseId: TP['gentle-mobility-phase-1'],
    phaseNumber: 1,
    status: 'completed',
  },
  {
    id: PP['test-user-phase-2'],
    organisationId: TEST_ORGANISATION_ID,
    programmeId: PROGRAMME_IDS['test-user-active'],
    templatePhaseId: TP['gentle-mobility-phase-2'],
    phaseNumber: 2,
    status: 'in_progress',
  },
  {
    id: PP['test-user-phase-3'],
    organisationId: TEST_ORGANISATION_ID,
    programmeId: PROGRAMME_IDS['test-user-active'],
    templatePhaseId: TP['gentle-mobility-phase-3'],
    phaseNumber: 3,
    status: 'not_started',
  },
  {
    id: PP['test-user-phase-4'],
    organisationId: TEST_ORGANISATION_ID,
    programmeId: PROGRAMME_IDS['test-user-active'],
    templatePhaseId: TP['gentle-mobility-phase-4'],
    phaseNumber: 4,
    status: 'not_started',
  },
];

/**
 * User sessions — Phase 1 all completed, Phase 2 has 2 completed and 1 in progress.
 * This gives a realistic dashboard state with progress to display.
 */
const DEFAULT_USER_SESSIONS: NewUserSession[] = [
  // Phase 1: all completed
  {
    id: US['test-user-p1-s1'],
    organisationId: TEST_ORGANISATION_ID,
    programmePhaseId: PP['test-user-phase-1'],
    templateSessionId: TS['gentle-mobility-s1-1'],
    sessionNumber: 1,
    status: 'completed',
    startedAt: new Date('2026-03-25T09:00:00Z'),
    completedAt: new Date('2026-03-25T09:20:00Z'),
  },
  {
    id: US['test-user-p1-s2'],
    organisationId: TEST_ORGANISATION_ID,
    programmePhaseId: PP['test-user-phase-1'],
    templateSessionId: TS['gentle-mobility-s1-2'],
    sessionNumber: 2,
    status: 'completed',
    startedAt: new Date('2026-03-27T10:00:00Z'),
    completedAt: new Date('2026-03-27T10:25:00Z'),
  },
  {
    id: US['test-user-p1-s3'],
    organisationId: TEST_ORGANISATION_ID,
    programmePhaseId: PP['test-user-phase-1'],
    templateSessionId: TS['gentle-mobility-s1-3'],
    sessionNumber: 3,
    status: 'completed',
    startedAt: new Date('2026-03-29T09:30:00Z'),
    completedAt: new Date('2026-03-29T09:50:00Z'),
  },
  // Phase 2: 2 completed, 1 in progress
  {
    id: US['test-user-p2-s1'],
    organisationId: TEST_ORGANISATION_ID,
    programmePhaseId: PP['test-user-phase-2'],
    templateSessionId: TS['gentle-mobility-s2-1'],
    sessionNumber: 1,
    status: 'completed',
    startedAt: new Date('2026-04-01T09:00:00Z'),
    completedAt: new Date('2026-04-01T09:25:00Z'),
  },
  {
    id: US['test-user-p2-s2'],
    organisationId: TEST_ORGANISATION_ID,
    programmePhaseId: PP['test-user-phase-2'],
    templateSessionId: TS['gentle-mobility-s2-2'],
    sessionNumber: 2,
    status: 'completed',
    startedAt: new Date('2026-04-03T10:00:00Z'),
    completedAt: new Date('2026-04-03T10:30:00Z'),
  },
  {
    id: US['test-user-p2-s3'],
    organisationId: TEST_ORGANISATION_ID,
    programmePhaseId: PP['test-user-phase-2'],
    templateSessionId: TS['gentle-mobility-s2-3'],
    sessionNumber: 3,
    status: 'in_progress',
    startedAt: new Date('2026-04-05T09:00:00Z'),
  },
];

// ─── Seed Functions ───────────────────────────────────────────────────────────

/**
 * Seeds the active programme for the test programme user.
 * IDEMPOTENT — checks by ID before inserting.
 */
const seedProgramme = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<void> => {
  logger.info('Seeding test user programme...');

  const existing = await db.query.programmes.findFirst({
    where: eq(programmes.id, DEFAULT_PROGRAMME.id!),
  });

  if (existing) {
    logger.warn('Test user programme already exists, skipping');

    return;
  }

  await db.insert(programmes).values(DEFAULT_PROGRAMME);
  logger.info('Test user programme created', {
    id: DEFAULT_PROGRAMME.id,
    name: DEFAULT_PROGRAMME.name,
  });
};

/**
 * Seeds programme phases for the test user's active programme.
 * IDEMPOTENT — checks by ID before inserting.
 */
const seedProgrammePhases = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<void> => {
  logger.info('Seeding test user programme phases...');

  let createdCount = 0;

  for (const phase of DEFAULT_PROGRAMME_PHASES) {
    const existing = await db.query.programmePhases.findFirst({
      where: eq(programmePhases.id, phase.id!),
    });

    if (existing) {
      logger.warn(`Programme phase ${String(phase.phaseNumber)} already exists, skipping`);
      continue;
    }

    await db.insert(programmePhases).values(phase);
    createdCount++;
  }

  logger.info('Programme phases seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_PROGRAMME_PHASES.length - createdCount,
  });
};

/**
 * Seeds user sessions for the test user's active programme.
 * IDEMPOTENT — checks by ID before inserting.
 */
const seedUserSessions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<void> => {
  logger.info('Seeding test user sessions...');

  let createdCount = 0;

  for (const session of DEFAULT_USER_SESSIONS) {
    const existing = await db.query.userSessions.findFirst({
      where: eq(userSessions.id, session.id!),
    });

    if (existing) {
      logger.warn(`User session ${String(session.sessionNumber)} already exists, skipping`);
      continue;
    }

    await db.insert(userSessions).values(session);
    createdCount++;
  }

  logger.info('User sessions seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_USER_SESSIONS.length - createdCount,
  });
};

/**
 * Seeds programme data for the test programme user.
 *
 * Creates:
 * - 1 active programme (Gentle Mobility Programme)
 * - 4 programme phases (Phase 1 completed, Phase 2 in progress, Phases 3-4 not started)
 * - 6 user sessions (Phase 1: 3 completed, Phase 2: 2 completed + 1 in progress)
 *
 * This provides a realistic dashboard state for visual testing.
 * Must run AFTER: seedTestUserDatabase, seedProgrammeTemplates, seedTemplateHierarchy
 */
export const seedProgrammeUserData = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<void> => {
  logger.info('=== Seeding programme user data ===');

  await seedProgramme(db);
  await seedProgrammePhases(db);
  await seedUserSessions(db);

  logger.info('=== Programme user data seed complete ===');
};
