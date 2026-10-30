import { randomUUID } from 'crypto';

import { inArray } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { assessmentFlows } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import * as flowRepository from '../../src/assessments/flow.repository';
import { descendingIds, idsAcrossPages } from '../lib/paging.fixture';

import type { Pool } from 'pg';

// Flows are shared catalogue rows: names carry a per-run marker, which each listing searches
// by, and clean-up deletes only the flows recorded here
const RUN_ID = randomUUID().slice(0, 8);

describe('Flow repository', () => {
  let pool: Pool;
  let db: TestDb;
  let createdFlowIds: string[] = [];

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterEach(async () => {
    if (createdFlowIds.length > 0) {
      await db.delete(assessmentFlows).where(inArray(assessmentFlows.id, createdFlowIds));
    }
    createdFlowIds = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findFlowPage', () => {
    it('falls back to name order for a key the columns only inherit, such as constructor', async () => {
      // The name order runs against the id order, so the id tie-break alone can't pass this
      const [earlier, later] = [randomUUID(), randomUUID()].sort().reverse();

      for (const [id, name] of [
        [later, `Beta flow ${RUN_ID}`],
        [earlier, `Alpha flow ${RUN_ID}`],
      ]) {
        await db.insert(assessmentFlows).values({ id, name });
        createdFlowIds.push(id);
      }

      const listed = await flowRepository.findFlowPage(
        db,
        { page: 1, pageSize: 10, sortBy: 'constructor', sortDirection: 'asc' },
        { search: RUN_ID }
      );

      expect(listed.map((flow) => flow.id)).toEqual([earlier, later]);
    });

    it('lists alphabetically when the request names no sort, whatever direction it sends', async () => {
      // Inserted against the alphabetical order, which also runs against the id order, so neither
      // insertion order nor the id tie-break alone can pass this
      const [higherId, lowerId] = descendingIds(2);

      for (const [id, name] of [
        [lowerId, `Beta flow ${RUN_ID}`],
        [higherId, `Alpha flow ${RUN_ID}`],
      ]) {
        await db.insert(assessmentFlows).values({ id, name });
        createdFlowIds.push(id);
      }

      const listed = await flowRepository.findFlowPage(
        db,
        { page: 1, pageSize: 10, sortDirection: 'desc' },
        { search: RUN_ID }
      );

      expect(listed.map((flow) => flow.id)).toEqual([higherId, lowerId]);
    });

    it('orders flows tied on the default sort by id, so the pages neither repeat nor skip one', async () => {
      const ids = descendingIds(6);

      for (const id of ids) {
        await db.insert(assessmentFlows).values({ id, name: `Tied flow ${RUN_ID}` });
        createdFlowIds.push(id);
      }

      const listed = await idsAcrossPages(3, (page) =>
        flowRepository.findFlowPage(
          db,
          { page, pageSize: 2, sortDirection: 'asc' },
          { search: RUN_ID }
        )
      );

      expect(listed).toEqual([...ids].sort());
    });
  });
});
