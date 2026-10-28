import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as flowStepRepository from '../../src/assessments/flow-step.repository';
import * as flowStepService from '../../src/assessments/flow-step.service';
import * as flowRepository from '../../src/assessments/flow.repository';
import * as templateRepository from '../../src/assessments/template.repository';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import { ConflictError, NotFoundError } from '../../src/lib/errors';

import type { AssessmentFlow, FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { UpdateFlowStepInput } from '../../src/schemas/assessment-flow.schema';

type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/assessments/flow.repository');
vi.mock('../../src/assessments/flow-step.repository');
vi.mock('../../src/assessments/template.repository');
vi.mock('../../src/assessments/user-assessment.repository');
/** Stands in for the transaction a step write opens; the marker stops any other object matching it */
const mockTx = { marker: 'transaction opened by the step write' };

vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(
      () =>
        ({
          transaction: async (callback: (tx: typeof mockTx) => Promise<unknown>) =>
            await callback(mockTx),
        }) as unknown as ReturnType<FFPDatabaseModule['getDb']>
    ),
  };
});

const mockedFlowRepo = vi.mocked(flowRepository);
const mockedFlowStepRepo = vi.mocked(flowStepRepository);
const mockedTemplateRepo = vi.mocked(templateRepository);
const mockedUserAssessmentRepo = vi.mocked(userAssessmentRepository);

const FLOW_PUBLIC_ID = 'flowABCDE123';

const createContext = (): OrganisationContext => ({
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
});

