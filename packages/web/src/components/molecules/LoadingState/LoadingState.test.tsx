import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('announces itself through the spinner and shows the message', () => {
    render(<LoadingState message="Loading your programme..." />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(screen.getByText('Loading your programme...')).toBeTruthy();
  });
});
