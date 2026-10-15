import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('announces itself through the spinner and shows the message', () => {
    render(<LoadingState message="Loading your programme..." />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(screen.getByText('Loading your programme...')).toBeTruthy();
  });

  it('renders the spinner alone without a message', () => {
    const { container } = render(<LoadingState />);

    expect(container.firstElementChild?.childElementCount).toBe(1);
  });

  it('sizes itself to the chosen layout', () => {
    const { container, rerender } = render(<LoadingState />);
    expect(container.firstElementChild?.className).toContain('py-16');

    rerender(<LoadingState layout="page" />);
    expect(container.firstElementChild?.className).toContain('min-h-[60vh]');

    rerender(<LoadingState layout="screen" />);
    expect(container.firstElementChild?.className).toContain('min-h-screen');

    rerender(<LoadingState layout="fill" className="animate-pulse" />);
    expect(container.firstElementChild?.className).toContain('h-full w-full');
    expect(container.firstElementChild?.className).toContain('animate-pulse');
  });
});
