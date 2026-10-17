import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IconBadge } from './IconBadge';

const badgeClass = (container: HTMLElement): string => container.firstElementChild?.className ?? '';

describe('IconBadge', () => {
  it('lifts on hover, and a solid badge casts a shadow, by default', () => {
    const { container } = render(<IconBadge name="Check" variant="success" appearance="solid" />);

    expect(badgeClass(container)).toContain('hover:scale-110');
    expect(badgeClass(container)).toContain('shadow-lg');
  });

  it('drops the hover lift and the solid shadow when static', () => {
    const { container } = render(
      <IconBadge name="Check" variant="success" appearance="solid" size="xl" static />
    );

    expect(badgeClass(container)).not.toContain('hover:scale-110');
    expect(badgeClass(container)).not.toContain('shadow-lg');
    expect(badgeClass(container)).toContain('bg-success');
    expect(badgeClass(container)).toContain('h-16 w-16');
  });

  it('has no fill when plain', () => {
    const { container } = render(<IconBadge name="Search" variant="neutral" appearance="plain" />);

    expect(badgeClass(container)).not.toMatch(/\bbg-/);
  });
});
