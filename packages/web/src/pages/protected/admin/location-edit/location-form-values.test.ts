import { describe, expect, it } from 'vitest';

import type { LocationDetailResponse } from '@ffp/core';

import {
  deactivatesLocation,
  toLocationFormValues,
  toUpdateLocationInput,
} from './location-form-values';

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

  it('sends an undefined address when every line is cleared', () => {
    const location = stored();
    const values = {
      ...toLocationFormValues(location),
      addressLine1: '',
      city: '',
      postcode: '',
    };
    const payload = toUpdateLocationInput(values, location);

    expect('address' in payload).toBe(true);
    expect(payload.address).toBeUndefined();
  });
});

describe('deactivatesLocation', () => {
  it('holds an edit that takes the location out of use', () => {
    const location = stored();

    expect(
      deactivatesLocation({ ...toLocationFormValues(location), status: 'inactive' }, location)
    ).toBe(true);
  });

  it('lets an edit through that leaves an inactive location inactive', () => {
    const location = stored({ status: 'inactive' });

    expect(
      deactivatesLocation({ ...toLocationFormValues(location), locationName: 'Renamed' }, location)
    ).toBe(false);
  });
});
