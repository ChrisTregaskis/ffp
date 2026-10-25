import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { assessmentFlows, assessmentTemplates, flowSteps } from '@ffp/database/schema';

import * as flowStepRepository from '../../src/assessments/flow-step.repository';
import * as flowStepService from '../../src/assessments/flow-step.service';
import { updateFlowStepSchema } from '../../src/schemas/assessment-flow.schema';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { Pool } from 'pg';

// Flows, steps and templates are shared catalogue tables: names carry a per-run marker, and
// clean-up deletes only this test's flow (its steps cascade) and template
const RUN_ID = randomUUID().slice(0, 8);

describe('Flow Step Repository', () => {
  let pool: Pool;
  let db: TestDb;
  let flowId: string;
  let flowPublicId: string;
  let templateId: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    const [template] = await db
      .insert(assessmentTemplates)
      .values({ name: `Step template [${RUN_ID}]` })
      .returning({ id: assessmentTemplates.id });
    templateId = template.id;

    const [flow] = await db
      .insert(assessmentFlows)
      .values({ name: `Step flow [${RUN_ID}]` })
      .returning({ id: assessmentFlows.id, publicId: assessmentFlows.publicId });
    flowId = flow.id;
    flowPublicId = flow.publicId;
  });

  afterEach(async () => {
    // Steps cascade with their flow; the template (RESTRICT from steps) goes after
    await db.delete(assessmentFlows).where(eq(assessmentFlows.id, flowId));
    await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, templateId));
  });

  afterAll(async () => {
    await pool.end();
  });

  const insertStep = async (
    values: Omit<typeof flowSteps.$inferInsert, 'flowId'>
  ): Promise<typeof flowSteps.$inferSelect> => {
    const [step] = await db
      .insert(flowSteps)
      .values({ flowId, ...values })
      .returning();

    return step;
  };

  const storedStep = async (stepId: string): Promise<typeof flowSteps.$inferSelect> => {
    const [step] = await db.select().from(flowSteps).where(eq(flowSteps.id, stepId));

    return step;
  };

  describe('updateStep', () => {
    it('keeps every field the update omits, branching included', async () => {
      const next = await insertStep({ order: 2, type: 'results', config: { title: 'Results' } });
      const step = await insertStep({
        order: 1,
        type: 'questions',
        templateId,
        config: { title: 'Original', description: 'Kept' },
        defaultNextStepId: next.id,
        nextStepRules: [
          { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId: next.id } },
        ],
      });

      await flowStepRepository.updateStep(
        db,
        step.id,
        updateFlowStepSchema.parse({ config: { title: 'Renamed' } })
      );

      expect(await storedStep(step.id)).toEqual({
        ...step,
        config: { title: 'Renamed' },
        updatedAt: expect.any(Date) as unknown,
      });
    });

    it('clears the template link on an explicit null', async () => {
      const step = await insertStep({
        order: 1,
        type: 'intro',
        templateId,
        config: { title: 'Welcome' },
      });

      await flowStepRepository.updateStep(
        db,
        step.id,
        updateFlowStepSchema.parse({ templateId: null })
      );

      expect(await storedStep(step.id)).toMatchObject({
        type: 'intro',
        templateId: null,
        config: { title: 'Welcome' },
      });
    });
  });

  describe('deleting a step another step points at', () => {
    const context: OrganisationContext = {
      actor: {
        type: 'user',
        userId: randomUUID(),
        userRole: 'system_admin',
        email: 'admin@example.com',
      } as UserActor,
      organisationId: randomUUID(),
      locationId: randomUUID(),
      requestId: randomUUID(),
      timestamp: new Date(),
    };

    const deleteStep = (step: { publicId: string }): Promise<void> =>
      flowStepService.deleteStepService(context, flowPublicId, step.publicId);

    it('refuses with a 409 while another step leads to it by default, naming that step', async () => {
      const target = await insertStep({ order: 2, type: 'transition', config: { title: 'Pause' } });
      await insertStep({
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
        defaultNextStepId: target.id,
      });

      await expect(deleteStep(target)).rejects.toMatchObject({
        name: 'ConflictError',
        statusCode: 409,
        message: 'This step can\'t be removed because other steps lead to it: step 1 "Welcome".',
        details: { linkingSteps: [{ order: 1, title: 'Welcome' }] },
      });
      expect((await storedStep(target.id)).isActive).toBe(true);
    });

    it('refuses with a 409 while another step leads to it by a goto_step rule, naming that step', async () => {
      const target = await insertStep({ order: 2, type: 'transition', config: { title: 'Pause' } });
      await insertStep({
        order: 3,
        type: 'transition',
        config: { title: 'Loop back' },
        nextStepRules: [
          { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId: target.id } },
        ],
      });

      await expect(deleteStep(target)).rejects.toMatchObject({
        name: 'ConflictError',
        statusCode: 409,
        message: 'This step can\'t be removed because other steps lead to it: step 3 "Loop back".',
        details: { linkingSteps: [{ order: 3, title: 'Loop back' }] },
      });
      expect((await storedStep(target.id)).isActive).toBe(true);
    });

    it('removes it once the step that led to it leads elsewhere', async () => {
      const target = await insertStep({ order: 2, type: 'transition', config: { title: 'Pause' } });
      const elsewhere = await insertStep({ order: 3, type: 'results', config: { title: 'Done' } });
      const linking = await insertStep({
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
        defaultNextStepId: target.id,
      });

      await db
        .update(flowSteps)
        .set({ defaultNextStepId: elsewhere.id })
        .where(eq(flowSteps.id, linking.id));
      await deleteStep(target);

      expect((await storedStep(target.id)).isActive).toBe(false);
    });

    it('removes a step whose only links are to itself', async () => {
      const id = randomUUID();
      const target = await insertStep({
        id,
        order: 1,
        type: 'transition',
        config: { title: 'Repeat' },
        defaultNextStepId: id,
        nextStepRules: [
          { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId: id } },
        ],
      });

      await deleteStep(target);

      expect((await storedStep(target.id)).isActive).toBe(false);
    });

    it('removes a step that only a removed step led to', async () => {
      const target = await insertStep({ order: 2, type: 'transition', config: { title: 'Pause' } });
      const removed = await insertStep({
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
        defaultNextStepId: target.id,
        isActive: false,
      });

      await deleteStep(target);

      expect((await storedStep(target.id)).isActive).toBe(false);
      expect((await storedStep(removed.id)).defaultNextStepId).toBe(target.id);
    });
  });
});
