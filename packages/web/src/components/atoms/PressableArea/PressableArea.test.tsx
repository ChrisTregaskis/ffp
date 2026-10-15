import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PressableArea } from './PressableArea';

describe('PressableArea', () => {
  it('renders a type="button" that forwards native attributes and its className', () => {
    render(
      <PressableArea aria-label="Start session" aria-current="step" className="w-full">
        Preview
      </PressableArea>
    );

    const area = screen.getByRole('button', { name: 'Start session' });
    expect(area.getAttribute('type')).toBe('button');
    expect(area.getAttribute('aria-current')).toBe('step');
    expect(area.className).toContain('w-full');
  });

  it('fires onClick once for a click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PressableArea onClick={onClick}>Open</PressableArea>);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);

    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('blocks clicks and keys while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PressableArea onClick={onClick} disabled>
        Open
      </PressableArea>
    );

    const area = screen.getByRole('button', { name: 'Open' });
    await user.click(area);
    area.focus();
    await user.keyboard('{Enter} ');

    expect(onClick).not.toHaveBeenCalled();
  });
});
