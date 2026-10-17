import { describe, expect, it } from 'vitest';

import type { AdminFlowStepView } from '@ffp/core';
import { assessmentFlowWithStepsSchema } from '@ffp/core';

import { flowStepsBranch, stepSharesOrder } from './flow-branching';

const step = (overrides: Partial<AdminFlowStepView> = {}): AdminFlowStepView => ({
  publicId: 'aaaaaaaaaaaa',
  order: 1,
  type: 'intro',
  templateId: null,
  config: { title: 'A step' },
  branchingRuleCount: 0,
  ...overrides,
});

describe('flowStepsBranch', () => {
  it('is false for a linear flow', () => {
    expect(
      flowStepsBranch([
        step({ publicId: 'aaaaaaaaaaaa', order: 1 }),
        step({ publicId: 'bbbbbbbbbbbb', order: 2 }),
      ])
    ).toBe(false);
  });

  it('is true when any step carries navigation rules', () => {
    expect(
      flowStepsBranch([
        step({ publicId: 'aaaaaaaaaaaa', order: 1 }),
        step({ publicId: 'bbbbbbbbbbbb', order: 2, branchingRuleCount: 3 }),
      ])
    ).toBe(true);
  });

  // `order` is not unique, and neither the seed nor the API can produce a shared one
  it('is true when two steps share an order', () => {
    expect(
      flowStepsBranch([
        step({ publicId: 'aaaaaaaaaaaa', order: 1 }),
        step({ publicId: 'bbbbbbbbbbbb', order: 2 }),
        step({ publicId: 'cccccccccccc', order: 2 }),
      ])
    ).toBe(true);
  });

  it('is false for an empty flow', () => {
    expect(flowStepsBranch([])).toBe(false);
  });
});

describe('stepSharesOrder', () => {
  const first = step({ publicId: 'aaaaaaaaaaaa', order: 2 });
  const sibling = step({ publicId: 'bbbbbbbbbbbb', order: 2 });
  const later = step({ publicId: 'cccccccccccc', order: 3 });

  it('is true when another step sits at the same position', () => {
    expect(stepSharesOrder(first, [first, sibling, later])).toBe(true);
  });

  it('is false when the position is the step’s alone', () => {
    expect(stepSharesOrder(later, [first, sibling, later])).toBe(false);
  });
});

describe('assessmentFlowWithStepsSchema', () => {
  const flow = {
    id: '44444444-4444-4444-8444-444444440001',
    publicId: 'c6413330f48e',
    name: 'Standard assessment',
    description: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    steps: [],
  };

  it('accepts a step with a null templateId and a bare config', () => {
    const result = assessmentFlowWithStepsSchema.safeParse({
      ...flow,
      steps: [
        {
          publicId: '192dfcbb7b15',
          order: 1,
          type: 'intro',
          templateId: null,
          config: { title: 'Welcome' },
          branchingRuleCount: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  // The endpoint returns the whole row, branching columns included
  it('ignores the stored branching columns rather than rejecting them', () => {
    const result = assessmentFlowWithStepsSchema.safeParse({
      ...flow,
      steps: [
        {
          publicId: '383e85f6d4b3',
          order: 4,
          type: 'questions',
          templateId: '11111111-1111-1111-8111-111111111105',
          config: { title: 'Health screening', description: 'A few questions' },
          branchingRuleCount: 6,
          nextStepRules: [{ priority: 1 }],
          defaultNextStepId: null,
          isActive: true,
          flowId: '44444444-4444-4444-8444-444444440001',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.steps[0]).not.toHaveProperty('nextStepRules');
  });
});
