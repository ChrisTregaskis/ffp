import { describe, expect, it } from 'vitest';

import type { LocationDetailResponse } from '@ffp/core';

import { toLocationFormValues, toUpdateLocationInput } from './location-form-values';

const stored = (overrides: Partial<LocationDetailResponse> = {}): LocationDetailResponse => ({
  id: '77777777-7777-7777-8777-777777770001',
  publicId: 'dddddddddddd',
  organisationId: '66666666-6666-6666-8666-666666660001',
  organisationName: 'Harbour Wellness',
  name: 'Quayside Studio',
  accountCode: 'QS-001',
  address: { line1: '1 Quay Street', city: 'Bristol', postcode: 'BS1 1AA' },
  status: 'active',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('toUpdateLocationInput', () => {
  it('sends nothing when the form matches the stored location', () => {
    const location = stored();

    expect(toUpdateLocationInput(toLocationFormValues(location), location)).toEqual({});
  });

  it('treats a blank address over a null stored address as unchanged', () => {
    const location = stored({ address: null });

    expect(toUpdateLocationInput(toLocationFormValues(location), location)).toEqual({});
  });

  it('sends only the changed field', () => {
    const location = stored();

    expect(
      toUpdateLocationInput({ ...toLocationFormValues(location), locationName: 'Quay' }, location)
    ).toEqual({ name: 'Quay' });
  });

  it('sends the whole address when one line changes, leaving blank lines out', () => {
    const location = stored();

    expect(
      toUpdateLocationInput({ ...toLocationFormValues(location), city: 'Bath' }, location)
    ).toEqual({
      address: {
        line1: '1 Quay Street',
        line2: undefined,
        city: 'Bath',
        county: undefined,
        postcode: 'BS1 1AA',
        country: undefined,
      },
    });
  });

  it('sends a null address when every line is cleared, so the stored address is removed', () => {
    const location = stored();
    const values = {
      ...toLocationFormValues(location),
      addressLine1: '',
      city: '',
      postcode: '',
    };

    // An undefined address would be dropped from the request body and leave the stored one
    expect(toUpdateLocationInput(values, location)).toStrictEqual({ address: null });
  });

  it('keeps the remaining line when all but one are cleared', () => {
    const location = stored();
    const values = {
      ...toLocationFormValues(location),
      addressLine1: '',
      postcode: '',
    };

    expect(toUpdateLocationInput(values, location)).toEqual({
      address: {
        line1: undefined,
        line2: undefined,
        city: 'Bristol',
        county: undefined,
        postcode: undefined,
        country: undefined,
      },
    });
  });
});
