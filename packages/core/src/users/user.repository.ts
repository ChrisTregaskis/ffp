import { eq } from 'drizzle-orm';

import { type User, users } from '@ffp/database/schema';

import { withRLS } from '../lib/database';

// Re-export User type for consumers of this repository
export type { User };

/**
 * Find a user by their Cognito sub
 *
 * Used to resolve JWT identity (Cognito sub) to database user ID.
 * RLS is enforced via tenant context.
 */
export async function findByCognitoSub(tenantId: string, cognitoSub: string): Promise<User | null> {
  return await withRLS(tenantId, undefined, async (tx) => {
    const records = await tx.select().from(users).where(eq(users.cognitoSub, cognitoSub)).limit(1);

    return records[0] ?? null;
  });
}

/**
 * Find a user by their database ID
 *
 * RLS is enforced via tenant context.
 */
export async function findById(tenantId: string, userId: string): Promise<User | null> {
  return await withRLS(tenantId, undefined, async (tx) => {
    const records = await tx.select().from(users).where(eq(users.id, userId)).limit(1);

    return records[0] ?? null;
  });
}
