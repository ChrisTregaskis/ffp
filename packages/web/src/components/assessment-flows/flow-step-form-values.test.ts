import { describe, expect, it } from 'vitest';

import type { AdminFlowStepView } from '@ffp/core';

import {
  formValuesToStepInput,
  stepToFormValues,
  type FlowStepFormValues,
} from './flow-step-form-values';

const TEMPLATE_ID = '11111111-1111-1111-8111-111111111101';

const step = (overrides: Partial<AdminFlowStepView> = {}): AdminFlowStepView => ({
  publicId: 'aaaaaaaaaaaa',
  order: 1,
  type: 'intro',
  templateId: null,
  config: { title: 'A step' },
  branchingRuleCount: 0,
  ...overrides,
});

const values = (overrides: Partial<FlowStepFormValues> = {}): FlowStepFormValues => ({
  type: 'intro',
  title: 'A step',
  description: '',
  estimatedMinutes: '',
  instructions: '',
  safetyNotes: '',
  templateId: '',
  ...overrides,
});

describe('stepToFormValues', () => {
  it('renders a stored string list as one item per line', () => {
    const result = stepToFormValues(
      step({ type: 'transition', config: { title: 'Pause', safetyNotes: ['First', 'Second'] } })
    );

    expect(result.safetyNotes).toBe('First\nSecond');
  });

  it('leaves absent optional fields empty rather than showing "undefined"', () => {
    const result = stepToFormValues(step());

    expect(result).toMatchObject({
      description: '',
      estimatedMinutes: '',
      instructions: '',
      safetyNotes: '',
      templateId: '',
    });
  });

  // Guards the truthiness trap that renders any falsy number as an empty field
  it('keeps a numeric estimate as its string form', () => {
    const result = stepToFormValues(step({ config: { title: 'A step', estimatedMinutes: 25 } }));

    expect(result.estimatedMinutes).toBe('25');
  });
});

describe('formValuesToStepInput', () => {
  it('drops blank lines and surrounding whitespace from a list', () => {
    const result = formValuesToStepInput(
      values({ type: 'transition', safetyNotes: '  First  \n\n   \nSecond\n' })
    );

    expect(result.config.safetyNotes).toEqual(['First', 'Second']);
  });

  it('omits an emptied list rather than sending an empty array', () => {
    const result = formValuesToStepInput(values({ safetyNotes: '   \n  ' }));

    expect(result.config.safetyNotes).toBeUndefined();
  });

  it('omits an unparseable estimate rather than sending NaN', () => {
    const result = formValuesToStepInput(values({ estimatedMinutes: '' }));

    expect(result.config.estimatedMinutes).toBeUndefined();
  });

  it('sends the template link for a type that takes one', () => {
    const result = formValuesToStepInput(values({ type: 'questions', templateId: TEMPLATE_ID }));

    expect(result.templateId).toBe(TEMPLATE_ID);
  });

  // A type switch must not carry the old link into the payload
  it('omits the template link for a type that takes none', () => {
    const result = formValuesToStepInput(values({ type: 'intro', templateId: TEMPLATE_ID }));

    expect(result.templateId).toBeUndefined();
  });

  it('round-trips a fully populated step unchanged', () => {
    const original = step({
      type: 'video-assessment',
      templateId: TEMPLATE_ID,
      config: {
        title: 'Movement check',
        description: 'Recorded on camera',
        instructions: ['Stand tall', 'Stay in frame'],
        estimatedMinutes: 8,
      },
    });

    const result = formValuesToStepInput(stepToFormValues(original));

    expect(result).toEqual({
      type: 'video-assessment',
      templateId: TEMPLATE_ID,
      config: {
        title: 'Movement check',
        description: 'Recorded on camera',
        instructions: ['Stand tall', 'Stay in frame'],
        safetyNotes: undefined,
        estimatedMinutes: 8,
      },
    });
  });
});
