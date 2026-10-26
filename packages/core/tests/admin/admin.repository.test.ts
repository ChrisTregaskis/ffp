import { randomUUID } from 'crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { locations, organisations } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import * as adminRepository from '../../src/admin/admin.repository';
import { descendingIds, idsAcrossPages, minutesApart } from '../lib/paging.fixture';

import { inRolledBackAdminTransaction } from './admin-context.fixture';

import type { Pool } from 'pg';

// Every row is written under the admin context the list services use and rolled back, and
// every name carries this run's marker, which each listing searches by
const RUN_ID = randomUUID().slice(0, 8);

describe('Admin repository', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  const asAdmin = (work: (tx: TestDb) => Promise<void>): Promise<void> =>
    inRolledBackAdminTransaction(db, work);

  const insertOrganisation = async (
    tx: TestDb,
    values: { id?: string; name: string; createdAt?: Date }
  ): Promise<string> => {
    const [organisation] = await tx
      .insert(organisations)
      .values({ type: 'business', ...values })
      .returning({ id: organisations.id });

    return organisation.id;
  };

  describe('listOrganisations', () => {
    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      await asAdmin(async (tx) => {
        const ids = descendingIds(6);

        for (const id of ids) {
          await insertOrganisation(tx, { id, name: `Tied organisation ${RUN_ID}` });
        }

        const listed = await idsAcrossPages(3, (page) =>
          adminRepository.listOrganisations(
            tx,
            { page, pageSize: 2, sortBy: 'name', sortDirection: 'asc' },
            { search: RUN_ID }
          )
        );

        expect(listed).toEqual([...ids].sort());
      });
    });

    it('lists the newest first when the request names no sort', async () => {
      await asAdmin(async (tx) => {
        const ids: string[] = [];

        for (const [index, createdAt] of minutesApart(3).entries()) {
          ids.push(
            await insertOrganisation(tx, {
              name: `Dated organisation ${RUN_ID} ${String(index)}`,
              createdAt,
            })
          );
        }

        const listed = await adminRepository.listOrganisations(
          tx,
          { page: 1, pageSize: 10, sortDirection: 'asc' },
          { search: RUN_ID }
        );

        expect(listed.map((organisation) => organisation.id)).toEqual([...ids].reverse());
      });
    });
  });

  describe('listLocations', () => {
    const insertLocation = async (
      tx: TestDb,
      organisationId: string,
      values: { id?: string; name: string; createdAt?: Date }
    ): Promise<string> => {
      const [location] = await tx
        .insert(locations)
        .values({ organisationId, accountCode: `LOC-${randomUUID()}`, ...values })
        .returning({ id: locations.id });

      return location.id;
    };

    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      await asAdmin(async (tx) => {
        const organisationId = await insertOrganisation(tx, { name: `Owner ${RUN_ID}` });
        const ids = descendingIds(6);

        for (const id of ids) {
          await insertLocation(tx, organisationId, { id, name: `Tied location ${RUN_ID}` });
        }

        const listed = await idsAcrossPages(3, (page) =>
          adminRepository.listLocations(
            tx,
            { page, pageSize: 2, sortBy: 'name', sortDirection: 'asc' },
            { search: RUN_ID }
          )
        );

        expect(listed).toEqual([...ids].sort());
      });
    });

    it('lists the newest first when the request names no sort', async () => {
      await asAdmin(async (tx) => {
        const organisationId = await insertOrganisation(tx, { name: `Owner ${RUN_ID}` });
        const ids: string[] = [];

        for (const [index, createdAt] of minutesApart(3).entries()) {
          ids.push(
            await insertLocation(tx, organisationId, {
              name: `Dated location ${RUN_ID} ${String(index)}`,
              createdAt,
            })
          );
        }

        const listed = await adminRepository.listLocations(
          tx,
          { page: 1, pageSize: 10, sortDirection: 'asc' },
          { search: RUN_ID }
        );

        expect(listed.map((location) => location.id)).toEqual([...ids].reverse());
      });
    });
  });
});
