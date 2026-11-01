import { randomUUID } from 'crypto';

import { eq, inArray, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import {
  assessmentFlows,
  assessmentSafetyTriggers,
  organisations,
  programmePhases,
  programmeTemplates,
  programmes,
  templatePhases,
  templateSessions,
  userAssessments,
  userSessions,
  users,
} from '../src/schema';
import { asOrganisation, connectTestDb, deleteOrganisations, type TestDb } from '../src/testing';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';

// Every link from one organisation-scoped row to another carries organisation_id, so a
// row can only point at a parent in its own organisation. The foreign key is checked
// without RLS, so the policies alone cannot refuse a parent from another organisation.
describe('Tenant foreign keys', () => {
  let pool: Pool;
  let db: TestDb;

  let runId: string;
  let organisationAId: string;
  let organisationBId: string;
  let userBId: string;
  let assessmentAId: string;
  let assessmentBId: string;
  let programmeAId: string;
  let successorAId: string;
  let phaseAId: string;
  let flowId: string;
  let programmeTemplateId: string;
  let templateSessionId: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    runId = randomUUID().slice(0, 8);
    organisationAId = randomUUID();
    organisationBId = randomUUID();

    // Shared catalogue rows, marked with this run's id and deleted by id afterwards
    const [flow] = await db
      .insert(assessmentFlows)
      .values({ name: `Tenant key flow ${runId}` })
      .returning();
    flowId = flow.id;
    const [template] = await db
      .insert(programmeTemplates)
      .values({ slug: `tenant-key-${runId}`, name: `Tenant key template ${runId}` })
      .returning();
    programmeTemplateId = template.id;
    const [templatePhase] = await db
      .insert(templatePhases)
      .values({ programmeTemplateId, phaseNumber: 1 })
      .returning();
    const [templateSession] = await db
      .insert(templateSessions)
      .values({ templatePhaseId: templatePhase.id, sessionNumber: 1 })
      .returning();
    templateSessionId = templateSession.id;

    const seedMember = async (
      tx: NodePgDatabase<Record<string, unknown>>,
      organisationId: string,
      label: string
    ): Promise<{ userId: string; assessmentId: string }> => {
      await tx
        .insert(organisations)
        .values({ id: organisationId, type: 'individual', name: `Tenant key ${label} ${runId}` });
      const [user] = await tx
        .insert(users)
        .values({
          organisationId,
          email: `tenant-key-${label}-${runId}@test.com`,
          cognitoSub: `tenant-key-${label}-${runId}`,
          firstName: label,
          lastName: 'Member',
          role: 'programme_user',
        })
        .returning();
      const [assessment] = await tx
        .insert(userAssessments)
        .values({ organisationId, userId: user.id, flowId })
        .returning();

      return { userId: user.id, assessmentId: assessment.id };
    };

    await asOrganisation(db, organisationAId, async (tx) => {
      const member = await seedMember(tx, organisationAId, 'a');
      assessmentAId = member.assessmentId;

      const programmeValues = {
        organisationId: organisationAId,
        userId: member.userId,
        programmeTemplateId,
        name: `Tenant key programme ${runId}`,
      };
      const [programme] = await tx.insert(programmes).values(programmeValues).returning();
      programmeAId = programme.id;
      const [successor] = await tx
        .insert(programmes)
        .values({ ...programmeValues, replacedByProgrammeId: programmeAId })
        .returning();
      successorAId = successor.id;
      await tx
        .update(userAssessments)
        .set({ programmeId: programmeAId })
        .where(eq(userAssessments.id, assessmentAId));

      const [phase] = await tx
        .insert(programmePhases)
        .values({
          organisationId: organisationAId,
          programmeId: programmeAId,
          templatePhaseId: templatePhase.id,
          phaseNumber: 1,
        })
        .returning();
      phaseAId = phase.id;
    });

    await asOrganisation(db, organisationBId, async (tx) => {
      const member = await seedMember(tx, organisationBId, 'b');
      userBId = member.userId;
      assessmentBId = member.assessmentId;
    });
  });

  afterEach(async () => {
    // The organisations take their members' rows with them (ON DELETE CASCADE); the
    // catalogue rows they pointed at (RESTRICT) go after. B goes first, so a row a failing
    // case let B attach to A's parent cannot hold A's delete back.
    await deleteOrganisations(db, [organisationBId, organisationAId]);
    await db.delete(programmeTemplates).where(eq(programmeTemplates.id, programmeTemplateId));
    await db.delete(assessmentFlows).where(eq(assessmentFlows.id, flowId));
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('under another organisation', () => {
    it('cannot record a safety trigger against organisation A’s assessment', async () => {
      await expect(
        asOrganisation(db, organisationBId, (tx) =>
          tx.insert(assessmentSafetyTriggers).values({
            organisationId: organisationBId,
            userAssessmentId: assessmentAId,
            userId: userBId,
            selectedOptions: [],
            warningMessage: 'Speak to a health professional first',
          })
        )
      ).rejects.toMatchObject({
        cause: {
          code: '23503',
          constraint: 'assessment_safety_triggers_user_assessment_id_organisation_fk',
        },
      });
    });

    it('cannot add a session to organisation A’s programme phase', async () => {
      await expect(
        asOrganisation(db, organisationBId, (tx) =>
          tx.insert(userSessions).values({
            organisationId: organisationBId,
            programmePhaseId: phaseAId,
            templateSessionId,
            sessionNumber: 1,
          })
        )
      ).rejects.toMatchObject({
        cause: { code: '23503', constraint: 'user_sessions_programme_phase_id_organisation_fk' },
      });
    });

    it('cannot link its own assessment to organisation A’s programme', async () => {
      await expect(
        asOrganisation(db, organisationBId, (tx) =>
          tx
            .update(userAssessments)
            .set({ programmeId: programmeAId })
            .where(eq(userAssessments.id, assessmentBId))
        )
      ).rejects.toMatchObject({
        cause: { code: '23503', constraint: 'user_assessments_programme_id_organisation_fk' },
      });
    });
  });

  it('clears the optional links to a deleted programme and keeps the rows that held them', async () => {
    const kept = await asOrganisation(db, organisationAId, async (tx) => {
      await tx.delete(programmes).where(eq(programmes.id, programmeAId));

      return {
        assessments: await tx
          .select({
            organisationId: userAssessments.organisationId,
            programmeId: userAssessments.programmeId,
          })
          .from(userAssessments)
          .where(eq(userAssessments.id, assessmentAId)),
        programmes: await tx
          .select({
            organisationId: programmes.organisationId,
            replacedByProgrammeId: programmes.replacedByProgrammeId,
          })
          .from(programmes)
          .where(inArray(programmes.id, [programmeAId, successorAId])),
      };
    });

    expect(kept).toEqual({
      assessments: [{ organisationId: organisationAId, programmeId: null }],
      programmes: [{ organisationId: organisationAId, replacedByProgrammeId: null }],
    });
  });

  it('pairs organisation_id on both sides of every foreign key between organisation-scoped tables', async () => {
    const catalogue = await db.execute(sql`
      SELECT c.conname AS name,
             child.relname AS child_table,
             ARRAY(
               SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
               ORDER BY k.ord
             )::text[] AS child_columns,
             ARRAY(
               SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY AS k(attnum, ord)
               JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum
               ORDER BY k.ord
             )::text[] AS parent_columns
      FROM pg_constraint c
      JOIN pg_class child ON child.oid = c.conrelid
      JOIN pg_class parent ON parent.oid = c.confrelid
      JOIN pg_namespace n ON n.oid = child.relnamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND child.relrowsecurity
        AND parent.relrowsecurity
        AND parent.relname <> 'organisations'
      ORDER BY c.conname
    `);
    const links = catalogue.rows as {
      name: string;
      child_table: string;
      child_columns: string[];
      parent_columns: string[];
    }[];

    expect(links.map((link) => link.child_table)).toContain('user_assessment_answers');
    expect(
      links
        .filter((link) => {
          const position = link.child_columns.indexOf('organisation_id');
          return position === -1 || link.parent_columns[position] !== 'organisation_id';
        })
        .map((link) => link.name)
    ).toEqual([]);
  });
});
