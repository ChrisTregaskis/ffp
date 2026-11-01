import { describe, expect, it } from 'vitest';

import type { AdminFlowStepView } from '@ffp/core';

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
