import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { createLogger } from '../src/lib/logger.js';
import { withRLS } from '../src/lib/rls.js';
import { organisations } from '../src/schema/index.js';

import { FLOW_IDS } from './seedAssessmentFlows.js';

import type * as schema from '../src/schema/index.js';

const logger = createLogger('seed-platform');

/**
 * The one platform organisation. Its id is fixed because the platform's users carry it as their
 * Cognito tenant.
 */
export const PLATFORM_ORGANISATION = {
  id: '5f36a97c-0dfa-4a26-8e6f-a62ee29ba017',
  name: 'FFP Platform',
  // The flow members get when their organisation sets none; without it the lookup falls back
  // to an arbitrary active flow
  settings: { defaultAssessmentFlowId: FLOW_IDS.WELLNESS },
} as const;

/**
 * Seeds the platform organisation. IDEMPOTENT: an existing one keeps its name and settings, and
 * only gains the default settings it lacks. Refuses to create a second platform organisation,
 * since the default-flow lookup reads whichever one it finds first.
 *
 * Writes under the organisation's own RLS context, which satisfies its policy whether or not
 * the table forces RLS on its owner.
 */
export const seedPlatformOrganisation = async (
  db: NodePgDatabase<typeof schema>
): Promise<void> => {
  logger.info('Seeding platform organisation...');

  const { id, name, settings } = PLATFORM_ORGANISATION;

  await withRLS(db, id, undefined, async (tx) => {
    const platforms = await tx
      .select({ id: organisations.id, settings: organisations.settings })
      .from(organisations)
      .where(eq(organisations.type, 'platform'));

    const others = platforms.filter((platform) => platform.id !== id);

    if (others.length > 0) {
      throw new Error(
        `Another platform organisation already exists (${others.map((o) => o.id).join(', ')}); ` +
          'there must be exactly one'
      );
    }

    const existing = platforms.at(0);

    if (!existing) {
      await tx.insert(organisations).values({ id, type: 'platform', name, settings });
      logger.info('Platform organisation created', { id });

      return;
    }

    const stored = (
      typeof existing.settings === 'object' && existing.settings !== null ? existing.settings : {}
    ) as Record<string, unknown>;
    const missing = Object.entries(settings).filter(([key]) => !(key in stored));

    if (missing.length === 0) {
      logger.info('Platform organisation already exists', { id });

      return;
    }

    await tx
      .update(organisations)
      .set({ settings: { ...Object.fromEntries(missing), ...stored }, updatedAt: new Date() })
      .where(eq(organisations.id, id));

    logger.info('Platform organisation settings completed', {
      id,
      added: missing.map(([key]) => key),
    });
  });
};
