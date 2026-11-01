import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { PhaseTimelineCard } from './PhaseTimelineCard';
import { memberPhase } from './programme-test-fixture';

describe('PhaseTimelineCard', () => {
  // jsdom has no IntersectionObserver; the first phase is expanded without one
  beforeAll(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('counts a skipped session as done', () => {
    const phase = memberPhase(['completed', 'skipped', 'completed'], 'completed');

    render(
      <MemoryRouter>
        <PhaseTimelineCard phase={phase} isFirst isLast nextSession={undefined} />
      </MemoryRouter>
    );

    expect(screen.getByText('3 of 3 sessions').textContent).toBe('3 of 3 sessions');
    expect(
      screen
        .getByRole('progressbar', { name: 'Phase session progress' })
        .getAttribute('aria-valuenow')
    ).toBe('100');
  });
});
