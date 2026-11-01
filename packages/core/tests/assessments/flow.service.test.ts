import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import * as flowRepository from '../../src/assessments/flow.repository';
import * as flowService from '../../src/assessments/flow.service';

import type { AssessmentFlow, FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';

type FFPDatabaseModule = typeof ffpDatabase;

vi.mock('../../src/assessments/flow.repository');
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(() => ({}) as ReturnType<FFPDatabaseModule['getDb']>),
  };
});

const mockedFlowRepo = vi.mocked(flowRepository);

const FLOW_PUBLIC_ID = 'flowABCDE123';

const createContext = (): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'system_admin',
  } as UserActor,
  organisationId: randomUUID(),
  locationId: randomUUID(),
  requestId: randomUUID(),
  timestamp: new Date(),
});

const createFlow = (overrides: Partial<AssessmentFlow> = {}): AssessmentFlow => ({
  id: randomUUID(),
  publicId: FLOW_PUBLIC_ID,
  name: 'Wellness baseline',
  description: 'How you move today',
  scoringConfig: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createStep = (
  flowId: string,
  overrides: Partial<FlowStepWithConfig> = {}
): FlowStepWithConfig => ({
  id: randomUUID(),
  publicId: 'step00000001',
  flowId,
  templateId: null,
  order: 1,
  type: 'intro',
  config: { title: 'Welcome' },
  nextStepRules: null,
  defaultNextStepId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('flowService.listFlowsService', () => {
  it('returns one page with its metadata, passing the paging and filters through', async () => {
    const { scoringConfig: _scoringConfig, ...metadata } = createFlow();
    const row = { ...metadata, stepCount: 4 };
    const pagination = { page: 1, pageSize: 20, sortDirection: 'asc' as const };
    const filters = { search: 'wellness', isActive: true };

    mockedFlowRepo.findFlowPage.mockResolvedValue([row]);
    mockedFlowRepo.countFlows.mockResolvedValue(41);

    const result = await flowService.listFlowsService(createContext(), pagination, filters);

    expect(result).toEqual({
      data: [row],
      pagination: { page: 1, pageSize: 20, total: 41, totalPages: 3 },
    });
    expect(mockedFlowRepo.findFlowPage).toHaveBeenCalledWith(
      expect.anything(),
      pagination,
      filters
    );
    expect(mockedFlowRepo.countFlows).toHaveBeenCalledWith(expect.anything(), filters);
  });
});

describe('flowService.getFlowWithStepsService', () => {
  it('returns the flow with its steps, each carrying its branching rule count', async () => {
    const flow = createFlow();
    const branching = createStep(flow.id, {
      order: 2,
      publicId: 'step00000002',
      nextStepRules: [
        { priority: 1, conditions: [], action: { type: 'end_assessment' } },
        { priority: 2, conditions: [], action: { type: 'end_assessment' } },
      ],
    });
    const linear = createStep(flow.id);

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([linear, branching]);

    const result = await flowService.getFlowWithStepsService(createContext(), FLOW_PUBLIC_ID);

    expect(result).toMatchObject({ id: flow.id, name: 'Wellness baseline' });
    expect(result?.steps.map((step) => [step.publicId, step.branchingRuleCount])).toEqual([
      ['step00000001', 0],
      ['step00000002', 2],
    ]);
    expect(mockedFlowRepo.findStepsByFlowId).toHaveBeenCalledWith(expect.anything(), flow.id);
  });

  it('returns null for an unknown flow without loading steps', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(null);

    expect(await flowService.getFlowWithStepsService(createContext(), 'flowzzzzzzzz')).toBeNull();
    expect(mockedFlowRepo.findStepsByFlowId).not.toHaveBeenCalled();
  });
});

describe('flowService.createFlowService', () => {
  it('creates a flow from the metadata sent, keeping an inactive one inactive', async () => {
    const created = createFlow({ isActive: false });

    mockedFlowRepo.createFlow.mockResolvedValue(created);

    const result = await flowService.createFlowService(createContext(), {
      name: 'Wellness baseline',
      description: 'How you move today',
      isActive: false,
    });

    expect(result).toBe(created);
    expect(mockedFlowRepo.createFlow.mock.calls).toEqual([
      [
        expect.anything(),
        { name: 'Wellness baseline', description: 'How you move today', isActive: false },
      ],
    ]);
  });

  it('refuses a flow without a name, naming the field, before any write', async () => {
    await expect(
      flowService.createFlowService(createContext(), { name: '', isActive: true })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Invalid flow input',
      details: { errors: [expect.objectContaining({ path: ['name'] })] },
    });

    expect(mockedFlowRepo.createFlow).not.toHaveBeenCalled();
  });
});

describe('flowService.updateFlowService', () => {
  it('writes only the fields sent, by the UUID the public identifier resolves to', async () => {
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowRepo.updateFlow.mockResolvedValue(flow);

    await flowService.updateFlowService(createContext(), FLOW_PUBLIC_ID, { name: 'Renamed' });

    // An omitted isActive must not come back as a default, or an edit would reactivate the flow
    expect(mockedFlowRepo.updateFlow.mock.calls).toEqual([
      [expect.anything(), flow.id, { name: 'Renamed' }],
    ]);
  });

  it('passes an explicit null description through, so the description clears', async () => {
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);
    mockedFlowRepo.updateFlow.mockResolvedValue(flow);

    await flowService.updateFlowService(createContext(), FLOW_PUBLIC_ID, { description: null });

    expect(mockedFlowRepo.updateFlow.mock.calls).toEqual([
      [expect.anything(), flow.id, { description: null }],
    ]);
  });

  it('refuses an unknown flow with a 404, before any write', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(null);

    await expect(
      flowService.updateFlowService(createContext(), 'flowzzzzzzzz', { name: 'Renamed' })
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      statusCode: 404,
      message: 'Assessment flow with id flowzzzzzzzz not found',
    });

    expect(mockedFlowRepo.updateFlow).not.toHaveBeenCalled();
  });

  it('refuses an empty name, naming the field, before looking the flow up', async () => {
    await expect(
      flowService.updateFlowService(createContext(), FLOW_PUBLIC_ID, { name: '' })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Invalid flow update input',
      details: { errors: [expect.objectContaining({ path: ['name'] })] },
    });

    expect(mockedFlowRepo.findByPublicId).not.toHaveBeenCalled();
    expect(mockedFlowRepo.updateFlow).not.toHaveBeenCalled();
  });
});

describe('flowService.deactivateFlowService', () => {
  it('deactivates by the UUID the public identifier resolves to', async () => {
    const flow = createFlow();

    mockedFlowRepo.findByPublicId.mockResolvedValue(flow);

    await flowService.deactivateFlowService(createContext(), FLOW_PUBLIC_ID);

    expect(mockedFlowRepo.deactivateFlow.mock.calls).toEqual([[expect.anything(), flow.id]]);
  });

  it('refuses an unknown flow with a 404, before any write', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(null);

    await expect(
      flowService.deactivateFlowService(createContext(), 'flowzzzzzzzz')
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Assessment flow with id flowzzzzzzzz not found',
    });

    expect(mockedFlowRepo.deactivateFlow).not.toHaveBeenCalled();
  });
});
