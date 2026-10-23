import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type * as ffpDatabase from '@ffp/database';
import { assessmentFlows, programmeTemplates, templatePhases } from '@ffp/database/schema';
import type { ScoringConfig } from '@ffp/database/types';

import { ConflictError } from '../../src/lib/errors';
import * as templateService from '../../src/programme-templates/programme-template.service';
import { createPhase } from '../../src/programme-templates/template-phase.service';
import {
  createSession,
  deleteSession,
} from '../../src/programme-templates/template-session.service';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';
import { inRolledBackTransaction, shortId, type TestTx } from '../tags/tag-fixture';

import { insertTemplateWithSession, readTemplate, type TemplateFixture } from './template-fixture';

import type { Pool } from 'pg';

// The services read through getDb, pointed at each test's rolled-back transaction
const serviceDb = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof ffpDatabase>()),
  getDb: () => serviceDb.current,
}));

const recommending = (slug: string): ScoringConfig => ({
  dimensions: [],
  programmeMappings: [{ conditions: [], programmeTemplateId: slug }],
});

describe('Programme template integrity', () => {
  let pool: Pool;
  let db: TestDb;

  const run = (work: (tx: TestTx, fixture: TemplateFixture) => Promise<void>): Promise<void> =>
    inRolledBackTransaction(db, async (tx) => {
      serviceDb.current = tx;
      await work(tx, await insertTemplateWithSession(tx));
    });

  const insertFlow = (
    tx: TestTx,
    scoringConfig: ScoringConfig,
    isActive = true
  ): Promise<unknown> =>
    tx.insert(assessmentFlows).values({ name: `Guard test ${shortId()}`, scoringConfig, isActive });

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('a template a flow recommends', () => {
    it('refuses a slug change with a 409 and writes nothing', async () => {
      await run(async (tx, { template }) => {
        await insertFlow(tx, recommending(template.slug), false);

        await expect(
          templateService.updateTemplate(template.id, { slug: `${template.slug}-renamed` })
        ).rejects.toBeInstanceOf(ConflictError);
        expect((await readTemplate(tx, template.id)).slug).toBe(template.slug);
      });
    });

    it('refuses deactivation through either route with a 409', async () => {
      await run(async (tx, { template }) => {
        await insertFlow(tx, recommending(template.slug));

        await expect(templateService.deactivateTemplate(template.id)).rejects.toBeInstanceOf(
          ConflictError
        );
        await expect(
          templateService.updateTemplate(template.id, { isActive: false })
        ).rejects.toBeInstanceOf(ConflictError);
        expect((await readTemplate(tx, template.id)).isActive).toBe(true);
      });
    });

    it('lets a template that is already inactive be deactivated again', async () => {
      await run(async (tx, { template }) => {
        await tx
          .update(programmeTemplates)
          .set({ isActive: false })
          .where(eq(programmeTemplates.id, template.id));
        await insertFlow(tx, recommending(template.slug));

        const read = await templateService.deactivateTemplate(template.id);

        expect(read.isActive).toBe(false);
      });
    });

    it('still takes other edits, and a re-sent unchanged slug', async () => {
      await run(async (tx, { template }) => {
        await insertFlow(tx, recommending(template.slug));

        const updated = await templateService.updateTemplate(template.id, {
          slug: template.slug,
          name: 'Renamed shell',
        });

        expect(updated).toMatchObject({ slug: template.slug, name: 'Renamed shell' });
      });
    });
  });

  describe('a template no flow recommends', () => {
    it('allows a slug change and deactivation', async () => {
      await run(async (tx, { template }) => {
        await insertFlow(tx, recommending(`${template.slug}-other`));

        await templateService.updateTemplate(template.id, { slug: `${template.slug}-renamed` });
        await templateService.deactivateTemplate(template.id);

        expect(await readTemplate(tx, template.id)).toMatchObject({
          slug: `${template.slug}-renamed`,
          isActive: false,
        });
      });
    });
  });

  describe('phase session count', () => {
    it('counts the sessions of a new phase from zero', async () => {
      await run(async (tx, { template }) => {
        const phase = await createPhase(template.id, {});
        await createSession(phase.id, {});
        await createSession(phase.id, {});

        const [stored] = await tx
          .select()
          .from(templatePhases)
          .where(eq(templatePhases.id, phase.id));

        expect(phase.sessionCount).toBe(0);
        expect(stored.sessionCount).toBe(2);
      });
    });

    it('still reads a template whose phase has lost its only session', async () => {
      await run(async (_tx, { template, session }) => {
        await deleteSession(session.id);

        const read = await templateService.getTemplate(template.publicId);

        expect(read.phases[0]).toMatchObject({ sessionCount: 0, sessions: [] });
      });
    });
  });
});
