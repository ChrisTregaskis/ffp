import { describe, expect, it } from 'vitest';

import { groupNavItems } from './nav-groups';

describe('groupNavItems', () => {
  it('makes one section per run of items sharing a group', () => {
    const sections = groupNavItems([
      { key: 'users' },
      { key: 'locations' },
      { key: 'templates', group: 'Programmes' },
      { key: 'exercises', group: 'Programmes' },
    ]);

    expect(sections).toEqual([
      { heading: undefined, items: [{ key: 'users' }, { key: 'locations' }] },
      {
        heading: 'Programmes',
        items: [
          { key: 'templates', group: 'Programmes' },
          { key: 'exercises', group: 'Programmes' },
        ],
      },
    ]);
  });
});
