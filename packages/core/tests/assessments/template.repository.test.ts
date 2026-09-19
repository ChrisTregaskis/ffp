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

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { questions } from '@ffp/database/schema';

import * as templateRepository from '../../src/assessments/template.repository';

import type { CreateAssessmentTemplateInput } from '../../src/schemas/assessment-template.schema';

describe('Template Repository', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  const validCreateInput: CreateAssessmentTemplateInput = {
    name: 'Test Assessment Template',
    description: 'A template for testing',
    version: 1,
    // Note: questions are now stored in the questions table and linked via template_questions
    // Scoring configuration lives at flow level (assessment_flows.scoringConfig), not template level
    isActive: true,
    createdBy: null,
  };

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool);
  });

  beforeEach(async () => {
    // Clean up tables before each test
    // Delete in FK dependency order: flow_steps → template_questions → assessment_templates
    await db.execute(sql`DELETE FROM flow_steps`);
    await db.execute(sql`DELETE FROM template_questions`);
    await db.execute(sql`DELETE FROM assessment_templates`);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('create', () => {
    it('creates a template and returns it with generated fields', async () => {
      const result = await templateRepository.createTemplate(db, validCreateInput);

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
      const created = await templateRepository.createTemplate(db, validCreateInput);

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

  describe('findAll', () => {
    it('returns all templates', async () => {
      await templateRepository.createTemplate(db, validCreateInput);
      await templateRepository.createTemplate(db, { ...validCreateInput, name: 'Second Template' });

      const result = await templateRepository.findAllTemplates(db);

      expect(result).toHaveLength(2);
    });

    it('filters to active only when activeOnly is true', async () => {
      const active = await templateRepository.createTemplate(db, validCreateInput);
      await templateRepository.createTemplate(db, {
        ...validCreateInput,
        name: 'Inactive',
        isActive: false,
      });

      const result = await templateRepository.findAllTemplates(db, { activeOnly: true });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(active.id);
    });
  });

  describe('update', () => {
    it('updates template and increments version', async () => {
      const created = await templateRepository.createTemplate(db, validCreateInput);

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
      const created = await templateRepository.createTemplate(db, validCreateInput);

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
    /** Inserts question bank entries with predictable slugs, returned in creation order. */
    const createQuestions = async (count: number): Promise<{ id: string; slug: string }[]> => {
      const inserted = await db
        .insert(questions)
        .values(
          Array.from({ length: count }, (_, index) => ({
            slug: `tq-test-question-${String(index + 1)}`,
            type: 'single-choice' as const,
            questionText: `How active are you? (${String(index + 1)})`,
          }))
        )
        .returning({ id: questions.id, slug: questions.slug });

      return inserted;
    };

    /** Orders must be cleared before the questions they reference (FK is RESTRICT). */
    afterEach(async () => {
      await db.execute(sql`DELETE FROM template_questions`);
      await db.execute(sql`DELETE FROM questions WHERE slug LIKE 'tq-test-%'`);
    });

    const assignedOrders = async (templateId: string): Promise<number[]> => {
      const assignments = await templateRepository.findQuestionAssignmentsByTemplateId(
        db,
        templateId
      );

      return assignments.map((assignment) => assignment.displayOrder);
    };

    it('appends assignments from the supplied starting order', async () => {
      const template = await templateRepository.createTemplate(db, validCreateInput);
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
      const template = await templateRepository.createTemplate(db, validCreateInput);

      expect(await templateRepository.findMaxDisplayOrder(db, template.id)).toBe(0);
    });

    it('reverses the order without tripping the unique display order index', async () => {
      const template = await templateRepository.createTemplate(db, validCreateInput);
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
      const template = await templateRepository.createTemplate(db, validCreateInput);
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
      const template = await templateRepository.createTemplate(db, validCreateInput);
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
      const template = await templateRepository.createTemplate(db, validCreateInput);
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
      const template = await templateRepository.createTemplate(db, validCreateInput);
      const bank = await createQuestions(1);

      expect(await templateRepository.unassignQuestion(db, template.id, bank[0].id)).toBe(false);
    });

    it('offers the whole active bank when the template has no assignments', async () => {
      const template = await templateRepository.createTemplate(db, validCreateInput);
      const bank = await createQuestions(2);

      const assignable = await templateRepository.findAssignableQuestions(db, template.id);

      expect(assignable.map((question) => question.id).sort()).toEqual(
        bank.map((question) => question.id).sort()
      );
    });

    it('excludes already-assigned and inactive questions from the assignable pool', async () => {
      const template = await templateRepository.createTemplate(db, validCreateInput);
      const bank = await createQuestions(3);
      const [assigned, inactive, available] = bank.map((question) => question.id);

      await templateRepository.assignQuestions(db, template.id, [assigned], 1);
      await db.execute(sql`UPDATE questions SET is_active = false WHERE id = ${inactive}`);

      const assignable = await templateRepository.findAssignableQuestions(db, template.id);

      expect(assignable.map((question) => question.id)).toEqual([available]);
    });
  });
});
