import { describe, expect, it } from 'vitest';

import type { TemplateDetailResponse } from '@ffp/core';

import { toTemplateFormValues, toUpdateTemplateInput } from './template-form-values';

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
