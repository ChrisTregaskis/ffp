import { eq, sql, type ExtractTablesWithRelations } from 'drizzle-orm';

import { organisations } from '../schema';

import type { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Transaction<TSchema extends Record<string, unknown>> = NodePgTransaction<
  TSchema,
  ExtractTablesWithRelations<TSchema>
>;

/**
 * Runs the callback in a transaction scoped to one organisation with `SET LOCAL`, so the
 * setting ends with the transaction instead of staying on the pooled connection. Kept apart
 * from the production `setRLSContext` and `withRLS`, so a broken helper under test cannot
 * also break the fixtures that judge it.
 */
export const asOrganisation = async <TSchema extends Record<string, unknown>, T>(
  db: NodePgDatabase<TSchema>,
  organisationId: string,
  callback: (tx: Transaction<TSchema>) => Promise<T>
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
 * Deletes the organisations a test created, each under its own context (which the write
 * policy allows). Everything they own goes with them through the foreign keys' ON DELETE
 * CASCADE.
 */
export const deleteOrganisations = async <TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
  organisationIds: string[]
): Promise<void> => {
  for (const organisationId of organisationIds) {
    await asOrganisation(db, organisationId, async (tx) => {
      await tx.delete(organisations).where(eq(organisations.id, organisationId));
    });
  }
};
