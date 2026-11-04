import { TransactionRollbackError } from 'drizzle-orm';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Runs the work in a transaction that is always rolled back, so nothing a test writes outlives
 * it. Only the deliberate rollback is swallowed; a failing assertion surfaces as itself.
 */
export const inRolledBackTransaction = async <TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
  work: (tx: NodePgDatabase<TSchema>) => Promise<void>
): Promise<void> => {
  try {
    await db.transaction(async (tx) => {
      await work(tx);
      tx.rollback();
    });
  } catch (error) {
    if (error instanceof TransactionRollbackError) {
      return;
    }

    throw error;
  }
};
