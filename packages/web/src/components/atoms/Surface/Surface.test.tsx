import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Surface } from './Surface';

describe('Surface', () => {
  it('is a plain bordered card box with no padding by default', () => {
    const { container } = render(<Surface>Content</Surface>);
    const box = container.firstElementChild;

    expect(box?.tagName).toBe('DIV');
    expect(box?.className).toBe('border bg-card border-border rounded-lg');
  });

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

  it('applies padding, a radius override and the muted border', () => {
    const { container, rerender } = render(<Surface padding="row" radius="md" border="muted" />);
    const className = container.firstElementChild?.className ?? '';
    expect(className).toContain('px-3 py-2');
    expect(className).toContain('rounded-md');
    expect(className).toContain('border-muted');

    rerender(<Surface padding="bar" />);
    expect(container.firstElementChild?.className).toContain('px-5 py-4');
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
