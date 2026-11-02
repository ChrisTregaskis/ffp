import { getDb, setRLSContext as setRLSContextBase, type DbClient } from '@ffp/database';

/**
 * Transaction type for use in repository functions
 *
 * Use this type when passing transactions between functions to ensure
 * atomic operations across multiple database writes.
 */
export type Transaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

/**
 * Sets the Row-Level Security (RLS) context for the current transaction
 *
 * Delegates to @ffp/database's canonical implementation for UUID validation,
 * SQL escaping, and SET LOCAL execution.
 *
 * @param tx - Database transaction instance
 * @param organisationId - UUID of the organisation
 * @param userId - Optional UUID of the user
 */
export async function setRLSContext(
  tx: Transaction,
  organisationId: string,
  userId?: string
): Promise<void> {
  await setRLSContextBase(tx, organisationId, userId);
}

/**
 * Transaction wrapper that automatically sets RLS context
 *
 * This is the recommended way to perform database operations in the application.
 * It ensures that all queries within the transaction are scoped to the organisation.
 * Runs on the container's one pool, shared with every `getDb()` caller.
 *
 * @param organisationId - UUID of the organisation
 * @param userId - Optional UUID of the user
 * @param callback - Async function to execute within the transaction
 * @returns Result of the callback function
 */
export async function withRLS<T>(
  organisationId: string,
  userId: string | undefined,
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return await getDb().transaction(async (tx) => {
    await setRLSContext(tx, organisationId, userId);

    return await callback(tx);
  });
}
