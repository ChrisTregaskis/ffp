import { describe, expect, it } from 'vitest';

import { toVideoListFilters } from './video-list-filters';

describe('toVideoListFilters', () => {
  it('keeps the status and difficulty filters when a tag is selected', () => {
    expect(
      toVideoListFilters({
        search: 'squat',
        status: 'active',
        difficulty: 'beginner',
        'tag-goal': 'goposture001',
      })
    ).toEqual({
      search: 'squat',
      status: 'active',
      difficulty: 'beginner',
      tags: ['goposture001'],
    });
  });

  it('joins one selection per category into the tags filter', () => {
    expect(
      toVideoListFilters({
        'tag-goal': 'goposture001',
        'tag-movement': 'mvstrength01',
        'tag-audience': undefined,
      })
    ).toEqual({ tags: ['goposture001', 'mvstrength01'] });
  });

  it('sends no tags filter when no tag is selected', () => {
    expect(toVideoListFilters({ status: 'draft', 'tag-goal': undefined })).toEqual({
      status: 'draft',
    });
  });
});
