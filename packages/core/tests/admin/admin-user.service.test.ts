import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';

import * as ffpDatabase from '@ffp/database';

import * as adminUserRepository from '../../src/admin/admin-user.repository';
import { createUserService, listUsersService } from '../../src/admin/admin-user.service';
import * as adminRepository from '../../src/admin/admin.repository';
import { CognitoService } from '../../src/lib/cognito';
import { paginationInputSchema } from '../../src/schemas/pagination.schema';

import type { UserListRow, UserWithLocationName } from '../../src/admin/admin-user.repository';
import type { LocationWithOrganisationName } from '../../src/admin/admin.repository';
import type { OrganisationContext } from '../../src/lib/context';

vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<typeof ffpDatabase>();
  return { ...actual, getDb: vi.fn(), withAdminContext: vi.fn() };
});
vi.mock('../../src/admin/admin-user.repository');
vi.mock('../../src/admin/admin.repository');
vi.mock('../../src/lib/cognito');

const mockedUserRepository = vi.mocked(adminUserRepository);
const mockedAdminRepository = vi.mocked(adminRepository);
const mockedCognito = vi.mocked(CognitoService);

interface LogLine {
  level: string;
  message: string;
  context?: Record<string, unknown>;
}

const MEMBER_EMAIL = 'sentinel-member-41c2@example.com';
const MEMBER_SEARCH = 'sentinel-search-9d0e@example.com';

