/**
 * Template Repository Integration Tests
 *
 * Tests CRUD operations against a real PostgreSQL database (ffp_test).
 * These tests verify that the repository correctly interacts with the database.
 *
 * Note: Assessment templates are system-managed content (no RLS required).
 *
 * Prerequisites:
 * - ffp_test database must exist
 * - Migrations must be run: DB_NAME=ffp_test pnpm --filter=@ffp/database db:migrate
 */

import { randomUUID } from 'crypto';

import { inArray, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import {
  assessmentFlows,
  assessmentTemplates,
  flowSteps,
  questions,
  templateQuestions,
} from '@ffp/database/schema';

import * as templateRepository from '../../src/assessments/template.repository';
import { asOrganisation, deleteOrganisations } from '../lib/rls-context.fixture';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import type { CreateAssessmentTemplateInput } from '../../src/schemas/assessment-template.schema';
import type { Pool } from 'pg';

// Templates and questions are shared, unscoped tables, so every name and slug this
// suite writes carries a per-run marker: listings are searched by it, and clean-up
// deletes only the ids recorded here.
const RUN_ID = randomUUID().slice(0, 8);

describe('Template Repository', () => {
  let pool: Pool;
  let db: TestDb;
  let createdTemplateIds: string[] = [];

  const validCreateInput: CreateAssessmentTemplateInput = {
    name: `Test Assessment Template ${RUN_ID}`,
    description: 'A template for testing',
    version: 1,
    // Note: questions are now stored in the questions table and linked via template_questions
    // Scoring configuration lives at flow level (assessment_flows.scoringConfig), not template level
    isActive: true,
    createdBy: null,
  };

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  /** Creates through the repository and records the id for clean-up. */
  const createTemplate = async (
    input: CreateAssessmentTemplateInput
  ): ReturnType<typeof templateRepository.createTemplate> => {
    const template = await templateRepository.createTemplate(db, input);
    createdTemplateIds.push(template.id);

    return template;
  };

  afterEach(async () => {
    // FK dependency order: flow_steps → template_questions → assessment_templates
    if (createdTemplateIds.length > 0) {
      await db.delete(flowSteps).where(inArray(flowSteps.templateId, createdTemplateIds));
      await db
        .delete(templateQuestions)
        .where(inArray(templateQuestions.templateId, createdTemplateIds));
      await db
        .delete(assessmentTemplates)
        .where(inArray(assessmentTemplates.id, createdTemplateIds));
    }
    createdTemplateIds = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('create', () => {
    it('creates a template and returns it with generated fields', async () => {
      const result = await createTemplate(validCreateInput);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(validCreateInput.name);
      expect(result.description).toBe(validCreateInput.description);
      expect(result.version).toBe(1);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('returns template when found', async () => {
      const created = await createTemplate(validCreateInput);

      const result = await templateRepository.findTemplateById(db, created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(validCreateInput.name);
    });

    it('returns null when not found', async () => {
      const result = await templateRepository.findTemplateById(
        db,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeNull();
    });
  });

  describe('findTemplatePage', () => {
    const firstPage = { page: 1, pageSize: 10, sortDirection: 'asc' as const };

    it('sorts by name by default and filters on status', async () => {
      await createTemplate({ ...validCreateInput, name: `Beta ${RUN_ID}` });
      await createTemplate({ ...validCreateInput, name: `Alpha ${RUN_ID}` });
      await createTemplate({
        ...validCreateInput,
        name: `Retired ${RUN_ID}`,
        isActive: false,
      });

      const all = await templateRepository.findTemplatePage(db, firstPage, { search: RUN_ID });
      const active = await templateRepository.findTemplatePage(db, firstPage, {
        search: RUN_ID,
        isActive: true,
      });

      expect(all.map((template) => template.name)).toEqual([
        `Alpha ${RUN_ID}`,
        `Beta ${RUN_ID}`,
        `Retired ${RUN_ID}`,
      ]);
      expect(active.map((template) => template.name)).toEqual([
        `Alpha ${RUN_ID}`,
        `Beta ${RUN_ID}`,
      ]);
      expect(await templateRepository.countTemplates(db, { search: RUN_ID, isActive: false })).toBe(
        1
      );
    });

    it('searches name and description, treating wildcards literally', async () => {
      const literal = await createTemplate({ ...validCreateInput, name: `100% effort ${RUN_ID}` });
      const other = await createTemplate({ ...validCreateInput, name: `Other ${RUN_ID}` });

      // A wide page, so other templates containing '%' cannot push ours off it
      const result = await templateRepository.findTemplatePage(
        db,
        { ...firstPage, pageSize: 100 },
        { search: '%' }
      );
      const ownIds = new Set([literal.id, other.id]);

      // Other suites' templates may match a literal '%' too; only ours are judged.
      expect(
        result.filter((template) => ownIds.has(template.id)).map((template) => template.name)
      ).toEqual([`100% effort ${RUN_ID}`]);
    });

    it('counts assigned questions and the flows linking the template without multiplying them', async () => {
      const template = await createTemplate(validCreateInput);
      const [first, second] = await db
        .insert(questions)
        .values(
          [`page-count-a-${RUN_ID}`, `page-count-b-${RUN_ID}`].map((slug) => ({
            slug,
            type: 'text' as const,
            questionText: slug,
          }))
        )
        .returning();

      await templateRepository.assignQuestions(db, template.id, [first.id, second.id], 1);

      const [flow] = await db
        .insert(assessmentFlows)
        .values({ name: 'Page count flow' })
        .returning();

      await db.insert(flowSteps).values(
        [1, 2].map((order) => ({
          flowId: flow.id,
          order,
          type: 'questions' as const,
          templateId: template.id,
          config: { title: `Step ${String(order)}` },
        }))
      );

      try {
        const rows = await templateRepository.findTemplatePage(db, firstPage, { search: RUN_ID });

        expect(rows.map((row) => row.id)).toEqual([template.id]);
        const [row] = rows;
        expect(row.questionCount).toBe(2);
        expect(row.flowCount).toBe(1);
      } finally {
        await db.execute(sql`DELETE FROM flow_steps WHERE flow_id = ${flow.id}`);
        await db.execute(sql`DELETE FROM assessment_flows WHERE id = ${flow.id}`);
        await db.execute(sql`DELETE FROM template_questions WHERE template_id = ${template.id}`);
        await db.execute(sql`DELETE FROM questions WHERE id IN (${first.id}, ${second.id})`);
      }
    });
  });

  describe('update', () => {
    it('updates template and increments version', async () => {
      const created = await createTemplate(validCreateInput);

      const result = await templateRepository.updateTemplate(db, created.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.version).toBe(2);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundError when template not found', async () => {
      await expect(
        templateRepository.updateTemplate(db, '550e8400-e29b-41d4-a716-446655440000', {
          name: 'Updated',
        })
      ).rejects.toThrow(
        'Assessment template with id 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false', async () => {
      const created = await createTemplate(validCreateInput);

      await templateRepository.deactivateTemplate(db, created.id);

      const result = await templateRepository.findTemplateById(db, created.id);
      expect(result?.isActive).toBe(false);
    });

    it('throws NotFoundError when template not found', async () => {
      await expect(
        templateRepository.deactivateTemplate(db, '550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow(
        'Assessment template with id 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });
  });
  /**
   * The join lifecycle exercised against the real unique indexes —
   * UNIQUE(template_id, question_id) and UNIQUE(template_id, display_order) —
   * since those constraints are the whole reason reorder and renumber are
   * written the way they are.
   */
  describe('question assignments', () => {
    let createdQuestionIds: string[] = [];

    /** Inserts question bank entries with predictable slugs, returned in creation order. */
    const createQuestions = async (count: number): Promise<{ id: string; slug: string }[]> => {
      const inserted = await db
        .insert(questions)
        .values(
          Array.from({ length: count }, (_, index) => ({
            slug: `tq-test-question-${RUN_ID}-${String(index + 1)}`,
            type: 'single-choice' as const,
            questionText: `How active are you? (${String(index + 1)})`,
          }))
        )
        .returning({ id: questions.id, slug: questions.slug });
      createdQuestionIds.push(...inserted.map((question) => question.id));

      return inserted;
    };

    /**
     * Orders must be cleared before the questions they reference (FK is RESTRICT).
     * Runs before the outer hook, so these templates' orders go first.
     */
    afterEach(async () => {
      if (createdTemplateIds.length > 0) {
        await db
          .delete(templateQuestions)
          .where(inArray(templateQuestions.templateId, createdTemplateIds));
      }
      if (createdQuestionIds.length > 0) {
        await db.delete(questions).where(inArray(questions.id, createdQuestionIds));
      }
      createdQuestionIds = [];
    });

    const assignedOrders = async (templateId: string): Promise<number[]> => {
      const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
        db,
        templateId
      );

      return assignments.map((assignment) => assignment.displayOrder);
    };

    it('appends assignments from the supplied starting order', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(3);

      await templateRepository.assignQuestions(
        db,
        template.id,
        bank.map((question) => question.id),
        1
      );

      expect(await assignedOrders(template.id)).toEqual([1, 2, 3]);
      expect(await templateRepository.findMaxDisplayOrder(db, template.id)).toBe(3);
    });

    it('returns 0 from findMaxDisplayOrder when nothing is assigned', async () => {
      const template = await createTemplate(validCreateInput);

      expect(await templateRepository.findMaxDisplayOrder(db, template.id)).toBe(0);
    });

    it('reverses the order without tripping the unique display order index', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(3);
      const questionIds = bank.map((question) => question.id);

      await templateRepository.assignQuestions(db, template.id, questionIds, 1);

      await templateRepository.reorderTemplateQuestions(
        db,
        template.id,
        [...questionIds].reverse()
      );

      const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
        db,
        template.id
      );

      expect(assignments.map((assignment) => assignment.questionId)).toEqual(
        [...questionIds].reverse()
      );
      expect(assignments.map((assignment) => assignment.displayOrder)).toEqual([1, 2, 3]);
    });

    it('swaps two adjacent assignments, which a direct write would reject', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(2);
      const [first, second] = bank.map((question) => question.id);

      await templateRepository.assignQuestions(db, template.id, [first, second], 1);

      await templateRepository.reorderTemplateQuestions(db, template.id, [second, first]);

      const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
        db,
        template.id
      );

      expect(assignments.map((assignment) => assignment.questionId)).toEqual([second, first]);
      expect(assignments.map((assignment) => assignment.displayOrder)).toEqual([1, 2]);
    });

    it('closes the gap left by unassigning the middle question', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(3);
      const questionIds = bank.map((question) => question.id);

      await templateRepository.assignQuestions(db, template.id, questionIds, 1);

      const unassigned = await templateRepository.unassignQuestion(db, template.id, questionIds[1]);
      await templateRepository.renumberTemplateQuestions(db, template.id);

      expect(unassigned).toBe(true);

      const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
        db,
        template.id
      );

      expect(assignments.map((assignment) => assignment.questionId)).toEqual([
        questionIds[0],
        questionIds[2],
      ]);
      expect(assignments.map((assignment) => assignment.displayOrder)).toEqual([1, 2]);
    });

    it('closes the gap left by unassigning the first question', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(3);
      const questionIds = bank.map((question) => question.id);

      await templateRepository.assignQuestions(db, template.id, questionIds, 1);

      await templateRepository.unassignQuestion(db, template.id, questionIds[0]);
      await templateRepository.renumberTemplateQuestions(db, template.id);

      const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
        db,
        template.id
      );

      expect(assignments.map((assignment) => assignment.questionId)).toEqual([
        questionIds[1],
        questionIds[2],
      ]);
      expect(assignments.map((assignment) => assignment.displayOrder)).toEqual([1, 2]);
    });

    it('reports false when unassigning a question that was never assigned', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(1);

      expect(await templateRepository.unassignQuestion(db, template.id, bank[0].id)).toBe(false);
    });

    it('offers the whole active bank when the template has no assignments', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(2);

      const assignable = await templateRepository.findAssignableQuestions(db, template.id);
      const bankIds = new Set(bank.map((question) => question.id));

      // The bank is shared; questions other suites hold are not judged here.
      expect(
        assignable
          .map((question) => question.id)
          .filter((id) => bankIds.has(id))
          .sort()
      ).toEqual([...bankIds].sort());
    });

    it('excludes already-assigned and inactive questions from the assignable pool', async () => {
      const template = await createTemplate(validCreateInput);
      const bank = await createQuestions(3);
      const [assigned, inactive, available] = bank.map((question) => question.id);

      await templateRepository.assignQuestions(db, template.id, [assigned], 1);
      await db.execute(sql`UPDATE questions SET is_active = false WHERE id = ${inactive}`);

      const assignable = await templateRepository.findAssignableQuestions(db, template.id);
      const bankIds = new Set(bank.map((question) => question.id));

      expect(assignable.map((question) => question.id).filter((id) => bankIds.has(id))).toEqual([
        available,
      ]);
    });

    describe('createDuplicateTemplate', () => {
      // created_by references users, so the copying admin is a real user in a test organisation
      let organisationId: string;
      let adminUserId: string;

      beforeEach(async () => {
        organisationId = randomUUID();
        adminUserId = randomUUID();

        await asOrganisation(db, organisationId, async (tx) => {
          await tx.execute(sql`
            INSERT INTO organisations (id, public_id, type, name, settings)
            VALUES (${organisationId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, 'individual', ${`Template Organisation [${RUN_ID}]`}, '{}')
          `);
          await tx.execute(sql`
            INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
            VALUES (${adminUserId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationId}, NULL, ${`template-${adminUserId.slice(0, 8)}@test.com`}, ${`cognito-${adminUserId.slice(0, 8)}`}, 'Tess', 'Template', 'system_admin')
          `);
        });
      });

      afterEach(async () => {
        await deleteOrganisations(db, [organisationId]);
      });

      it('creates an inactive version 1 copy holding every question assignment in order, leaving the source untouched', async () => {
        const source = await createTemplate({
          ...validCreateInput,
          description: 'The template being copied',
        });
        await templateRepository.updateTemplate(db, source.id, { name: `Source ${RUN_ID}` });
        const bank = await createQuestions(3);
        await templateRepository.assignQuestions(
          db,
          source.id,
          bank.map((question) => question.id),
          1
        );
        await db.execute(sql`
          UPDATE template_questions SET config_overrides = ${JSON.stringify({ questionText: 'Reworded' })}::jsonb
          WHERE template_id = ${source.id} AND question_id = ${bank[1].id}
        `);
        const sourceBefore = await templateRepository.findTemplateById(db, source.id);
        const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
          db,
          source.id
        );

        const copyId = await templateRepository.createDuplicateTemplate(
          db,
          adminUserId,
          `Copy ${RUN_ID}`,
          source,
          assignments
        );
        createdTemplateIds.push(copyId);

        expect(await templateRepository.findTemplateById(db, copyId)).toMatchObject({
          name: `Copy ${RUN_ID}`,
          description: 'The template being copied',
          version: 1,
          isActive: false,
          createdBy: adminUserId,
        });
        expect(assignments).toEqual([
          { questionId: bank[0].id, displayOrder: 1, configOverrides: null },
          {
            questionId: bank[1].id,
            displayOrder: 2,
            configOverrides: { questionText: 'Reworded' },
          },
          { questionId: bank[2].id, displayOrder: 3, configOverrides: null },
        ]);
        expect(await templateRepository.findQuestionAssignmentsByTemplateId(db, copyId)).toEqual(
          assignments
        );
        expect(await templateRepository.findTemplateById(db, source.id)).toEqual(sourceBefore);
        expect(await templateRepository.findQuestionAssignmentsByTemplateId(db, source.id)).toEqual(
          assignments
        );
      });
    });
  });
});
