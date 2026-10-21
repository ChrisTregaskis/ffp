import { describe, expect, it } from 'vitest';

import type { TemplateDetailResponse } from '@ffp/core';

import {
  deactivatesTemplate,
  EMPTY_TEMPLATE_VALUES,
  toCreateTemplateInput,
  toTemplateFormValues,
  toUpdateTemplateInput,
} from './template-form-values';

const stored = (overrides: Partial<TemplateDetailResponse> = {}): TemplateDetailResponse => ({
  id: '55555555-5555-5555-8555-555555550001',
  publicId: 'bbbbbbbbbbbb',
  slug: 'gentle-mobility',
  name: 'Gentle Mobility',
  description: 'An easy start.',
  isActive: true,
  totalPhases: 0,
  difficulty: 'beginner',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  phases: [],
  ...overrides,
});

describe('toUpdateTemplateInput', () => {
  it('sends nothing when the form matches the stored template', () => {
    const template = stored();

    expect(toUpdateTemplateInput(toTemplateFormValues(template), template)).toEqual({});
  });

  it('sends only the changed field', () => {
    const template = stored();

    expect(
      toUpdateTemplateInput({ ...toTemplateFormValues(template), name: 'Gentle Start' }, template)
    ).toEqual({ name: 'Gentle Start' });
  });

  it('reads the active select as a boolean', () => {
    const template = stored();

    expect(
      toUpdateTemplateInput({ ...toTemplateFormValues(template), isActive: 'false' }, template)
    ).toEqual({ isActive: false });
  });

  it('clears a blanked description with null, and leaves a blank over null alone', () => {
    const template = stored();

    expect(
      toUpdateTemplateInput({ ...toTemplateFormValues(template), description: '' }, template)
    ).toEqual({ description: null });

    const noDescription = stored({ description: null });

    expect(toUpdateTemplateInput(toTemplateFormValues(noDescription), noDescription)).toEqual({});
  });
});

describe('toCreateTemplateInput', () => {
  it('trims the text fields and leaves a blank description out', () => {
    expect(
      toCreateTemplateInput({
        ...EMPTY_TEMPLATE_VALUES,
        name: '  Gentle Mobility ',
        slug: ' gentle-mobility ',
        description: '   ',
        difficulty: 'beginner',
      })
    ).toEqual({ name: 'Gentle Mobility', slug: 'gentle-mobility', difficulty: 'beginner' });
  });
});

describe('deactivatesTemplate', () => {
  it('holds an edit that takes an active template out of use', () => {
    const template = stored();

    expect(
      deactivatesTemplate({ ...toTemplateFormValues(template), isActive: 'false' }, template)
    ).toBe(true);
  });

  it('lets an edit through that leaves an inactive template inactive', () => {
    const template = stored({ isActive: false });

    expect(
      deactivatesTemplate({ ...toTemplateFormValues(template), name: 'Renamed' }, template)
    ).toBe(false);
  });
});
