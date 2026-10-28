import { randomUUID } from 'crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { programmeTemplates } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import * as templateRepository from '../../src/programme-templates/programme-template.repository';
import { descendingIds, idsAcrossPages, minutesApart } from '../lib/paging.fixture';
import { inRolledBackTransaction, type TestTx } from '../tags/tag-fixture';

import type { Pool } from 'pg';

// Rolled back, and every name carries this run's marker, which each listing searches by
const RUN_ID = randomUUID().slice(0, 8);

describe('Programme template repository', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  const insertTemplate = async (
    tx: TestTx,
    values: { id?: string; name: string; createdAt?: Date }
  ): Promise<string> => {
    const [template] = await tx
      .insert(programmeTemplates)
      .values({ slug: `list-${randomUUID()}`, ...values })
      .returning({ id: programmeTemplates.id });

    return template.id;
  };

  describe('findAllTemplates', () => {
    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const ids = descendingIds(6);

        for (const id of ids) {
          await insertTemplate(tx, { id, name: `Tied template ${RUN_ID}` });
        }

        const listed = await idsAcrossPages(3, (page) =>
          templateRepository.findAllTemplates(
            tx,
            { page, pageSize: 2, sortBy: 'name', sortDirection: 'asc' },
            { search: RUN_ID }
          )
        );

        expect(listed).toEqual([...ids].sort());
      });
    });

    it('lists the newest first when the request names no sort', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const ids: string[] = [];

        for (const createdAt of minutesApart(3)) {
          ids.push(await insertTemplate(tx, { name: `Dated template ${RUN_ID}`, createdAt }));
        }

        const listed = await templateRepository.findAllTemplates(
          tx,
          { page: 1, pageSize: 10, sortDirection: 'asc' },
          { search: RUN_ID }
        );

        expect(listed.map((template) => template.id)).toEqual([...ids].reverse());
      });
    });

    describe('a search holding a LIKE wildcard or escape character matches it literally', () => {
      it.each([
        { search: '50%', literal: '50% strength', lookalike: '500 strength' },
        { search: 'warm_up', literal: 'warm_up block', lookalike: 'warm-up block' },
        { search: 'back\\slash', literal: 'back\\slash block', lookalike: 'backslash block' },
      ])('$search', async ({ search, literal, lookalike }) => {
        await inRolledBackTransaction(db, async (tx) => {
          const match = await insertTemplate(tx, { name: `${literal} ${RUN_ID}` });
          const nonMatch = await insertTemplate(tx, { name: `${lookalike} ${RUN_ID}` });

          const listed = await templateRepository.findAllTemplates(
            tx,
            { page: 1, pageSize: 100, sortDirection: 'asc' },
            { search }
          );

          const ours = listed
            .map((template) => template.id)
            .filter((id) => [match, nonMatch].includes(id));
          expect(ours).toEqual([match]);
        });
      });
    });
  });
});
