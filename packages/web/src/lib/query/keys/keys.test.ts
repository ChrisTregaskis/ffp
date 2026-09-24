import { describe, expect, it } from 'vitest';

import {
  assessmentFlowKeys,
  locationKeys,
  organisationKeys,
  programmeTemplateKeys,
  userKeys,
} from './index';

/**
 * Pins the emitted arrays, not the shape. A key that changes silently orphans
 * every cache entry written under the old one and makes invalidation a no-op,
 * which nothing else here would catch.
 */
describe('entity query keys', () => {
  it.each([
    ['locations', locationKeys],
    ['organisations', organisationKeys],
    ['users', userKeys],
    ['programme-templates', programmeTemplateKeys],
    ['assessment-flows', assessmentFlowKeys],
  ])('builds hierarchical keys for %s', (name, keys) => {
    expect(keys.all).toEqual([name]);
    expect(keys.lists()).toEqual([name, 'list']);
    expect(keys.list({ page: 1 })).toEqual([name, 'list', { page: 1 }]);
    expect(keys.details()).toEqual([name, 'detail']);
    expect(keys.detail('abc123')).toEqual([name, 'detail', 'abc123']);
  });

  it('keeps a detail key under its list prefix so invalidating lists leaves it alone', () => {
    expect(locationKeys.detail('abc123').slice(0, 2)).toEqual(['locations', 'detail']);
    expect(locationKeys.lists()).toEqual(['locations', 'list']);
  });

  it('preserves the resource-specific keys that sit alongside the shared shape', () => {
    expect(userKeys.me()).toEqual(['users', 'me']);
    expect(programmeTemplateKeys.sessionExercises()).toEqual([
      'programme-templates',
      'session-exercises',
    ]);
    expect(programmeTemplateKeys.sessionExerciseList('s1')).toEqual([
      'programme-templates',
      'session-exercises',
      's1',
    ]);
  });
});
