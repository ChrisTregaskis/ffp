import { randomUUID } from 'crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { organisations, users } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import * as adminUserRepository from '../../src/admin/admin-user.repository';
import { descendingIds, idsAcrossPages, minutesApart } from '../lib/paging.fixture';

import { inRolledBackAdminTransaction } from './admin-context.fixture';

import type { Pool } from 'pg';

// Every row is written under the admin context the list service uses and rolled back, and
// every surname carries this run's marker, which each listing searches by
const RUN_ID = randomUUID().slice(0, 8);

describe('Admin user repository', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  const withOrganisation = (
    work: (tx: TestDb, organisationId: string) => Promise<void>
  ): Promise<void> =>
    inRolledBackAdminTransaction(db, async (tx) => {
      const [organisation] = await tx
        .insert(organisations)
        .values({ type: 'business', name: `Users list ${RUN_ID}` })
        .returning({ id: organisations.id });
      await work(tx, organisation.id);
    });

  const insertUser = async (
    tx: TestDb,
    organisationId: string,
    values: { id?: string; lastName: string; createdAt?: Date }
  ): Promise<string> => {
    const unique = randomUUID();
    const [user] = await tx
      .insert(users)
      .values({
        organisationId,
        email: `list-${unique}@example.com`,
        cognitoSub: `list-${unique}`,
        firstName: 'Listed',
        role: 'programme_user',
        ...values,
      })
      .returning({ id: users.id });

    return user.id;
  };

  describe('listUsers', () => {
    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      await withOrganisation(async (tx, organisationId) => {
        const ids = descendingIds(6);

        for (const id of ids) {
          await insertUser(tx, organisationId, { id, lastName: `Tied ${RUN_ID}` });
        }

        const listed = await idsAcrossPages(3, (page) =>
          adminUserRepository.listUsers(
            tx,
            { page, pageSize: 2, sortBy: 'lastName', sortDirection: 'asc' },
            { search: RUN_ID }
          )
        );

        expect(listed).toEqual([...ids].sort());
      });
    });

    it('lists the newest first when the request names no sort', async () => {
      await withOrganisation(async (tx, organisationId) => {
        const ids: string[] = [];

        for (const createdAt of minutesApart(3)) {
          ids.push(
            await insertUser(tx, organisationId, { lastName: `Dated ${RUN_ID}`, createdAt })
          );
        }

        const listed = await adminUserRepository.listUsers(
          tx,
          { page: 1, pageSize: 10, sortDirection: 'asc' },
          { search: RUN_ID }
        );

        expect(listed.map((user) => user.id)).toEqual([...ids].reverse());
      });
    });
  });
});
