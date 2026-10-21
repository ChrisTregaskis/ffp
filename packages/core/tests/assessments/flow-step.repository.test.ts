import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { assessmentFlows, assessmentTemplates, flowSteps } from '@ffp/database/schema';

import { createEvaluationContext, evaluateNextStep } from '../../src/assessments/branching';
import * as flowStepRepository from '../../src/assessments/flow-step.repository';
import * as flowStepService from '../../src/assessments/flow-step.service';
import * as flowRepository from '../../src/assessments/flow.repository';
import { updateFlowStepSchema } from '../../src/schemas/assessment-flow.schema';

import type { OrganisationContext, UserActor } from '../../src/lib/context';

// Flows, steps and templates are shared catalogue tables: names carry a per-run marker, and
// clean-up deletes only this test's flow (its steps cascade) and template
const RUN_ID = randomUUID().slice(0, 8);

describe('Flow Step Repository', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let flowId: string;
  let flowPublicId: string;
  let templateId: string;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool);
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

    // Suspected defect, characterised: the delete checks no references, so the deleted
    // step's id is still what branching returns, by default and by rule
    it('leaves the links to it in place, so branching still returns the deleted step', async () => {
      const deleted = await insertStep({ order: 2, type: 'transition', config: { title: 'Gone' } });
      const linksByDefault = await insertStep({
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
        defaultNextStepId: deleted.id,
      });
      const linksByRule = await insertStep({
        order: 3,
        type: 'transition',
        config: { title: 'Loop back' },
        nextStepRules: [
          { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId: deleted.id } },
        ],
      });

      await flowStepService.deleteStepService(context, flowPublicId, deleted.publicId);

      const activeSteps = await flowRepository.findStepsByFlowId(db, flowId);
      expect(activeSteps.map((step) => step.id)).toEqual([linksByDefault.id, linksByRule.id]);
      expect((await storedStep(deleted.id)).isActive).toBe(false);

      const [byDefault, byRule] = activeSteps;
      expect(byDefault.defaultNextStepId).toBe(deleted.id);
      expect(
        evaluateNextStep(byDefault, createEvaluationContext(byDefault.id, activeSteps, []))
          .nextStepId
      ).toBe(deleted.id);
      expect(
        evaluateNextStep(byRule, createEvaluationContext(byRule.id, activeSteps, [])).nextStepId
      ).toBe(deleted.id);
    });
  });
});
