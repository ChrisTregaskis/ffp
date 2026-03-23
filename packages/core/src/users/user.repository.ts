import { eq } from 'drizzle-orm';

import { type User, users } from '@ffp/database/schema';

import { withRLS } from '../lib/database';

/**
 * Find a user by their Cognito sub
 *
 * Used to resolve JWT identity (Cognito sub) to database user ID.
 * RLS is enforced via organisation context.
 */
export async function findUserByCognitoSub(
  organisationId: string,
  cognitoSub: string
): Promise<User | null> {
  return await withRLS(organisationId, undefined, async (tx) => {
    const records = await tx.select().from(users).where(eq(users.cognitoSub, cognitoSub)).limit(1);

    return records[0] ?? null;
  });
}

/**
 * Find a user by their database ID
 *
 * RLS is enforced via organisation context.
 */
export async function findUserById(organisationId: string, userId: string): Promise<User | null> {
  return await withRLS(organisationId, undefined, async (tx) => {
    const records = await tx.select().from(users).where(eq(users.id, userId)).limit(1);

    return records[0] ?? null;
  });
}

export type { User };
