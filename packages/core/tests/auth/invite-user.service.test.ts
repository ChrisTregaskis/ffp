import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ffpDatabase from '@ffp/database';
import { locations, organisations, users } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import { inviteUserService } from '../../src/auth/invite-user.service';
import { CognitoService } from '../../src/lib/cognito';
import { createRequestContext } from '../../src/lib/request-context';
import { inviteUserSchema } from '../../src/schemas/user.schema';
import { inRolledBackAdminTransaction } from '../admin/admin-context.fixture';

import type { OrganisationContext } from '../../src/lib/context';
import type { Pool } from 'pg';

// The service reads through getDb, pointed at each test's rolled-back admin transaction
const serviceDb = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof ffpDatabase>()),
  getDb: () => serviceDb.current,
}));
vi.mock('../../src/lib/cognito');

const mockedCognito = vi.mocked(CognitoService);

const systemAdmin = (): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'system_admin',
    email: 'admin@example.com',
  },
  organisationId: randomUUID(),
  locationId: null,
  requestId: randomUUID(),
  timestamp: new Date(),
});

describe('inviteUserService', () => {
  let pool: Pool;
  let db: TestDb;
  let cognitoSub: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    cognitoSub = randomUUID();
    mockedCognito.inviteUser.mockResolvedValue({ User: { Username: cognitoSub }, $metadata: {} });
    mockedCognito.deleteUser.mockResolvedValue();
  });

  /** Two organisations, the first with a location, written under the admin context and rolled back */
  const withTwoOrganisations = (
    work: (tx: TestDb, ids: { home: string; other: string; location: string }) => Promise<void>
  ): Promise<void> =>
    inRolledBackAdminTransaction(db, async (tx) => {
      serviceDb.current = tx;
      const [home, other] = [randomUUID(), randomUUID()];
      const location = randomUUID();

      await tx.insert(organisations).values([
        { id: home, type: 'business', name: 'Invite home' },
        { id: other, type: 'business', name: 'Invite other' },
      ]);
      await tx.insert(locations).values({
        id: location,
        organisationId: home,
        name: 'Invite location',
        accountCode: `INV-${location.slice(0, 8)}`,
      });

      await work(tx, { home, other, location });
    });

  const invite = (
    organisationId: string,
    locationId: string
  ): ReturnType<typeof inviteUserService> =>
    inviteUserService(
      createRequestContext(systemAdmin()),
      inviteUserSchema.parse({
        email: `invitee-${cognitoSub}@example.com`,
        firstName: 'Ivy',
        lastName: 'Invitee',
        role: 'programme_user',
        organisationId,
        locationId,
      })
    );

  it('refuses a location from another organisation with a 400, before creating any login', async () => {
    await withTwoOrganisations(async (_tx, { other, location }) => {
      await expect(invite(other, location)).rejects.toMatchObject({
        statusCode: 400,
        message: 'The location does not belong to the organisation',
        details: { organisationId: other, locationId: location },
      });

      expect(mockedCognito.inviteUser).not.toHaveBeenCalled();
    });
  });

  it('refuses a location that does not exist with a 400, before creating any login', async () => {
    await withTwoOrganisations(async (_tx, { home }) => {
      const unknownLocation = randomUUID();

      await expect(invite(home, unknownLocation)).rejects.toMatchObject({
        statusCode: 400,
        details: { organisationId: home, locationId: unknownLocation },
      });

      expect(mockedCognito.inviteUser).not.toHaveBeenCalled();
    });
  });

  it('invites to a location of the named organisation', async () => {
    await withTwoOrganisations(async (tx, { home, location }) => {
      await invite(home, location);

      const [stored] = await tx
        .select({ organisationId: users.organisationId, locationId: users.locationId })
        .from(users)
        .where(eq(users.cognitoSub, cognitoSub));
      expect(stored).toEqual({ organisationId: home, locationId: location });
      expect(mockedCognito.deleteUser).not.toHaveBeenCalled();
    });
  });
});
