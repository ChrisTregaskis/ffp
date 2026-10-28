import { TransactionRollbackError } from 'drizzle-orm';

import type { TestDb } from '@ffp/database/testing';

export type TestTx = Parameters<Parameters<TestDb['transaction']>[0]>[0];

/** Runs the work and rolls it back, so nothing a test writes outlives it. */
export async function inRolledBackTransaction(
  db: TestDb,
  work: (tx: TestTx) => Promise<void>
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await work(tx);
      tx.rollback();
    });
  } catch (error) {
    // Only the deliberate rollback is swallowed; a failing assertion surfaces as itself
    if (error instanceof TransactionRollbackError) {
      return;
    }

    throw error;
  }
}
