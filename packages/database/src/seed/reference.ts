import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { createLogger } from '../lib/logger.js';

import { DEFAULT_FLOWS, seedAssessmentFlows } from './seedAssessmentFlows.js';
import {
  DEFAULT_TEMPLATES,
  seedAssessmentTemplates,
  TEMPLATE_QUESTION_MAPPINGS,
} from './seedAssessmentTemplates.js';
import { DEFAULT_FLOW_STEPS, seedFlowSteps } from './seedFlowSteps.js';
import { seedPlatformOrganisation } from './seedPlatformTenant.js';
import { DEFAULT_PROGRAMME_TEMPLATES, seedProgrammeTemplates } from './seedProgrammeTemplates.js';
import { DEFAULT_QUESTIONS, seedQuestions } from './seedQuestions.js';
import { seedTemplateHierarchy } from './seedTemplateHierarchy.js';

import type * as schema from '../schema/index.js';

const logger = createLogger('seed-reference');

/**
 * Seeds the catalogue every environment carries, production included: the wellness questions,
 * assessment templates, flow and steps, the level programme templates with their phases and
 * sessions (no exercises), and the platform organisation.
 *
 * Safe to re-run: it inserts what is missing and never overwrites. A record nested under another
 * (a template's question links, a flow's steps, a template's phases and sessions) is only seeded
 * with its parent, so what an admin removed stays removed. One transaction, so a failed run
 * leaves nothing half-seeded.
 */
export const seedReference = async (db: NodePgDatabase<typeof schema>): Promise<void> => {
  logger.info('Seeding reference data...');

  await db.transaction(async (tx) => {
    const programmeTemplates = await seedProgrammeTemplates(tx, DEFAULT_PROGRAMME_TEMPLATES);

    await seedTemplateHierarchy(tx, programmeTemplates);
    await seedQuestions(tx, DEFAULT_QUESTIONS);
    await seedAssessmentTemplates(tx, DEFAULT_TEMPLATES, TEMPLATE_QUESTION_MAPPINGS);

    const flows = await seedAssessmentFlows(tx, DEFAULT_FLOWS);

    await seedFlowSteps(
      tx,
      DEFAULT_FLOW_STEPS.filter((step) => flows.includes(step.flowId))
    );
    // Last: its RLS context lasts until the transaction ends
    await seedPlatformOrganisation(tx);
  });

  logger.info('Reference data seeded');
};