const createFlow = (): AssessmentFlow => ({
  id: randomUUID(),
  publicId: FLOW_PUBLIC_ID,
  name: 'Wellness baseline',
  description: null,
  scoringConfig: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

let stepOrder = 0;

const createStep = (
  flowId: string,
  overrides: Partial<FlowStepWithConfig> = {}
): FlowStepWithConfig => {
  stepOrder += 1;

  return {
    id: randomUUID(),
    publicId: `step${String(stepOrder).padStart(8, '0')}`,
    flowId,
    templateId: null,
    order: stepOrder,
    type: 'intro',
    config: { title: 'Step' },
    nextStepRules: null,
    defaultNextStepId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

describe('flowStepService.reorderStepsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepOrder = 0;
  });

  it('reorders a linear flow under the step lock, in one transaction, and enriches each step with branchingRuleCount', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([stepA, stepB]);
    mockedFlowStepRepo.reorderSteps.mockResolvedValue([
      { ...stepB, order: 1 },
      { ...stepA, order: 2 },
    ]);

    const result = await flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
      orderedStepPublicIds: [stepB.publicId, stepA.publicId],
    });

    expect(result.map((step) => step.publicId)).toEqual([stepB.publicId, stepA.publicId]);
    expect(result.every((step) => step.branchingRuleCount === 0)).toBe(true);
    expect(mockedFlowStepRepo.lockActiveSteps.mock.calls).toEqual([[mockTx, flow.id]]);
    expect(mockedFlowStepRepo.reorderSteps.mock.calls).toEqual([
      [mockTx, flow.id, [stepB.id, stepA.id]],
    ]);
  });

  it('refuses to reorder a flow whose steps carry branching rules', async () => {
    const flow = createFlow();
    const branchingStep = createStep(flow.id, {
      order: 1,
      nextStepRules: [{ priority: 1, conditions: [], action: { type: 'end_assessment' } }] as never,
    });
    const plainStep = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([branchingStep, plainStep]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [plainStep.publicId, branchingStep.publicId],
      })
    ).rejects.toBeInstanceOf(ConflictError);

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('refuses to reorder a flow with parallel branches (shared order value)', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 1 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId, stepB.publicId],
      })
    ).rejects.toBeInstanceOf(ConflictError);

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('rejects step IDs that do not belong to the flow', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId, 'strangerXYZ1'],
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'One or more step IDs do not belong to this flow',
      details: { publicId: 'strangerXYZ1' },
    });

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('rejects a reorder whose count does not match the flow active steps', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId],
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Expected 2 step IDs but received 1',
      details: undefined,
    });

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('rejects a reorder with duplicate step IDs (would silently drop a step)', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId, stepA.publicId],
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Step IDs must be unique',
      details: undefined,
    });

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the flow does not exist', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(null);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: ['step00000001'],
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('flowStepService.createStepService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepOrder = 0;
  });

  it('appends a step after the locked active steps, in one transaction', async () => {
    const flow = createFlow();
    const locked = [createStep(flow.id), createStep(flow.id), createStep(flow.id)];
    const created = createStep(flow.id, { order: 4, type: 'questions' });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedTemplateRepo.findTemplateById.mockResolvedValue({ isActive: true } as never);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue(locked);
    mockedFlowStepRepo.createStep.mockResolvedValue(created);

    const result = await flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
      type: 'questions',
      templateId: randomUUID(),
      config: { title: 'Questions' },
    });

    expect(result.branchingRuleCount).toBe(0);
    expect(mockedFlowStepRepo.lockActiveSteps.mock.calls).toEqual([[mockTx, flow.id]]);
    expect(mockedFlowStepRepo.createStep).toHaveBeenCalledWith(
      mockTx,
      flow.id,
      4,
      expect.objectContaining({ type: 'questions' })
    );
  });

  it('appends the first step of a flow with no active step at order 1', async () => {
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([]);
    mockedFlowStepRepo.createStep.mockResolvedValue(createStep(flow.id, { type: 'intro' }));

    await flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
      type: 'intro',
      config: { title: 'Welcome' },
    });

    expect(mockedFlowStepRepo.createStep).toHaveBeenCalledWith(
      mockTx,
      flow.id,
      1,
      expect.objectContaining({ type: 'intro' })
    );
  });

  it('rejects a linked template that is inactive', async () => {
    const flow = createFlow();
    const templateId = randomUUID();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedTemplateRepo.findTemplateById.mockResolvedValue({ isActive: false } as never);

    await expect(
      flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
        type: 'questions',
        templateId,
        config: { title: 'Questions' },
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Linked assessment template not found or inactive',
      details: { templateId },
    });

    expect(mockedFlowStepRepo.createStep).not.toHaveBeenCalled();
  });

  it('refuses a template-linked type created without a template', async () => {
    // The flow resolves, so only the template check can stop the write
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([]);
    mockedFlowStepRepo.createStep.mockResolvedValue(createStep(flow.id, { type: 'questions' }));

    await expect(
      flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
        type: 'questions',
        config: { title: 'Questions' },
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'A step of this type must link an assessment template',
      details: { type: 'questions' },
    });

    expect(mockedFlowStepRepo.createStep).not.toHaveBeenCalled();
  });

  it('creates a step that takes no template without one', async () => {
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([]);
    mockedFlowStepRepo.createStep.mockResolvedValue(createStep(flow.id, { type: 'intro' }));

    await flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
      type: 'intro',
      config: { title: 'Welcome' },
    });

    expect(mockedFlowStepRepo.createStep).toHaveBeenCalledOnce();
  });

  it('rejects invalid input (missing config title)', async () => {
    await expect(
      flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
        type: 'intro',
        config: {},
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Invalid flow step input',
      details: { errors: [expect.objectContaining({ path: ['config', 'title'] })] },
    });
  });
});

