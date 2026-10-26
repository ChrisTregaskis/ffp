import { withAdminContext } from '@ffp/database';
import type { TestDb } from '@ffp/database/testing';

class Rollback extends Error {}

/**
 * Runs the work under the admin context the admin list services use, then rolls it back,
 * so nothing a test writes outlives it. The work gets the transaction typed as the client
 * the admin repositories take, as the services pass it; that type has no `rollback()`, so
 * a sentinel throw rolls the transaction back instead.
 */
export async function inRolledBackAdminTransaction(
  db: TestDb,
  work: (tx: TestDb) => Promise<void>
): Promise<void> {
  try {
    await withAdminContext(db, async (tx) => {
      await work(tx);
      throw new Rollback();
    });
  } catch (error) {
    // Only the deliberate rollback is swallowed; a failing assertion surfaces as itself
    if (error instanceof Rollback) {
      return;
    }

    throw error;
  }
}
