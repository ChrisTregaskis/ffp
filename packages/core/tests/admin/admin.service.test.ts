import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as ffpDatabase from '@ffp/database';

import * as adminRepository from '../../src/admin/admin.repository';
import {
  createLocationService,
  createOrganisationService,
  listLocationsService,
  listOrganisationsService,
} from '../../src/admin/admin.service';
import { createRequestContext } from '../../src/lib/request-context';
import { paginationInputSchema } from '../../src/schemas/pagination.schema';

import type { OrganisationContext } from '../../src/lib/context';

vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<typeof ffpDatabase>();
  return { ...actual, getDb: vi.fn(), withAdminContext: vi.fn() };
});
vi.mock('../../src/admin/admin.repository');

const mockedAdminRepository = vi.mocked(adminRepository);

interface LogLine {
  message: string;
  context?: Record<string, unknown>;
}

// An individual's organisation can carry their own name, so a name or search is free text
const PERSON_NAME = 'Sentinel Personname';

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

describe('admin service logging', () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;

  const logLines = (): LogLine[] =>
    consoleLog.mock.calls.map((call) => JSON.parse(call[0] as string) as LogLine);

  const loggedContext = (message: string): Record<string, unknown> | undefined =>
    logLines().find((line) => line.message === message)?.context;

  const expectNoFreeText = (): void => {
    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain('Sentinel');
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // These are INFO lines, so a shell LOG_LEVEL above INFO must not hide them
    vi.stubEnv('LOG_LEVEL', undefined);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.mocked(ffpDatabase.withAdminContext).mockImplementation(
      async (db, callback) => await callback(db)
    );
  });

  afterEach(() => {
    consoleLog.mockRestore();
    vi.unstubAllEnvs();
  });

  it('logs a new organisation by id, not by its name', async () => {
    const organisationId = randomUUID();
    mockedAdminRepository.createOrganisation.mockResolvedValue({
      organisationId,
      name: PERSON_NAME,
    });

    await createOrganisationService(createRequestContext(context()), {
      organisationName: PERSON_NAME,
    });

    expect(loggedContext('Organisation created successfully')).toEqual({ organisationId });
    expectNoFreeText();
  });

  it('logs a new location by id, not by its name', async () => {
    const organisationId = randomUUID();
    const locationId = randomUUID();
    mockedAdminRepository.getOrganisationById.mockResolvedValue({
      id: organisationId,
      publicId: 'org000000001',
      type: 'business',
      name: 'Riverside Wellness',
      status: 'active',
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedAdminRepository.createLocation.mockResolvedValue({
      organisationId,
      locationId,
      accountCode: 'SENTIN-AB12',
    });

    await createLocationService(createRequestContext(context()), organisationId, {
      locationName: PERSON_NAME,
    });

    expect(loggedContext('Starting location creation')).toEqual({ organisationId });
    expectNoFreeText();
  });

  it('logs whether an organisation search was made, not what was searched for', async () => {
    mockedAdminRepository.listOrganisations.mockResolvedValue([]);
    mockedAdminRepository.countOrganisations.mockResolvedValue(0);

    await listOrganisationsService(context(), paginationInputSchema.parse({}), {
      search: PERSON_NAME,
      status: 'active',
    });

    expect(loggedContext('Organisations listed')).toMatchObject({
      filters: { status: 'active', hasSearch: true },
    });
    expectNoFreeText();
  });

  it('logs whether a location search was made, not what was searched for', async () => {
    const organisationId = randomUUID();
    mockedAdminRepository.listLocations.mockResolvedValue([]);
    mockedAdminRepository.countLocations.mockResolvedValue(0);

    await listLocationsService(context(), paginationInputSchema.parse({}), {
      search: PERSON_NAME,
      organisationId,
    });

    expect(loggedContext('Locations listed')).toMatchObject({
      filters: { organisationId, hasSearch: true },
    });
    expectNoFreeText();
  });
});