describe('flowStepService.updateStepService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepOrder = 0;
  });

  const arrangeStoredStep = (overrides: Partial<FlowStepWithConfig> = {}): FlowStepWithConfig => {
    const flow = createFlow();
    const step = createStep(flow.id, { type: 'questions', templateId: randomUUID(), ...overrides });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.findStepByPublicId.mockResolvedValue(step);
    mockedFlowStepRepo.updateStep.mockResolvedValue(step);

    return step;
  };

  const capturedUpdate = (): UpdateFlowStepInput => mockedFlowStepRepo.updateStep.mock.calls[0][2];

  it('clears the template link on an explicit null', async () => {
    const step = arrangeStoredStep({ type: 'intro' });

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      templateId: null,
    });

    expect(capturedUpdate().templateId).toBeNull();
    expect(mockedTemplateRepo.findTemplateById).not.toHaveBeenCalled();
  });

  it('clears the template link when null accompanies a move to a type that takes none', async () => {
    const step = arrangeStoredStep();

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      type: 'intro',
      templateId: null,
    });

    expect(capturedUpdate()).toMatchObject({ type: 'intro', templateId: null });
  });

  it('refuses a null that would leave a template-linked step without a template', async () => {
    const step = arrangeStoredStep();

    await expect(
      flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
        templateId: null,
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'A step of this type must link an assessment template',
      details: { type: 'questions' },
    });

    expect(mockedFlowStepRepo.updateStep).not.toHaveBeenCalled();
  });

  it('refuses a move to a template-linked type when no template is stored or sent', async () => {
    const step = arrangeStoredStep({ type: 'intro', templateId: null });

    await expect(
      flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
        type: 'questions',
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'A step of this type must link an assessment template',
      details: { type: 'questions' },
    });

    expect(mockedFlowStepRepo.updateStep).not.toHaveBeenCalled();
  });

  it('clears a stale link on a save that resends an unchanged non-linking type', async () => {
    const step = arrangeStoredStep({ type: 'intro' });

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      type: 'intro',
      config: { title: 'Renamed step' },
    });

    expect(capturedUpdate()).toMatchObject({ type: 'intro', templateId: null });
  });

  it('leaves the template link alone when templateId is omitted', async () => {
    const step = arrangeStoredStep();

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      config: { title: 'Renamed step' },
    });

    expect(capturedUpdate()).not.toHaveProperty('templateId');
  });

  it('clears the template link when the type changes to one that takes no template', async () => {
    const step = arrangeStoredStep();

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      type: 'intro',
    });

    expect(capturedUpdate()).toMatchObject({ type: 'intro', templateId: null });
  });

  it('keeps the template link when the type changes to another that takes one', async () => {
    const step = arrangeStoredStep();

    mockedTemplateRepo.findTemplateById.mockResolvedValue({ isActive: true } as never);

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      type: 'video-assessment',
    });

    expect(capturedUpdate()).not.toHaveProperty('templateId');
    expect(mockedTemplateRepo.findTemplateById).not.toHaveBeenCalled();
  });

  it('refuses a step that belongs to another flow with a 404, before any write', async () => {
    const step = arrangeStoredStep({ flowId: randomUUID() });

    await expect(
      flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
        config: { title: 'Renamed step' },
      })
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      statusCode: 404,
      message: `Flow step with id ${step.publicId} not found`,
    });

    expect(mockedFlowStepRepo.updateStep).not.toHaveBeenCalled();
  });

  it('keeps an explicitly sent template link even when the type takes none', async () => {
    const step = arrangeStoredStep();
    const templateId = randomUUID();

    mockedTemplateRepo.findTemplateById.mockResolvedValue({ isActive: true } as never);

    await flowStepService.updateStepService(createContext(), FLOW_PUBLIC_ID, step.publicId, {
      type: 'intro',
      templateId,
    });

    expect(capturedUpdate()).toMatchObject({ type: 'intro', templateId });
  });
});

