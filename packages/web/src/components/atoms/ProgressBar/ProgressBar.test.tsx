import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('is a progress bar named by its aria-label, with its rounded value', () => {
    render(<ProgressBar percent={33.4} aria-label="Overall progress" />);

    const bar = screen.getByRole('progressbar', { name: 'Overall progress' });
    expect(bar.getAttribute('aria-valuenow')).toBe('33');
  });
});
