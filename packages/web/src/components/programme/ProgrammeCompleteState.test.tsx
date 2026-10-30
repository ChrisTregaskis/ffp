import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProgrammeCompleteState } from './ProgrammeCompleteState';

const renderState = (): void => {
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={<ProgrammeCompleteState completedPhases={4} completedSessions={12} />}
        />
        <Route path="/programme-overview" element={<p>Programme overview</p>} />
        <Route path="/assessment-overview" element={<p>Assessment overview</p>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProgrammeCompleteState', () => {
  it('opens the programme overview', async () => {
    renderState();

    await userEvent.click(screen.getByRole('button', { name: 'View Programme' }));

    expect(screen.getByText('Programme overview').textContent).toBe('Programme overview');
  });

  it('opens the assessment overview to start a new assessment', async () => {
    renderState();

    await userEvent.click(screen.getByRole('button', { name: 'Start New Assessment' }));

    expect(screen.getByText('Assessment overview').textContent).toBe('Assessment overview');
  });
});
