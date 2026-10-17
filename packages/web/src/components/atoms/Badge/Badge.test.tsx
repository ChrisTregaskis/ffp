import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icons } from '../Icon';

import { Badge } from './Badge';

describe('Badge', () => {
  it('colours by variant and appearance', () => {
    const { container, rerender } = render(
      <Badge label="Active" variant="success" appearance="solid" />
    );
    expect(container.firstElementChild?.className).toContain('bg-success text-white');

    rerender(<Badge label="2 rules" variant="info" />);
    expect(container.firstElementChild?.className).toContain('bg-info/10 text-info');

    rerender(<Badge label="Inactive" variant="muted" appearance="solid" />);
    expect(container.firstElementChild?.className).toContain('bg-muted-foreground text-white');
  });

  it('takes half a step more side padding when fully rounded', () => {
    const { container, rerender } = render(<Badge label="Tag" />);
    expect(container.firstElementChild?.className).toContain('px-2.5');

    rerender(<Badge label="Tag" shape="md" />);
    expect(container.firstElementChild?.className).toContain('px-2 ');
    expect(container.firstElementChild?.className).toContain('rounded-md');

    rerender(<Badge label="3 sets" size="md" shape="lg" />);
    expect(container.firstElementChild?.className).toContain('px-3.5');
    expect(container.firstElementChild?.className).toContain('py-2 text-sm');
    expect(container.firstElementChild?.className).toContain('rounded-lg');
  });

  it('renders a leading icon only when given one', () => {
    const { container, rerender } = render(<Badge label="1 rule" />);
    expect(container.querySelector('svg')).toBeNull();

    rerender(<Badge label="1 rule" icon={Icons.REPEAT} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('forwards native attributes', () => {
    render(<Badge label="1 rule" title="Routes conditionally" />);
    expect(screen.getByTitle('Routes conditionally').textContent).toBe('1 rule');
  });
});
