import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as flowStepRepository from '../../src/assessments/flow-step.repository';
import * as flowStepService from '../../src/assessments/flow-step.service';
import * as flowRepository from '../../src/assessments/flow.repository';
import * as templateRepository from '../../src/assessments/template.repository';
import { ConflictError, NotFoundError, ValidationError } from '../../src/lib/errors';

import type { AssessmentFlow, FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';

type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/assessments/flow.repository');
vi.mock('../../src/assessments/flow-step.repository');
vi.mock('../../src/assessments/template.repository');
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(() => ({}) as ReturnType<FFPDatabaseModule['getDb']>),
  };
});

const mockedFlowRepo = vi.mocked(flowRepository);
const mockedFlowStepRepo = vi.mocked(flowStepRepository);
const mockedTemplateRepo = vi.mocked(templateRepository);

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

  it('reorders a linear flow and enriches each step with branchingRuleCount', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([stepA, stepB]);
    mockedFlowStepRepo.reorderSteps.mockResolvedValue([
      { ...stepB, order: 1 },
      { ...stepA, order: 2 },
    ]);

    const result = await flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
      orderedStepPublicIds: [stepB.publicId, stepA.publicId],
    });

    expect(result.map((step) => step.publicId)).toEqual([stepB.publicId, stepA.publicId]);
    expect(result.every((step) => step.branchingRuleCount === 0)).toBe(true);
    expect(mockedFlowStepRepo.reorderSteps).toHaveBeenCalledWith(expect.anything(), flow.id, [
      stepB.id,
      stepA.id,
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
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([branchingStep, plainStep]);

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
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([stepA, stepB]);

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
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId, 'strangerXYZ1'],
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('rejects a reorder whose count does not match the flow active steps', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId],
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockedFlowStepRepo.reorderSteps).not.toHaveBeenCalled();
  });

  it('rejects a reorder with duplicate step IDs (would silently drop a step)', async () => {
    const flow = createFlow();
    const stepA = createStep(flow.id, { order: 1 });
    const stepB = createStep(flow.id, { order: 2 });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([stepA, stepB]);

    await expect(
      flowStepService.reorderStepsService(createContext(), FLOW_PUBLIC_ID, {
        orderedStepPublicIds: [stepA.publicId, stepA.publicId],
      })
    ).rejects.toBeInstanceOf(ValidationError);

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

  it('appends a step at max active order + 1', async () => {
    const flow = createFlow();
    const created = createStep(flow.id, { order: 4, type: 'questions' });

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowStepRepo.findMaxOrderForFlow.mockResolvedValue(3);
    mockedFlowStepRepo.createStep.mockResolvedValue(created);

    const result = await flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
      type: 'questions',
      config: { title: 'Questions' },
    });

    expect(result.branchingRuleCount).toBe(0);
    expect(mockedFlowStepRepo.createStep).toHaveBeenCalledWith(
      expect.anything(),
      flow.id,
      4,
      expect.objectContaining({ type: 'questions' })
    );
  });

  it('rejects a linked template that is inactive', async () => {
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedTemplateRepo.findTemplateById.mockResolvedValue({ isActive: false } as never);

    await expect(
      flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
        type: 'questions',
        templateId: randomUUID(),
        config: { title: 'Questions' },
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockedFlowStepRepo.createStep).not.toHaveBeenCalled();
  });

  it('rejects invalid input (missing config title)', async () => {
    await expect(
      flowStepService.createStepService(createContext(), FLOW_PUBLIC_ID, {
        type: 'intro',
        config: {},
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
