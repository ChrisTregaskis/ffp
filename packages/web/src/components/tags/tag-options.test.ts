import { describe, expect, it } from 'vitest';

import type { AdminTagCategory } from '@ffp/core';

import { toTagOptions } from './tag-options';

const categories: AdminTagCategory[] = [
  {
    slug: 'movement',
    label: 'Movement',
    tags: [
      {
        publicId: 'mvstrength01',
        slug: 'strength',
        label: 'Strength',
        category: 'movement',
        isActive: true,
      },
      {
        publicId: 'mvretired001',
        slug: 'retired',
        label: 'Retired',
        category: 'movement',
        isActive: false,
      },
    ],
  },
];

describe('toTagOptions', () => {
  it('lists active tags and hides inactive ones the video does not carry', () => {
    expect(toTagOptions(categories, 'movement', [])).toEqual([
      { value: 'mvstrength01', label: 'Strength' },
    ]);
  });

  it('keeps a carried inactive tag listed, marked, whether or not it is still ticked', () => {
    expect(toTagOptions(categories, 'movement', ['mvretired001'])).toEqual([
      { value: 'mvstrength01', label: 'Strength' },
      { value: 'mvretired001', label: 'Retired (inactive)' },
    ]);
  });

  it('has no options while the categories are loading', () => {
    expect(toTagOptions(undefined, 'movement', ['mvretired001'])).toEqual([]);
  });
});
