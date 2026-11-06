import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { organisations, users } from '../src/schema';
import * as schema from '../src/schema';
import { bootstrapSuperAdmin } from '../src/seed/bootstrapSuperAdmin';
import { PLATFORM_ORGANISATION } from '../src/seed/seedPlatformTenant';
import { asOrganisation, inRolledBackTransaction, testDbConnectionConfig } from '../src/testing';

type Db = NodePgDatabase<typeof schema>;

const ADMIN = { email: 'bootstrap.admin@example.test', firstName: 'Hana', lastName: 'Admin' };
const SUB = '1b6b2f4e-0000-4000-8000-00000000b007';
const OTHER_ORGANISATION_ID = '0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b';

const directory = (
  existing: Record<string, string> | null = null
): {
  createUser: ReturnType<typeof vi.fn>;
  getUserAttributes: ReturnType<typeof vi.fn>;
  deleteUser: ReturnType<typeof vi.fn>;
} => ({
  createUser: vi.fn().mockResolvedValue(SUB),
  getUserAttributes: vi.fn().mockResolvedValue(existing),
  deleteUser: vi.fn().mockResolvedValue(undefined),
});

// Cognito attribute names, written out: they are the external contract
const platformAdminAttributes = {
  sub: SUB,
  'custom:tenantId': PLATFORM_ORGANISATION.id,
  'custom:role': 'system_admin',
};

const createPlatform = (tx: Db): Promise<unknown> =>
  asOrganisation(tx, PLATFORM_ORGANISATION.id, (orgTx) =>
    orgTx
      .insert(organisations)
      .values({ id: PLATFORM_ORGANISATION.id, type: 'platform', name: 'Platform' })
  );

/** Another row already holds the sub the directory hands back (unique cognito_sub) */
const takeSub = (tx: Db): Promise<unknown> =>
  asOrganisation(tx, PLATFORM_ORGANISATION.id, (orgTx) =>
    orgTx.insert(users).values({
      organisationId: PLATFORM_ORGANISATION.id,
      email: 'someone.else@example.test',
      cognitoSub: SUB,
      firstName: 'Some',
      lastName: 'One',
      role: 'system_admin',
    })
  );

const usersByEmail = (tx: Db, email: string): Promise<unknown[]> =>
  asOrganisation(tx, PLATFORM_ORGANISATION.id, (orgTx) =>
    orgTx
      .select({
        organisationId: users.organisationId,
        cognitoSub: users.cognitoSub,
        role: users.role,
        locationId: users.locationId,
      })
      .from(users)
      .where(eq(users.email, email))
  );