describe('flowStepService.deleteStepService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepOrder = 0;
  });

  const arrange = (stepOverrides: Partial<FlowStepWithConfig> = {}): FlowStepWithConfig => {
    const flow = createFlow();
    const step = createStep(flow.id, stepOverrides);

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.findStepByPublicId.mockResolvedValue(step);
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue(step.isActive ? [step] : []);
    mockedFlowStepRepo.closeOrderGap.mockResolvedValue(1);

    return step;
  };

  it('soft-deletes the step by the UUID its public identifier resolves to, inside one transaction', async () => {
    const step = arrange();

    await flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, step.publicId);

    expect(mockedFlowRepo.findByPublicId).toHaveBeenCalledWith(expect.anything(), FLOW_PUBLIC_ID);
    expect(mockedFlowStepRepo.lockActiveSteps.mock.calls).toEqual([[mockTx, step.flowId]]);
    expect(mockedFlowStepRepo.deactivateStep.mock.calls).toEqual([[mockTx, step.id]]);
    expect(mockedFlowStepRepo.closeOrderGap.mock.calls).toEqual([
      [mockTx, step.flowId, step.order],
    ]);
    expect(mockedUserAssessmentRepo.shiftOpenAssessmentsBack.mock.calls).toEqual([
      [mockTx, step.flowId, step.order],
    ]);
  });

  it('moves no member position when no step followed the removed one', async () => {
    const step = arrange();
    mockedFlowStepRepo.closeOrderGap.mockResolvedValue(0);

    await flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, step.publicId);

    expect(mockedFlowStepRepo.deactivateStep.mock.calls).toEqual([[mockTx, step.id]]);
    expect(mockedUserAssessmentRepo.shiftOpenAssessmentsBack).not.toHaveBeenCalled();
  });

  it('reroutes each step that led to it by default, on the transaction', async () => {
    const next = createStep(randomUUID(), { order: 9 });
    const step = arrange({ defaultNextStepId: next.id });
    const first = createStep(step.flowId, { order: 1, defaultNextStepId: step.id });
    const later = createStep(step.flowId, { order: 7, defaultNextStepId: step.id });
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([
      first,
      step,
      later,
      { ...next, flowId: step.flowId },
    ]);

    await flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, step.publicId);

    expect(mockedFlowStepRepo.setDefaultNextStep.mock.calls).toEqual([
      [mockTx, first.id, next.id],
      [mockTx, later.id, next.id],
    ]);
  });

  it('names every step that branches to it, and writes nothing', async () => {
    const step = arrange();
    const goto = (targetStepId: string): FlowStepWithConfig['nextStepRules'] => [
      { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId } },
    ];
    const byDefault = createStep(step.flowId, {
      order: 2,
      config: { title: 'Warm up' },
      defaultNextStepId: step.id,
    });
    const byRule = createStep(step.flowId, {
      order: 3,
      config: { title: 'Check in' },
      nextStepRules: goto(step.id),
    });
    const byBoth = createStep(step.flowId, {
      order: 4,
      config: { title: 'Cool down' },
      defaultNextStepId: step.id,
      nextStepRules: goto(step.id),
    });
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([step, byDefault, byRule, byBoth]);

    await expect(
      flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, step.publicId)
    ).rejects.toMatchObject({
      name: 'ConflictError',
      statusCode: 409,
      message:
        'This step can\'t be removed because other steps branch to it: step 3 "Check in", step 4 "Cool down". Branching can\'t be changed in the admin yet.',
      details: {
        linkingSteps: [
          { order: 3, title: 'Check in' },
          { order: 4, title: 'Cool down' },
        ],
      },
    });

    expect(mockedFlowStepRepo.setDefaultNextStep).not.toHaveBeenCalled();
    expect(mockedFlowStepRepo.deactivateStep).not.toHaveBeenCalled();
    expect(mockedFlowStepRepo.closeOrderGap).not.toHaveBeenCalled();
    expect(mockedUserAssessmentRepo.shiftOpenAssessmentsBack).not.toHaveBeenCalled();
  });

  it('leaves an already-removed step alone, even while another step still leads to it', async () => {
    const step = arrange({ isActive: false });
    mockedFlowStepRepo.lockActiveSteps.mockResolvedValue([
      createStep(step.flowId, { defaultNextStepId: step.id }),
    ]);

    await flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, step.publicId);

    expect(mockedFlowStepRepo.setDefaultNextStep).not.toHaveBeenCalled();
    expect(mockedFlowStepRepo.deactivateStep).not.toHaveBeenCalled();
    expect(mockedFlowStepRepo.closeOrderGap).not.toHaveBeenCalled();
    expect(mockedUserAssessmentRepo.shiftOpenAssessmentsBack).not.toHaveBeenCalled();
  });

  it('refuses a step that belongs to another flow with a 404, before any write', async () => {
    const step = arrange({ flowId: randomUUID() });

    await expect(
      flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, step.publicId)
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      statusCode: 404,
      message: `Flow step with id ${step.publicId} not found`,
    });

    expect(mockedFlowStepRepo.deactivateStep).not.toHaveBeenCalled();
  });

  it('refuses an unknown step with a 404', async () => {
    arrange();
    mockedFlowStepRepo.findStepByPublicId.mockResolvedValue(null);

    await expect(
      flowStepService.deleteStepService(createContext(), FLOW_PUBLIC_ID, 'stepzzzzzzzz')
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Flow step with id stepzzzzzzzz not found',
    });

    expect(mockedFlowStepRepo.deactivateStep).not.toHaveBeenCalled();
  });

  it('refuses an unknown flow with a 404, before looking up the step', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(null);

    await expect(
      flowStepService.deleteStepService(createContext(), 'flowzzzzzzzz', 'step00000001')
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Assessment flow with id flowzzzzzzzz not found',
    });

    expect(mockedFlowStepRepo.findStepByPublicId).not.toHaveBeenCalled();
    expect(mockedFlowStepRepo.deactivateStep).not.toHaveBeenCalled();
  });
});