const context = (): OrganisationContext => ({
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

describe('admin user service', () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let location: LocationWithOrganisationName;
  let cognitoSub: string;
  let input: { email: string; firstName: string; lastName: string; locationId: string };

  const logLines = (): LogLine[] =>
    consoleLog.mock.calls.map((call) => JSON.parse(call[0] as string) as LogLine);

  const loggedContext = (message: string): Record<string, unknown> | undefined =>
    logLines().find((line) => line.message === message)?.context;

  const storedUser = (overrides: Partial<UserWithLocationName> = {}): UserWithLocationName => ({
    id: randomUUID(),
    publicId: 'abcdefghijkl',
    organisationId: location.organisationId,
    email: MEMBER_EMAIL,
    cognitoSub,
    firstName: 'Mina',
    lastName: 'Member',
    role: 'programme_user',
    locationId: location.id,
    profileImageUrl: null,
    phone: null,
    dateOfBirth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    locationName: location.name,
    ...overrides,
  });

  beforeEach(() => {
    vi.resetAllMocks();
    // These are INFO lines, so a shell LOG_LEVEL above INFO must not hide them
    vi.stubEnv('LOG_LEVEL', undefined);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    location = {
      id: randomUUID(),
      publicId: 'loc000000001',
      organisationId: randomUUID(),
      name: 'Riverside',
      accountCode: 'RIV-001',
      address: null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      organisationName: 'Riverside Wellness',
    };
    cognitoSub = randomUUID();
    input = {
      email: MEMBER_EMAIL,
      firstName: 'Mina',
      lastName: 'Member',
      locationId: location.id,
    };

    vi.mocked(ffpDatabase.withAdminContext).mockImplementation(
      async (db, callback) => await callback(db)
    );
    mockedAdminRepository.getLocationById.mockResolvedValue(location);
    mockedUserRepository.getUserByEmail.mockResolvedValue(null);
    mockedCognito.inviteUser.mockResolvedValue({
      User: { Username: cognitoSub },
      $metadata: {},
    });
    mockedCognito.deleteUser.mockResolvedValue();
  });

  afterEach(() => {
    consoleLog.mockRestore();
    vi.unstubAllEnvs();
  });

  describe('creating a programme user', () => {
    it('logs the Cognito sub and user id, never the member’s email', async () => {
      const user = storedUser();
      mockedUserRepository.createUser.mockResolvedValue(user);

      await createUserService(context(), input);

      expect(loggedContext('Creating Cognito user')).toEqual({
        action: 'cognito_user_creating',
        locationId: location.id,
        organisationId: location.organisationId,
      });
      expect(loggedContext('Programme user created')).toEqual({
        action: 'user_created',
        userId: user.id,
        cognitoSub,
        locationId: location.id,
        organisationId: location.organisationId,
      });
      expect(JSON.stringify(consoleLog.mock.calls)).not.toContain('sentinel');
    });

    it('names an orphaned Cognito user by its sub, never by the member’s email', async () => {
      const insertError = new Error('insert refused');
      mockedUserRepository.createUser.mockRejectedValue(insertError);
      mockedCognito.deleteUser.mockRejectedValue(new Error('Cognito unavailable'));

      await expect(createUserService(context(), input)).rejects.toBe(insertError);

      expect(loggedContext('Cognito rollback failed — orphaned Cognito user')).toEqual({
        action: 'cognito_user_rollback_failed',
        cognitoSub,
        rollbackError: 'Cognito unavailable',
      });
      expect(JSON.stringify(consoleLog.mock.calls)).not.toContain('sentinel');
    });

    it('keeps the Cognito user when the stored row fails the response schema after the insert', async () => {
      // A row the database can hold but the response schema refuses
      mockedUserRepository.createUser.mockResolvedValue(
        storedUser({ profileImageUrl: 'not a url' })
      );

      const refused = await createUserService(context(), input).catch((error: unknown) => error);

      expect(refused).toBeInstanceOf(ZodError);
      expect((refused as ZodError).issues.map((issue) => issue.path)).toEqual([
        ['profileImageUrl'],
      ]);

      expect(mockedCognito.deleteUser).not.toHaveBeenCalled();
      expect(logLines().map((line) => line.message)).not.toContain(
        'DB insert failed, rolling back Cognito user'
      );
    });

    it('rolls the Cognito user back when the insert fails', async () => {
      const insertError = new Error('insert refused');
      mockedUserRepository.createUser.mockRejectedValue(insertError);

      await expect(createUserService(context(), input)).rejects.toBe(insertError);

      expect(mockedCognito.deleteUser).toHaveBeenCalledWith(MEMBER_EMAIL);
    });
  });

  it('logs whether a user search was given, never its text', async () => {
    mockedUserRepository.listUsers.mockResolvedValue([]);
    mockedUserRepository.countUsers.mockResolvedValue(0);

    await listUsersService(context(), paginationInputSchema.parse({ page: 1 }), {
      search: MEMBER_SEARCH,
      locationId: location.id,
    });

    expect(loggedContext('Users listed')).toEqual({
      action: 'users_listed',
      total: 0,
      page: 1,
      filters: { locationId: location.id, hasSearch: true },
    });
    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain('sentinel');
  });

  describe('listing users with their programme', () => {
    const listRow = (overrides: Partial<UserListRow>): UserListRow => ({
      ...storedUser(),
      programmeName: null,
      programmeSlug: null,
      programmeStatus: null,
      generationFailed: false,
      ...overrides,
    });

    it('reads the level from the programme slug and leaves it empty for other templates', async () => {
      mockedUserRepository.listUsers.mockResolvedValue([
        listRow({
          programmeName: 'Active Wellness',
          programmeSlug: 'level-2-active-wellness',
          programmeStatus: 'active',
        }),
        listRow({
          programmeName: 'Custom',
          programmeSlug: 'custom-plan',
          programmeStatus: 'active',
        }),
        listRow({ generationFailed: true }),
      ]);
      mockedUserRepository.countUsers.mockResolvedValue(3);

      const { data } = await listUsersService(
        context(),
        paginationInputSchema.parse({ page: 1 }),
        {}
      );

      expect(
        data.map(({ programmeName, programmeLevel, programmeStatus, generationFailed }) => ({
          programmeName,
          programmeLevel,
          programmeStatus,
          generationFailed,
        }))
      ).toEqual([
        {
          programmeName: 'Active Wellness',
          programmeLevel: 2,
          programmeStatus: 'active',
          generationFailed: false,
        },
        {
          programmeName: 'Custom',
          programmeLevel: null,
          programmeStatus: 'active',
          generationFailed: false,
        },
        {
          programmeName: null,
          programmeLevel: null,
          programmeStatus: null,
          generationFailed: true,
        },
      ]);
      expect(data[0]).not.toHaveProperty('programmeSlug');
    });

    it('passes the Customer Staff role list to the repository', async () => {
      mockedUserRepository.listUsers.mockResolvedValue([]);
      mockedUserRepository.countUsers.mockResolvedValue(0);

      await listUsersService(context(), paginationInputSchema.parse({ page: 1 }), {
        role: 'customer_owner,customer_admin',
      });

      expect(mockedUserRepository.listUsers.mock.calls[0][2]).toEqual({
        role: ['customer_owner', 'customer_admin'],
      });
    });
  });
});