describe('bootstrapSuperAdmin', () => {
  let pool: Pool;
  let db: Db;

  beforeAll(() => {
    pool = new Pool(testDbConnectionConfig());
    db = drizzle(pool, { schema });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates the directory user, then the row with the sub the directory returned', async () => {
    const cognito = directory();

    await inRolledBackTransaction(db, async (tx) => {
      await createPlatform(tx);

      await expect(bootstrapSuperAdmin(tx, cognito, ADMIN)).resolves.toMatchObject({
        cognitoSub: SUB,
        linked: false,
      });
      expect(cognito.createUser).toHaveBeenCalledWith({
        ...ADMIN,
        organisationId: PLATFORM_ORGANISATION.id,
      });
      expect(await usersByEmail(tx, ADMIN.email)).toEqual([
        {
          organisationId: PLATFORM_ORGANISATION.id,
          cognitoSub: SUB,
          role: 'system_admin',
          locationId: null,
        },
      ]);
    });

    expect(cognito.getUserAttributes).not.toHaveBeenCalled();
    expect(cognito.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the directory user it created when the database write fails', async () => {
    const cognito = directory();

    await inRolledBackTransaction(db, async (tx) => {
      await createPlatform(tx);
      await takeSub(tx);

      await expect(bootstrapSuperAdmin(tx, cognito, ADMIN)).rejects.toMatchObject({
        cause: { code: '23505' },
      });
      expect(await usersByEmail(tx, ADMIN.email)).toEqual([]);
    });

    expect(cognito.deleteUser).toHaveBeenCalledWith(ADMIN.email);
  });

  it('surfaces the database error even when deleting the directory user also fails', async () => {
    const cognito = directory();
    cognito.deleteUser.mockRejectedValue(new Error('Cognito unavailable'));

    await inRolledBackTransaction(db, async (tx) => {
      await createPlatform(tx);
      await takeSub(tx);

      await expect(bootstrapSuperAdmin(tx, cognito, ADMIN)).rejects.toMatchObject({
        cause: { code: '23505' },
      });
    });

    expect(cognito.deleteUser).toHaveBeenCalledWith(ADMIN.email);
  });

  it('refuses without the platform organisation, before touching the directory', async () => {
    const cognito = directory();

    await inRolledBackTransaction(db, async (tx) => {
      expect(
        await tx.select().from(organisations).where(eq(organisations.type, 'platform')),
        'the test database must hold no platform organisation for this case'
      ).toEqual([]);

      await expect(bootstrapSuperAdmin(tx, cognito, ADMIN)).rejects.toThrow(
        'The platform organisation does not exist: run the reference seed first'
      );
    });

    expect(cognito.createUser).not.toHaveBeenCalled();
  });

  it('refuses an email any organisation already holds, before touching the directory', async () => {
    const cognito = directory();

    await inRolledBackTransaction(db, async (tx) => {
      await createPlatform(tx);
      await asOrganisation(tx, OTHER_ORGANISATION_ID, async (orgTx) => {
        await orgTx
          .insert(organisations)
          .values({ id: OTHER_ORGANISATION_ID, type: 'business', name: 'Elsewhere' });
        await orgTx.insert(users).values({
          organisationId: OTHER_ORGANISATION_ID,
          email: ADMIN.email,
          cognitoSub: 'another-sub',
          firstName: 'Some',
          lastName: 'Member',
          role: 'programme_user',
        });
      });

      await expect(bootstrapSuperAdmin(tx, cognito, ADMIN)).rejects.toThrow(
        `A user with email ${ADMIN.email} already exists`
      );
    });

    expect(cognito.createUser).not.toHaveBeenCalled();
  });

  describe('linking an existing directory user', () => {
    it('links a platform system admin with its own sub, creating no user', async () => {
      const cognito = directory(platformAdminAttributes);

      await inRolledBackTransaction(db, async (tx) => {
        await createPlatform(tx);

        await expect(
          bootstrapSuperAdmin(tx, cognito, ADMIN, { linkExisting: true })
        ).resolves.toMatchObject({ cognitoSub: SUB, linked: true });
        expect(await usersByEmail(tx, ADMIN.email)).toEqual([
          {
            organisationId: PLATFORM_ORGANISATION.id,
            cognitoSub: SUB,
            role: 'system_admin',
            locationId: null,
          },
        ]);
      });

      expect(cognito.getUserAttributes).toHaveBeenCalledWith(ADMIN.email);
      expect(cognito.createUser).not.toHaveBeenCalled();
    });

    it.each([
      [
        'another organisation',
        { ...platformAdminAttributes, 'custom:tenantId': OTHER_ORGANISATION_ID },
      ],
      ['another role', { ...platformAdminAttributes, 'custom:role': 'customer_admin' }],
    ])('refuses a directory user of %s', async (_label, attributes) => {
      const cognito = directory(attributes);

      await inRolledBackTransaction(db, async (tx) => {
        await createPlatform(tx);

        await expect(
          bootstrapSuperAdmin(tx, cognito, ADMIN, { linkExisting: true })
        ).rejects.toThrow('is not a system admin of the platform organisation');
        expect(await usersByEmail(tx, ADMIN.email)).toEqual([]);
      });

      expect(cognito.createUser).not.toHaveBeenCalled();
    });

    it('never deletes a linked user when the database write fails', async () => {
      const cognito = directory(platformAdminAttributes);

      await inRolledBackTransaction(db, async (tx) => {
        await createPlatform(tx);
        await takeSub(tx);

        await expect(
          bootstrapSuperAdmin(tx, cognito, ADMIN, { linkExisting: true })
        ).rejects.toMatchObject({ cause: { code: '23505' } });
      });

      expect(cognito.deleteUser).not.toHaveBeenCalled();
    });

    it('creates the user when the directory has none', async () => {
      const cognito = directory(null);

      await inRolledBackTransaction(db, async (tx) => {
        await createPlatform(tx);

        await expect(
          bootstrapSuperAdmin(tx, cognito, ADMIN, { linkExisting: true })
        ).resolves.toMatchObject({ linked: false });
      });

      expect(cognito.createUser).toHaveBeenCalledTimes(1);
    });
  });
});
