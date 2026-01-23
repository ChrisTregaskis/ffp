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
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

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
      const result = await templateRepository.create(db, validCreateInput);

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
      const created = await templateRepository.create(db, validCreateInput);

      const result = await templateRepository.findById(db, created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(validCreateInput.name);
    });

    it('returns null when not found', async () => {
      const result = await templateRepository.findById(db, '550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all templates', async () => {
      await templateRepository.create(db, validCreateInput);
      await templateRepository.create(db, { ...validCreateInput, name: 'Second Template' });

      const result = await templateRepository.findAll(db);

      expect(result).toHaveLength(2);
    });

    it('filters to active only when activeOnly is true', async () => {
      const active = await templateRepository.create(db, validCreateInput);
      await templateRepository.create(db, {
        ...validCreateInput,
        name: 'Inactive',
        isActive: false,
      });

      const result = await templateRepository.findAll(db, { activeOnly: true });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(active.id);
    });
  });

  describe('update', () => {
    it('updates template and increments version', async () => {
      const created = await templateRepository.create(db, validCreateInput);

      const result = await templateRepository.update(db, created.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.version).toBe(2);
      // Use >= because create and update can occur within the same millisecond
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('throws NotFoundError when template not found', async () => {
      await expect(
        templateRepository.update(db, '550e8400-e29b-41d4-a716-446655440000', {
          name: 'Updated',
        })
      ).rejects.toThrow(
        'Assessment template with id 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false', async () => {
      const created = await templateRepository.create(db, validCreateInput);

      await templateRepository.deactivate(db, created.id);

      const result = await templateRepository.findById(db, created.id);
      expect(result?.isActive).toBe(false);
    });

    it('throws NotFoundError when template not found', async () => {
      await expect(
        templateRepository.deactivate(db, '550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow(
        'Assessment template with id 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });
  });
});
