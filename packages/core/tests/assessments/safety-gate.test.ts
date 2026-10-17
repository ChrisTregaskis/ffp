import { describe, it, expect } from 'vitest';

import type { FlowStepRecord, NextStepRule, WarningType } from '@ffp/database';

import { findSafetyTrigger } from '../../src/assessments/safety-gate';

const ADVICE = 'Please speak to a health professional before you start.';

const safetyRule = (warningType: WarningType): NextStepRule => ({
  priority: 1,
  conditions: [
    {
      type: 'answer_value',
      questionSlug: 'safety-check',
      answerValue: ['chest-pain', 'dizziness', 'night-pain'],
    },
  ],
  action: { type: 'show_warning', warningMessage: ADVICE, warningType, continueAfterWarning: true },
});

const createStep = (order: number, nextStepRules: NextStepRule[] | null): FlowStepRecord => ({
  id: `00000000-0000-4000-8000-00000000000${String(order)}`,
  publicId: `flowstep000${String(order)}`,
  flowId: '00000000-0000-4000-8000-000000000100',
  templateId: null,
  order,
  type: 'questions',
  config: { title: 'Goals and safety' },
  nextStepRules,
  defaultNextStepId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createSteps = (warningType: WarningType = 'seek_medical'): FlowStepRecord[] => [
  createStep(1, null),
  createStep(2, [safetyRule(warningType)]),
  createStep(3, null),
];

describe('findSafetyTrigger', () => {
  it('finds a red flag on any step, naming the options it covers', () => {
    expect(
      findSafetyTrigger(createSteps(), [
        { questionSlug: 'activity-level', value: 'light' },
        { questionSlug: 'safety-check', value: ['none', 'night-pain'] },
      ])
    ).toEqual({
      questionSlug: 'safety-check',
      selectedOptions: ['night-pain'],
      warningMessage: ADVICE,
    });
  });

  it('finds nothing without a red flag, or without an answer', () => {
    expect(
      findSafetyTrigger(createSteps(), [{ questionSlug: 'safety-check', value: ['none'] }])
    ).toBeNull();
    expect(findSafetyTrigger(createSteps(), [])).toBeNull();
  });

  it('ignores a warning that does not ask for consent', () => {
    expect(
      findSafetyTrigger(createSteps('caution'), [
        { questionSlug: 'safety-check', value: ['dizziness'] },
      ])
    ).toBeNull();
  });

  it('gates a warning no answer raised, with no options to record', () => {
    const steps = [
      createStep(1, [
        {
          priority: 1,
          conditions: [],
          action: {
            type: 'show_warning',
            warningMessage: ADVICE,
            warningType: 'seek_medical',
            continueAfterWarning: true,
          },
        },
      ]),
    ];

    expect(findSafetyTrigger(steps, [])).toEqual({
      questionSlug: null,
      selectedOptions: [],
      warningMessage: ADVICE,
    });
  });

  it('is pure: it leaves its inputs alone and answers the same way twice', () => {
    const steps = createSteps();
    const answers = [{ questionSlug: 'safety-check', value: ['chest-pain'] }];
    const before = structuredClone({ steps, answers });

    const first = findSafetyTrigger(steps, answers);
    const second = findSafetyTrigger(steps, answers);

    expect(second).toEqual(first);
    expect({ steps, answers }).toEqual(before);
  });
});
