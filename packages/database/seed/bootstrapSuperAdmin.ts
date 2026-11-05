import { and, eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { COGNITO_CUSTOM_ATTRIBUTES } from '../src/constants/cognito.constants.js';
import { createLogger } from '../src/lib/logger.js';
import { withAdminContext, withRLS } from '../src/lib/rls.js';
import { organisations, users } from '../src/schema/index.js';

import { PLATFORM_ORGANISATION } from './seedPlatformTenant.js';

import type * as schema from '../src/schema/index.js';

const logger = createLogger('bootstrap-super-admin');

/** The user directory the super admin signs in through (Cognito, outside tests) */
export interface SuperAdminDirectory {
  /** Creates the user, has the directory generate and email the temporary password, and returns the user's sub */
  createUser: (user: {
    email: string;
    firstName: string;
    lastName: string;
    organisationId: string;
  }) => Promise<string>;
  /** The user's attributes by name, or null when the directory has no such user */
  getUserAttributes: (email: string) => Promise<Record<string, string> | null>;
  deleteUser: (email: string) => Promise<void>;
}

export interface SuperAdmin {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * The sub of a directory user who may be linked as the platform's system admin. Anyone else
 * holding the email is refused rather than given a system admin row.
 */
const linkableSub = (attributes: Record<string, string>, email: string): string => {
  const tenant = attributes[COGNITO_CUSTOM_ATTRIBUTES.ORGANISATION_ID];
  const role = attributes[COGNITO_CUSTOM_ATTRIBUTES.ROLE];
  const sub = attributes.sub;

  if (tenant !== PLATFORM_ORGANISATION.id || role !== 'system_admin' || !sub) {
    throw new Error(
      `The directory user ${email} is not a system admin of the platform organisation, so it is not linked`
    );
  }

  return sub;
};

/**
 * Creates the first system admin in the platform organisation: the directory user, then the
 * database row, which takes its `cognito_sub` from the directory. Refuses without the platform
 * organisation (the reference seed creates it) and for an email the database already holds.
 *
 * With `linkExisting`, a directory user that already exists (a database rebuilt while the user
 * pool survived) is linked instead of created, if it is a system admin of the platform.
 *
 * If the database write fails, a directory user this run created is deleted, so a retry starts
 * clean; a linked user is left alone.
 */
export const bootstrapSuperAdmin = async (
  db: NodePgDatabase<typeof schema>,
  directory: SuperAdminDirectory,
  admin: SuperAdmin,
  { linkExisting = false }: { linkExisting?: boolean } = {}
): Promise<{ userId: string; cognitoSub: string; linked: boolean }> => {
  const organisationId = PLATFORM_ORGANISATION.id;

  const platform = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(and(eq(organisations.id, organisationId), eq(organisations.type, 'platform')));

  if (platform.length === 0) {
    throw new Error('The platform organisation does not exist: run the reference seed first');
  }

  // Email is unique across organisations, so the check reads across them too
  const existing = await withAdminContext(db, (tx) =>
    tx.select({ id: users.id }).from(users).where(eq(users.email, admin.email))
  );

  if (existing.length > 0) {
    throw new Error(`A user with email ${admin.email} already exists`);
  }

  const found = linkExisting ? await directory.getUserAttributes(admin.email) : null;
  const linked = found !== null;
  const cognitoSub = found
    ? linkableSub(found, admin.email)
    : await directory.createUser({ ...admin, organisationId });

  logger.info(
    linked
      ? 'Linking the existing directory user'
      : 'Super admin created in the directory; it emails the temporary password',
    { email: admin.email }
  );

  try {
    const [user] = await withRLS(db, organisationId, undefined, (tx) =>
      tx
        .insert(users)
        .values({
          organisationId,
          email: admin.email,
          cognitoSub,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: 'system_admin',
          locationId: null,
        })
        .returning({ id: users.id })
    );

    logger.info('Super admin created in the database', { userId: user.id });

    return { userId: user.id, cognitoSub, linked };
  } catch (error) {
    // Drizzle wraps the Postgres error; its message is the useful part
    const reason =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : error;

    if (linked) {
      logger.error('Database write failed; the linked directory user is kept', { reason });
      throw error;
    }

    logger.error('Database write failed; deleting the directory user', {
      email: admin.email,
      reason,
    });

    try {
      await directory.deleteUser(admin.email);
    } catch (deleteError) {
      logger.error('Could not delete the directory user; delete it by hand before retrying', {
        email: admin.email,
        error: deleteError instanceof Error ? deleteError.message : deleteError,
      });
    }

    throw error;
  }
};
