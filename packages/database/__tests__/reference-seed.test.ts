import { eq, inArray, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  assessmentFlows,
  organisations,
  questions,
  templatePhases,
  templateQuestions,
  templateSessions,
} from '../src/schema';
import * as schema from '../src/schema';
import { seedReference } from '../src/seed/reference';
import { FLOW_IDS } from '../src/seed/seedAssessmentFlows';
import { TEMPLATE_IDS } from '../src/seed/seedAssessmentTemplates';
import { PLATFORM_ORGANISATION } from '../src/seed/seedPlatformTenant';
import { QUESTION_IDS } from '../src/seed/seedQuestions';
import { TEMPLATE_PHASE_IDS, TEMPLATE_SESSION_IDS } from '../src/seed/seedTemplateHierarchy';
import { asOrganisation, inRolledBackTransaction, testDbConnectionConfig } from '../src/testing';

type Db = NodePgDatabase<typeof schema>;

const REFERENCE_TABLES = [
  'questions',
  'assessment_templates',
  'template_questions',
  'assessment_flows',
  'flow_steps',
  'programme_templates',
  'template_phases',
  'template_sessions',
];

/** Each reference row's physical location, which any UPDATE changes */
const rowVersions = async (db: Db): Promise<string[]> => {
  const selects = [
    ...REFERENCE_TABLES.map((table) => `SELECT '${table}:' || ctid::text AS version FROM ${table}`),
    `SELECT 'organisations:' || ctid::text FROM organisations WHERE type = 'platform'`,
  ];
  const { rows } = await db.execute<{ version: string }>(
    sql.raw(`${selects.join(' UNION ALL ')} ORDER BY 1`)
  );

  return rows.map((row) => row.version);
};

const forceStates = async (db: Db): Promise<Record<string, boolean>> => {
  const { rows } = await db.execute<{ relname: string; forced: boolean }>(sql`
    SELECT c.relname, c.relforcerowsecurity AS forced
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relrowsecurity
  `);

  return Object.fromEntries(rows.map((row) => [row.relname, row.forced]));
};

const platformSettings = async (db: Db): Promise<unknown> => {
  const rows = await db
    .select({ settings: organisations.settings })
    .from(organisations)
    .where(eq(organisations.id, PLATFORM_ORGANISATION.id));

  return rows.at(0)?.settings;
};

