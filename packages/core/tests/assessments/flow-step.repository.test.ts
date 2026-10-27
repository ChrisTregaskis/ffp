import { randomUUID } from 'crypto';

import { asc, eq, inArray, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import {
  assessmentFlows,
  assessmentTemplates,
  flowSteps,
  userAssessments,
} from '@ffp/database/schema';
import {
  asOrganisation,
  connectTestDb,
  deleteOrganisations,
  type TestDb,
} from '@ffp/database/testing';

import * as assessmentService from '../../src/assessments/assessment.service';
import * as flowStepRepository from '../../src/assessments/flow-step.repository';
import * as flowStepService from '../../src/assessments/flow-step.service';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import { updateFlowStepSchema } from '../../src/schemas/assessment-flow.schema';

import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { Pool } from 'pg';

// Flows, steps and templates are shared catalogue tables: names carry a per-run marker, and
// clean-up deletes only this test's flow (its steps cascade) and template
const RUN_ID = randomUUID().slice(0, 8);

type FlowStepRepositoryModule = typeof flowStepRepository;
type UserAssessmentRepositoryModule = typeof userAssessmentRepository;

// Pass-through, so a test can make the delete fail after its last write
vi.mock('../../src/assessments/flow-step.repository', async (importOriginal) => {
  const actual = await importOriginal<FlowStepRepositoryModule>();

  return { ...actual, closeOrderGap: vi.fn(actual.closeOrderGap) };
});
vi.mock('../../src/assessments/user-assessment.repository', async (importOriginal) => {
  const actual = await importOriginal<UserAssessmentRepositoryModule>();

  return { ...actual, shiftOpenAssessmentsBack: vi.fn(actual.shiftOpenAssessmentsBack) };
});

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
    // Reset, so a once-implementation left by a failed test cannot leak into the next
    vi.mocked(flowStepRepository.closeOrderGap).mockReset();
    vi.mocked(userAssessmentRepository.shiftOpenAssessmentsBack).mockReset();
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
    const adminContext: OrganisationContext = {
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
      flowStepService.deleteStepService(adminContext, flowPublicId, step.publicId);

    /** Every step of the flow, removed ones included, by id (orders can tie) */
    const flowState = async (): Promise<
      Pick<
        typeof flowSteps.$inferSelect,
        'id' | 'order' | 'isActive' | 'defaultNextStepId' | 'nextStepRules'
      >[]
    > =>
      await db
        .select({
          id: flowSteps.id,
          order: flowSteps.order,
          isActive: flowSteps.isActive,
          defaultNextStepId: flowSteps.defaultNextStepId,
          nextStepRules: flowSteps.nextStepRules,
        })
        .from(flowSteps)
        .where(eq(flowSteps.flowId, flowId))
        .orderBy(asc(flowSteps.id));

    /** A → B → C, each leading to the next by its default next step */
    const insertChain = async (): Promise<(typeof flowSteps.$inferSelect)[]> => {
      const [aId, bId, cId] = [randomUUID(), randomUUID(), randomUUID()];
      const c = await insertStep({ id: cId, order: 3, type: 'results', config: { title: 'C' } });
      const b = await insertStep({
        id: bId,
        order: 2,
        type: 'transition',
        config: { title: 'B' },
        defaultNextStepId: cId,
      });
      const a = await insertStep({
        id: aId,
        order: 1,
        type: 'intro',
        config: { title: 'A' },
        defaultNextStepId: bId,
      });

      return [a, b, c];
    };

    const gotoRule = (
      targetStepId: string
    ): NonNullable<(typeof flowSteps.$inferInsert)['nextStepRules']> => [
      { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId } },
    ];

    it('reroutes a default link past the removed step and closes the order gap', async () => {
      const [a, b, c] = await insertChain();

      await deleteStep(b);

      expect(await flowState()).toEqual(
        [
          { id: a.id, order: 1, isActive: true, defaultNextStepId: c.id, nextStepRules: null },
          { id: b.id, order: 2, isActive: false, defaultNextStepId: c.id, nextStepRules: null },
          { id: c.id, order: 2, isActive: true, defaultNextStepId: null, nextStepRules: null },
        ].sort((x, y) => x.id.localeCompare(y.id))
      );
    });

    it('writes nothing when the delete fails part-way, so the reroute and removal roll back', async () => {
      const [a, b, c] = await insertChain();
      const before = await flowState();
      const { closeOrderGap: realCloseOrderGap } = await vi.importActual<FlowStepRepositoryModule>(
        '../../src/assessments/flow-step.repository'
      );
      vi.mocked(flowStepRepository.closeOrderGap).mockImplementationOnce(async (...args) => {
        await realCloseOrderGap(...args);
        throw new Error('Failed after closing the gap');
      });

      await expect(deleteStep(b)).rejects.toThrow('Failed after closing the gap');

      expect(await flowState()).toEqual(before);
      expect(before.map((step) => step.id).sort()).toEqual([a.id, b.id, c.id].sort());
    });

    it('clears a rerouted default that would lead a step to itself', async () => {
      const [aId, bId] = [randomUUID(), randomUUID()];
      const a = await insertStep({
        id: aId,
        order: 1,
        type: 'intro',
        config: { title: 'A' },
        defaultNextStepId: bId,
      });
      const b = await insertStep({
        id: bId,
        order: 2,
        type: 'transition',
        config: { title: 'Back to A' },
        defaultNextStepId: aId,
      });

      await deleteStep(b);

      expect((await storedStep(a.id)).defaultNextStepId).toBeNull();
      expect((await storedStep(b.id)).isActive).toBe(false);
    });

    it('keeps the orders of a tier the removed step shared with another step', async () => {
      const [a, b, c] = await insertChain();
      const parallel = await insertStep({
        order: 2,
        type: 'transition',
        config: { title: 'B too' },
      });

      await deleteStep(b);

      const active = (await flowState()).filter((step) => step.isActive);
      expect(active.sort((x, y) => x.order - y.order)).toEqual([
        { id: a.id, order: 1, isActive: true, defaultNextStepId: c.id, nextStepRules: null },
        expect.objectContaining({ id: parallel.id, order: 2 }),
        expect.objectContaining({ id: c.id, order: 3 }),
      ]);
    });

    it('sends a step that skipped ahead to it on to where it led, and every linking step likewise', async () => {
      const [a, b, c] = await insertChain();
      const skipAhead = await insertStep({
        order: 4,
        type: 'transition',
        config: { title: 'Skip back' },
        defaultNextStepId: b.id,
      });

      await deleteStep(b);

      expect((await storedStep(a.id)).defaultNextStepId).toBe(c.id);
      expect((await storedStep(skipAhead.id)).defaultNextStepId).toBe(c.id);
    });

    it.each([
      ['has no default', null],
      ['leads by default to a removed step', 'removed'],
    ])(
      'sends a linking step on to the next step in order when the removed step %s',
      async (_case, defaultTo) => {
        const removedElsewhere = await insertStep({
          order: 9,
          type: 'transition',
          config: { title: 'Gone' },
          isActive: false,
        });
        const [bId] = [randomUUID()];
        const c = await insertStep({ order: 3, type: 'results', config: { title: 'C' } });
        const b = await insertStep({
          id: bId,
          order: 2,
          type: 'transition',
          config: { title: 'B' },
          defaultNextStepId: defaultTo === null ? null : removedElsewhere.id,
        });
        const linking = await insertStep({
          order: 5,
          type: 'transition',
          config: { title: 'Loop back' },
          defaultNextStepId: b.id,
        });

        await deleteStep(b);

        expect((await storedStep(linking.id)).defaultNextStepId).toBe(c.id);
      }
    );

    it('sends a linking step on to the next tier, not into a parallel step, when the removed step has no default', async () => {
      const bId = randomUUID();
      const a = await insertStep({
        order: 1,
        type: 'intro',
        config: { title: 'A' },
        defaultNextStepId: bId,
      });
      const b = await insertStep({ id: bId, order: 2, type: 'transition', config: { title: 'B' } });
      await insertStep({ order: 2, type: 'transition', config: { title: 'B too' } });
      const c = await insertStep({ order: 3, type: 'results', config: { title: 'C' } });

      await deleteStep(b);

      expect((await storedStep(a.id)).defaultNextStepId).toBe(c.id);
    });

    it('refuses with a 409 while another step leads to it by a goto_step rule, naming that step', async () => {
      const target = await insertStep({ order: 2, type: 'transition', config: { title: 'Pause' } });
      await insertStep({
        order: 3,
        type: 'transition',
        config: { title: 'Loop back' },
        nextStepRules: gotoRule(target.id),
      });
      const before = await flowState();

      await expect(deleteStep(target)).rejects.toMatchObject({
        name: 'ConflictError',
        statusCode: 409,
        message:
          'This step can\'t be removed because other steps branch to it: step 3 "Loop back". Branching can\'t be changed in the admin yet.',
        details: { linkingSteps: [{ order: 3, title: 'Loop back' }] },
      });
      expect(await flowState()).toEqual(before);
    });

    it('refuses with a 409 when one step leads to it by default and another by a rule, and changes nothing', async () => {
      const [, b] = await insertChain();
      await insertStep({
        order: 4,
        type: 'transition',
        config: { title: 'Loop back' },
        nextStepRules: gotoRule(b.id),
      });
      const before = await flowState();

      await expect(deleteStep(b)).rejects.toMatchObject({
        name: 'ConflictError',
        statusCode: 409,
        message:
          'This step can\'t be removed because other steps branch to it: step 4 "Loop back". Branching can\'t be changed in the admin yet.',
        details: { linkingSteps: [{ order: 4, title: 'Loop back' }] },
      });
      expect(await flowState()).toEqual(before);
    });

    it('removes a step whose only links are to itself', async () => {
      const id = randomUUID();
      const target = await insertStep({
        id,
        order: 1,
        type: 'transition',
        config: { title: 'Repeat' },
        defaultNextStepId: id,
        nextStepRules: gotoRule(id),
      });
      const next = await insertStep({ order: 2, type: 'results', config: { title: 'Done' } });

      await deleteStep(target);

      expect((await storedStep(target.id)).isActive).toBe(false);
      expect((await storedStep(next.id)).order).toBe(1);
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

    describe('a member mid-assessment', () => {
      let organisationIds: string[];
      let otherFlowIds: string[];

      beforeEach(() => {
        organisationIds = [];
        otherFlowIds = [];
      });

      afterEach(async () => {
        // Members' assessments go with their organisations, before the flows they reference
        await deleteOrganisations(db, organisationIds);
        await db.delete(assessmentFlows).where(inArray(assessmentFlows.id, otherFlowIds));
      });

      const shortId = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

      /** An organisation with one member; returns the member's ids and request context */
      const insertMember = async (): Promise<{
        organisationId: string;
        userId: string;
        context: OrganisationContext;
      }> => {
        const organisationId = randomUUID();
        const userId = randomUUID();
        const cognitoSub = `cognito-${userId.slice(0, 8)}`;
        organisationIds.push(organisationId);

        await asOrganisation(db, organisationId, async (tx) => {
          await tx.execute(sql`
            INSERT INTO organisations (id, public_id, type, name, settings)
            VALUES (${organisationId}, ${shortId()}, 'individual', ${`Step Organisation [${RUN_ID}]`}, '{}')
          `);
          await tx.execute(sql`
            INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
            VALUES (${userId}, ${shortId()}, ${organisationId}, NULL, ${`step-${userId.slice(0, 8)}@test.com`}, ${cognitoSub}, 'Mo', 'Member', 'programme_user')
          `);
        });

        return {
          organisationId,
          userId,
          context: {
            actor: {
              type: 'user',
              userId: cognitoSub,
              userRole: 'programme_user',
              email: 'member@example.com',
            } as UserActor,
            organisationId,
            locationId: randomUUID(),
            requestId: randomUUID(),
            timestamp: new Date(),
          },
        };
      };

      type Member = Awaited<ReturnType<typeof insertMember>>;

      /** An assessment stored at `currentStep` with `status`, on this test's flow unless given */
      const insertAssessment = async (
        member: Member,
        currentStep: number,
        status: (typeof userAssessments.$inferInsert)['status'] = 'in_progress',
        onFlowId = flowId
      ): Promise<string> => {
        const [row] = await asOrganisation(db, member.organisationId, (tx) =>
          tx
            .insert(userAssessments)
            .values({
              organisationId: member.organisationId,
              userId: member.userId,
              flowId: onFlowId,
              currentStep,
              status,
            })
            .returning({ id: userAssessments.id })
        );

        return row.id;
      };

      const storedPosition = async (member: Member, assessmentId: string): Promise<number> => {
        const rows = await asOrganisation(db, member.organisationId, (tx) =>
          tx
            .select({ currentStep: userAssessments.currentStep })
            .from(userAssessments)
            .where(eq(userAssessments.id, assessmentId))
        );

        expect(rows).toHaveLength(1);

        return rows[0].currentStep;
      };

      /** The step a member is shown on resuming */
      const resumedStepId = async (member: Member): Promise<string | undefined> => {
        const resumed = await assessmentService.startAssessment(flowId, member.context);

        return (await flowState()).find(
          (step) => step.isActive && step.order === resumed.currentStep
        )?.id;
      };

      it('moves a member past the removed step back one, in every organisation, so they resume on the same step', async () => {
        const [, b, c] = await insertChain();
        const members = [await insertMember(), await insertMember()];
        const assessmentIds = [
          await insertAssessment(members[0], 3),
          await insertAssessment(members[1], 3, 'not_started'),
        ];

        await deleteStep(b);

        expect(await storedPosition(members[0], assessmentIds[0])).toBe(2);
        expect(await storedPosition(members[1], assessmentIds[1])).toBe(2);
        expect(await resumedStepId(members[0])).toBe(c.id);
      });

      it('leaves a member before the removed step where they are', async () => {
        const [a, b] = await insertChain();
        const member = await insertMember();
        const assessmentId = await insertAssessment(member, 1);

        await deleteStep(b);

        expect(await storedPosition(member, assessmentId)).toBe(1);
        expect(await resumedStepId(member)).toBe(a.id);
      });

      it('leaves a member on the removed step at its order, which the step that followed now holds', async () => {
        const [, b, c] = await insertChain();
        const member = await insertMember();
        const assessmentId = await insertAssessment(member, 2);

        await deleteStep(b);

        expect(await storedPosition(member, assessmentId)).toBe(2);
        expect(await resumedStepId(member)).toBe(c.id);
      });

      it.each(['submitted', 'completed'] as const)(
        'leaves a %s assessment where it was',
        async (status) => {
          const [, b] = await insertChain();
          const member = await insertMember();
          const assessmentId = await insertAssessment(member, 3, status);

          await deleteStep(b);

          expect(await storedPosition(member, assessmentId)).toBe(3);
        }
      );

      it("leaves another flow's assessments where they were", async () => {
        const [, b] = await insertChain();
        const [otherFlow] = await db
          .insert(assessmentFlows)
          .values({ name: `Other step flow [${RUN_ID}]` })
          .returning({ id: assessmentFlows.id });
        otherFlowIds.push(otherFlow.id);
        const member = await insertMember();
        const assessmentId = await insertAssessment(member, 3, 'in_progress', otherFlow.id);

        await deleteStep(b);

        expect(await storedPosition(member, assessmentId)).toBe(3);
      });

      it('moves nobody when the removed step shared its order, as the orders stay as they were', async () => {
        const [, b] = await insertChain();
        await insertStep({ order: 2, type: 'transition', config: { title: 'B too' } });
        const member = await insertMember();
        const assessmentId = await insertAssessment(member, 3);

        await deleteStep(b);

        expect(await storedPosition(member, assessmentId)).toBe(3);
      });

      it("rolls back the members' positions with the rest of the delete when it fails after moving them", async () => {
        const [, b] = await insertChain();
        const member = await insertMember();
        const assessmentId = await insertAssessment(member, 3);
        const before = await flowState();
        const { shiftOpenAssessmentsBack: realShift } =
          await vi.importActual<UserAssessmentRepositoryModule>(
            '../../src/assessments/user-assessment.repository'
          );
        vi.mocked(userAssessmentRepository.shiftOpenAssessmentsBack).mockImplementationOnce(
          async (...args) => {
            await realShift(...args);
            throw new Error('Failed after moving the members');
          }
        );

        await expect(deleteStep(b)).rejects.toThrow('Failed after moving the members');

        expect(await storedPosition(member, assessmentId)).toBe(3);
        expect(await flowState()).toEqual(before);
      });

      it('can save at the order the removed step left, which the next step now holds', async () => {
        const [, b, c] = await insertChain();
        const member = await insertMember();
        const assessmentId = await insertAssessment(member, 1, 'not_started');

        await deleteStep(b);
        const response = await assessmentService.saveProgress(
          assessmentId,
          { answers: {}, currentStep: 2 },
          member.context
        );

        expect(response.success).toBe(true);
        expect(await storedPosition(member, assessmentId)).toBe(2);
        expect((await storedStep(c.id)).order).toBe(2);
      });
    });
  });
});
