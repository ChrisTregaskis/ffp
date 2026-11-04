import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { createLogger } from '../src/lib/logger.js';
import { withRLS } from '../src/lib/rls.js';

import { seedBranchingDemoFlow } from './seedBranchingDemoFlow.js';
import { seedProgrammeUserAssessment } from './seedProgrammeUserAssessment.js';
import { seedProgrammeUserData, TEST_ORGANISATION_ID } from './seedProgrammeUserData.js';
import { seedTemplateExercises } from './seedTemplateExercises.js';
import { seedTemplateSlots } from './seedTemplateSlots.js';
import { seedTestLocation } from './seedTestCustomer.js';
import { seedTestOrganisation } from './seedTestTenant.js';
import { seedTestUserCognito } from './seedTestUserCognito.js';
import { seedTestUserDatabase } from './seedTestUserDatabase.js';
import { seedVideos } from './seedVideos.js';

import type { SeedConfig } from './types.js';
import type * as schema from '../src/schema/index.js';

const logger = createLogger('seed-demo');

/**
 * Seeds the local demo on top of the reference data: the demo organisation, its location and
 * users (in Cognito too), the sample videos, the level shells' exercises and slots, the
 * branching demo flow, and a member's programme and assessment. The system admin comes from the
 * bootstrap, not the demo. Each tenant write runs under its organisation's RLS context. Local
 * only: the caller guards it.
 */
export const seedDemo = async (
  db: NodePgDatabase<typeof schema>,
  config: SeedConfig
): Promise<void> => {
  logger.info('Seeding demo data...');

  const organisation = config.testLocationOrganisation;

  await withRLS(db, organisation.id, undefined, (tx) => seedTestOrganisation(tx, organisation));
  await withRLS(db, config.testLocation.organisationId, undefined, (tx) =>
    seedTestLocation(tx, config.testLocation)
  );

  for (const [cognito, user] of [
    [config.testLocationAdminCognito, config.testLocationAdminUser],
    [config.testLocationProgrammeUserCognito, config.testLocationProgrammeUser],
  ] as const) {
    await seedTestUserCognito(cognito, user, organisation);
    await withRLS(db, user.organisationId, undefined, (tx) => seedTestUserDatabase(tx, user));
  }

  // One transaction: a parent seeded without its children would be skipped on every re-run
  await db.transaction(async (tx) => {
    await seedVideos(tx);
    await seedBranchingDemoFlow(tx);
    await seedTemplateExercises(tx);
    await seedTemplateSlots(tx);
  });

  await withRLS(db, TEST_ORGANISATION_ID, undefined, async (tx) => {
    await seedProgrammeUserData(tx);
    await seedProgrammeUserAssessment(tx);
  });

  logger.info('Demo data seeded');
};