// Runs as the suites' role, which is neither the owner nor BYPASSRLS, so the platform
// organisation is written through its RLS context
describe('Reference seed', () => {
  let pool: Pool;
  let db: Db;
  const statements: string[] = [];

  beforeAll(() => {
    pool = new Pool(testDbConnectionConfig());
    db = drizzle(pool, {
      schema,
      logger: {
        logQuery: (query) => {
          statements.push(query);
        },
      },
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('seeds the catalogue and the platform organisation with the wellness default flow', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      await seedReference(tx);

      const seeded = async (
        table: typeof questions | typeof assessmentFlows | typeof templateSessions,
        ids: string[]
      ): Promise<number> =>
        (await tx.select({ id: table.id }).from(table).where(inArray(table.id, ids))).length;

      expect(await seeded(questions, Object.values(QUESTION_IDS))).toBe(
        Object.keys(QUESTION_IDS).length
      );
      expect(await seeded(assessmentFlows, Object.values(FLOW_IDS))).toBe(1);
      expect(await seeded(templateSessions, Object.values(TEMPLATE_SESSION_IDS))).toBe(
        Object.keys(TEMPLATE_SESSION_IDS).length
      );
      expect(await platformSettings(tx)).toEqual({ defaultAssessmentFlowId: FLOW_IDS.WELLNESS });
    });
  });

  it('writes nothing on a second run', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      await seedReference(tx);
      const before = await rowVersions(tx);

      await seedReference(tx);

      expect(await rowVersions(tx)).toEqual(before);
    });
  });

  it('keeps what an admin changed or removed', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      await seedReference(tx);

      const edited = {
        name: 'Edited',
        description: 'Edited',
        scoringConfig: { dimensions: [], programmeMappings: [] },
      };
      const settings = { defaultAssessmentFlowId: 'chosen-by-admin', theme: 'kept' };

      await tx.update(assessmentFlows).set(edited).where(eq(assessmentFlows.id, FLOW_IDS.WELLNESS));
      await asOrganisation(tx, PLATFORM_ORGANISATION.id, (orgTx) =>
        orgTx
          .update(organisations)
          .set({ settings })
          .where(eq(organisations.id, PLATFORM_ORGANISATION.id))
      );
      await tx
        .delete(templateQuestions)
        .where(eq(templateQuestions.questionId, QUESTION_IDS['safety-check']));
      await tx
        .delete(templateSessions)
        .where(eq(templateSessions.id, TEMPLATE_SESSION_IDS['gentle-mobility-s1-1']));
      await tx
        .delete(templatePhases)
        .where(eq(templatePhases.id, TEMPLATE_PHASE_IDS['gentle-mobility-phase-4']));

      await seedReference(tx);

      const [flow] = await tx
        .select({
          name: assessmentFlows.name,
          description: assessmentFlows.description,
          scoringConfig: assessmentFlows.scoringConfig,
        })
        .from(assessmentFlows)
        .where(eq(assessmentFlows.id, FLOW_IDS.WELLNESS));

      expect(flow).toEqual(edited);
      expect(await platformSettings(tx)).toEqual(settings);
      expect(
        await tx
          .select()
          .from(templateQuestions)
          .where(eq(templateQuestions.templateId, TEMPLATE_IDS.GOALS_AND_SAFETY))
      ).toHaveLength(2);
      expect(
        await tx
          .select()
          .from(templateSessions)
          .where(eq(templateSessions.id, TEMPLATE_SESSION_IDS['gentle-mobility-s1-1']))
      ).toEqual([]);
      expect(
        await tx
          .select()
          .from(templatePhases)
          .where(eq(templatePhases.id, TEMPLATE_PHASE_IDS['gentle-mobility-phase-4']))
      ).toEqual([]);
    });
  });

  it('adds only the default settings an existing platform organisation lacks', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      await asOrganisation(tx, PLATFORM_ORGANISATION.id, (orgTx) =>
        orgTx.insert(organisations).values({
          id: PLATFORM_ORGANISATION.id,
          type: 'platform',
          name: 'Renamed by an admin',
          settings: { theme: 'kept' },
        })
      );

      await seedReference(tx);

      const [platform] = await tx
        .select({ name: organisations.name, settings: organisations.settings })
        .from(organisations)
        .where(eq(organisations.id, PLATFORM_ORGANISATION.id));

      expect(platform).toEqual({
        name: 'Renamed by an admin',
        settings: { theme: 'kept', defaultAssessmentFlowId: FLOW_IDS.WELLNESS },
      });
    });
  });

  it('refuses to create a second platform organisation', async () => {
    const otherId = '0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a';

    await inRolledBackTransaction(db, async (tx) => {
      await asOrganisation(tx, otherId, (orgTx) =>
        orgTx.insert(organisations).values({ id: otherId, type: 'platform', name: 'Another' })
      );

      await expect(seedReference(tx)).rejects.toThrow(/Another platform organisation/);
    });
  });

  it('leaves FORCE RLS as the migration set it, and never toggles it', async () => {
    const before = await forceStates(db);
    statements.length = 0;

    await inRolledBackTransaction(db, async (tx) => {
      await seedReference(tx);

      expect(await forceStates(tx)).toEqual(before);
    });

    // The test profile forces RLS on every table that has it
    expect(Object.values(before).every(Boolean)).toBe(true);
    expect(statements.filter((s) => /FORCE ROW LEVEL SECURITY|row_security/i.test(s))).toEqual([]);
  });
});
