import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { BranchingNotice } from './BranchingNotice';

describe('BranchingNotice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows its message until dismissed, and remembers the dismissal under its id', () => {
    const { unmount } = render(<BranchingNotice noticeId="notice-a" message="Steps branch." />);
    expect(screen.getByText('Steps branch.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('Steps branch.')).toBeNull();
    unmount();

    render(<BranchingNotice noticeId="notice-a" message="Steps branch." />);
    expect(screen.queryByText('Steps branch.')).toBeNull();
  });

  it('keeps a notice with another id showing', () => {
    render(<BranchingNotice noticeId="notice-a" message="First." />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    render(<BranchingNotice noticeId="notice-b" message="Second." />);
    expect(screen.getByText('Second.')).toBeTruthy();
  });
});
