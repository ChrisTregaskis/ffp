import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { memberPhase } from './programme-test-fixture';
import { SessionRow } from './SessionRow';

type Phase = ReturnType<typeof memberPhase>;

const renderRow = (phase: Phase, index: number, isNext: boolean): void => {
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <SessionRow
              session={phase.sessions[index]}
              phasePublicId={phase.publicId}
              isNext={isNext}
            />
          }
        />
        <Route path="/programme/session/phaseonexxxx/session1xxxx" element={<p>Workout page</p>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('SessionRow', () => {
  it('shows a skipped session as done, with its Skipped badge', () => {
    renderRow(memberPhase(['completed', 'skipped', 'not_started']), 1, false);

    expect(screen.getByText('Skipped').textContent).toBe('Skipped');
    // A done session's circle carries a tick in place of its number
    expect(screen.queryByText('2')).toBeNull();
  });

  it('opens the session’s workout from Start', async () => {
    renderRow(memberPhase(['not_started']), 0, true);

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByText('Workout page').textContent).toBe('Workout page');
  });
});
