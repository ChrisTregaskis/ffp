import { describe, expect, it } from 'vitest';

import type { OrganisationDetailResponse } from '@ffp/core';

import {
  deactivatesOrganisation,
  toOrganisationFormValues,
  toUpdateOrganisationInput,
} from './organisation-form-values';

const stored = (
  overrides: Partial<OrganisationDetailResponse> = {}
): OrganisationDetailResponse => ({
  id: '66666666-6666-6666-8666-666666660001',
  publicId: 'cccccccccccc',
  type: 'business',
  name: 'Harbour Wellness',
  status: 'active',
  settings: {},
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('toUpdateOrganisationInput', () => {
  it('sends nothing when the form matches the stored organisation', () => {
    const organisation = stored();

    expect(toUpdateOrganisationInput(toOrganisationFormValues(organisation), organisation)).toEqual(
      {}
    );
  });

  it('sends only the changed field', () => {
    const organisation = stored();

    expect(
      toUpdateOrganisationInput(
        { ...toOrganisationFormValues(organisation), status: 'suspended' },
        organisation
      )
    ).toEqual({ status: 'suspended' });
  });

  it('sends a blanked name as an empty string, leaving validation to the form', () => {
    const organisation = stored();

    expect(
      toUpdateOrganisationInput(
        { ...toOrganisationFormValues(organisation), organisationName: '' },
        organisation
      )
    ).toEqual({ name: '' });
  });
});

describe('deactivatesOrganisation', () => {
  it('holds an edit that takes the organisation out of use', () => {
    const organisation = stored();

    expect(
      deactivatesOrganisation(
        { ...toOrganisationFormValues(organisation), status: 'inactive' },
        organisation
      )
    ).toBe(true);
  });

  it('lets a suspension through without asking', () => {
    const organisation = stored();

    expect(
      deactivatesOrganisation(
        { ...toOrganisationFormValues(organisation), status: 'suspended' },
        organisation
      )
    ).toBe(false);
  });
});
