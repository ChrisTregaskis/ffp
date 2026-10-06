import { describe, expect, it } from 'vitest';

import { ACTIVE_STATUS_FILTER, ACTIVE_STATUS_MAP, toActiveStatus } from './active-status';

describe('toActiveStatus', () => {
  it('maps the flag to a key the status map knows', () => {
    expect(toActiveStatus(true)).toBe('active');
    expect(toActiveStatus(false)).toBe('inactive');
    expect(ACTIVE_STATUS_MAP[toActiveStatus(true)]?.label).toBe('Active');
    expect(ACTIVE_STATUS_MAP[toActiveStatus(false)]?.label).toBe('Inactive');
  });
});

describe('ACTIVE_STATUS_FILTER', () => {
  it('filters on the isActive query parameter with string booleans', () => {
    expect(ACTIVE_STATUS_FILTER.key).toBe('isActive');
    expect(ACTIVE_STATUS_FILTER.options.map((option) => option.value)).toEqual(['true', 'false']);
  });
});
