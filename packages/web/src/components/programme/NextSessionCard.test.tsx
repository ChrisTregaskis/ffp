import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { NextSessionCard } from './NextSessionCard';
import { memberPhase } from './programme-test-fixture';

vi.mock('@web/hooks/videos', () => ({
  useVideoSignedUrlQuery: () => ({
    data: undefined,
    isPending: false,
    isError: true,
    refetch: vi.fn(),
  }),
}));

type Phase = ReturnType<typeof memberPhase>;

const renderCard = (phase: Phase): void => {
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <NextSessionCard
              session={phase.sessions[0]}
              phase={phase}
              totalPhaseSessions={phase.sessions.length}
              totalPhases={1}
            />
          }
        />
        <Route path="/programme/session/phaseonexxxx/session1xxxx" element={<p>Workout page</p>} />
        <Route path="/programme-overview" element={<p>Programme overview</p>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('NextSessionCard', () => {
  it('starts the session from a failed preview, which offers no Retry', async () => {
    renderCard(memberPhase(['not_started']));

    // The failed frame stays out of the accessibility tree; the card's controls name the action
    expect(screen.getByText('Unable to Load Video').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry', hidden: true })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Start session' }));

    expect(screen.getByText('Workout page').textContent).toBe('Workout page');
  });

  it('opens the programme overview', async () => {
    renderCard(memberPhase(['not_started']));

    await userEvent.click(screen.getByRole('button', { name: 'View Programme' }));

    expect(screen.getByText('Programme overview').textContent).toBe('Programme overview');
  });

  it('shows no duration badge for a session without a duration', () => {
    const phase = memberPhase(['not_started']);
    const session = { ...phase.sessions[0], estimatedDurationMinutes: 0 };

    const { container } = render(
      <MemoryRouter>
        <NextSessionCard session={session} phase={phase} totalPhaseSessions={1} totalPhases={1} />
      </MemoryRouter>
    );

    // A falsy duration must render nothing, not a stray 0 beside the exercise badge
    expect(container.textContent).not.toMatch(/exercises\s*0/);
  });
});
