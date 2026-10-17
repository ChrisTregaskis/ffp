import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorRetryState } from './ErrorRetryState';

describe('ErrorRetryState', () => {
  it('says what failed and repeats the request on "Try again"', async () => {
    const onRetry = vi.fn();
    render(<ErrorRetryState title="We couldn't load this just now." onRetry={onRetry} />);

    expect(screen.getByText("We couldn't load this just now.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
