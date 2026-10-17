import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ScoringDryRunMapping } from '@ffp/core';

import { ScoringOutcome } from './ScoringOutcome';

const mapping = (overrides: Partial<ScoringDryRunMapping>): ScoringDryRunMapping => ({
  index: 0,
  operator: 'and',
  conditions: [],
  programmeSlug: 'level-2-active-wellness',
  programmeName: 'Level 2: Active Wellness',
  programmeActive: true,
  level: 2,
  ...overrides,
});

describe('ScoringOutcome', () => {
  it('shows the level and programme a member would be given', () => {
    render(<ScoringOutcome matched={mapping({})} />);

    expect(screen.getByText('Level 2')).toBeTruthy();
    expect(screen.getByText('Level 2: Active Wellness')).toBeTruthy();
  });

  it.each([
    ['inactive', mapping({ programmeActive: false }), 'whose programme template is inactive'],
    [
      'missing',
      mapping({ programmeActive: null, programmeName: null }),
      'which no programme template carries',
    ],
  ])('warns rather than promising a %s programme', (_case, matched, reason) => {
    render(<ScoringOutcome matched={matched} />);

    expect(screen.getByText(new RegExp(reason))).toBeTruthy();
    expect(screen.queryByText('Level 2')).toBeNull();
  });

  it('says when no rule matches', () => {
    render(<ScoringOutcome matched={null} />);

    expect(screen.getByText(/finish without a recommended level/)).toBeTruthy();
  });
});
