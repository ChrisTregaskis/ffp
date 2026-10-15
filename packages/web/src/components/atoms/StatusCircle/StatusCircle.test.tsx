import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusCircle } from './StatusCircle';

describe('StatusCircle', () => {
  it('shows a tick, not the number, when completed', () => {
    const { container } = render(<StatusCircle status="completed" number={2} />);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.textContent).toBe('');
    expect(container.firstElementChild?.className).toContain('bg-ffp-green');
  });

  it('shows the number when current, or a dot with the dot marker', () => {
    const { container, rerender } = render(<StatusCircle status="current" number={3} />);
    expect(container.textContent).toBe('3');
    expect(container.firstElementChild?.className).toContain('bg-ffp-dark-blue');

    rerender(<StatusCircle status="current" number={3} currentMarker="dot" appearance="inverse" />);
    expect(container.textContent).toBe('');
    expect(container.firstElementChild?.className).toContain('bg-white/20');
  });

  it('shows the number when upcoming, filled or outlined', () => {
    const { container, rerender } = render(<StatusCircle status="upcoming" number={4} />);
    expect(container.textContent).toBe('4');
    expect(container.firstElementChild?.className).toContain('bg-muted');

    rerender(<StatusCircle status="upcoming" number={4} appearance="outlined" size="lg" />);
    expect(container.firstElementChild?.className).toContain('border-border');
    expect(container.firstElementChild?.className).toContain('h-10');
  });

  it('is an image named by its label, and has no role without one', () => {
    const { rerender } = render(
      <StatusCircle status="current" number={1} aria-label="Step 1: current" />
    );
    expect(screen.getByRole('img', { name: 'Step 1: current' })).toBeTruthy();

    rerender(<StatusCircle status="current" number={1} />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
