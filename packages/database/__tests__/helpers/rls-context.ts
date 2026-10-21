import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { organisations } from '../../src/schema';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs the callback in a transaction scoped to one organisation, for seeding and
 * clean-up. Deliberately independent of `setRLSContext`, so breaking the helper
 * under test cannot also break the fixtures that judge it.
 */
export const asOrganisation = async <T>(
  db: NodePgDatabase<any>,
  organisationId: string,
  callback: (tx: NodePgDatabase<any>) => Promise<T>
): Promise<T> => {
  if (!UUID_PATTERN.test(organisationId)) {
    throw new Error(`Test organisation id must be a UUID, got "${organisationId}"`);
  }

  return await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET LOCAL app.organisation_id = '${organisationId}'`));

    return await callback(tx);
  });
};

/**
 * Deletes the organisations a test created, each under its own context (which the
 * write policy allows). Their users, locations and member rows go with them through
 * the foreign keys' ON DELETE CASCADE.
 */
export const deleteOrganisations = async (
  db: NodePgDatabase<any>,
  organisationIds: string[]
): Promise<void> => {
  for (const organisationId of organisationIds) {
    await asOrganisation(db, organisationId, async (tx) => {
      await tx.delete(organisations).where(eq(organisations.id, organisationId));
    });
  }
};
