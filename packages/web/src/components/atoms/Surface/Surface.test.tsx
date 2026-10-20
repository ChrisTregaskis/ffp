import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Surface } from './Surface';

describe('Surface', () => {
  it('carries each variant with its own radius', () => {
    const { container, rerender } = render(<Surface variant="elevated" />);
    expect(container.firstElementChild?.className).toContain('shadow-md');
    expect(container.firstElementChild?.className).toContain('rounded-lg');

    rerender(<Surface variant="dashed" />);
    expect(container.firstElementChild?.className).toContain('border-dashed');
    expect(container.firstElementChild?.className).toContain('border-border');

    rerender(<Surface variant="gradient" />);
    expect(container.firstElementChild?.className).toContain('from-secondary/40');
    expect(container.firstElementChild?.className).toContain('rounded-2xl');
    expect(container.firstElementChild?.className).toContain('shadow-xl');
  });

  it('renders the requested element and forwards native attributes', () => {
    render(
      <Surface as="section" aria-label="Scores" className="mb-6">
        Scores
      </Surface>
    );
    const section = screen.getByRole('region', { name: 'Scores' });

    expect(section.tagName).toBe('SECTION');
    expect(section.className).toContain('mb-6');
  });
});
