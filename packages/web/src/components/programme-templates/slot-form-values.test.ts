import { describe, expect, it } from 'vitest';

import type { SlotResponse } from '@ffp/core';

import { slotToFormValues, toCreateSlotRequest, toUpdateSlotRequest } from './slot-form-values';

const stored: SlotResponse = {
  publicId: 'slot00000001',
  orderIndex: 0,
  category: 'movement',
  categoryLabel: 'Movement',
  tags: [
    { publicId: 'mvstretch001', slug: 'stretch', label: 'Stretch', isActive: true },
    { publicId: 'mvmobility01', slug: 'mobility', label: 'Mobility', isActive: true },
  ],
  isRequired: true,
  label: 'Warm-up',
  poolSize: 3,
  isPoolEmpty: false,
  hasInactiveTags: false,
};

describe('slot form values', () => {
  it('stores a blank label as null on create', () => {
    expect(
      toCreateSlotRequest({ category: 'audience', tags: [], isRequired: false, label: '' })
    ).toEqual({ category: 'audience', tags: [], isRequired: false, label: null });
  });

  it('sends nothing when the form matches the stored slot, in any tag order', () => {
    const values = slotToFormValues(stored);

    expect(toUpdateSlotRequest({ ...values, tags: [...values.tags].reverse() }, stored)).toEqual(
      {}
    );
  });

  it('sends only what changed, and clears the label with null', () => {
    const values = slotToFormValues(stored);

    expect(
      toUpdateSlotRequest(
        { ...values, isRequired: false, label: '', tags: ['mvstretch001'] },
        stored
      )
    ).toEqual({ isRequired: false, label: null, tags: ['mvstretch001'] });
  });

  it('sends the tags with a new category, even when none are ticked', () => {
    expect(
      toUpdateSlotRequest({ ...slotToFormValues(stored), category: 'body-area', tags: [] }, stored)
    ).toEqual({ category: 'body-area', tags: [] });
  });
});
