import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icons } from '@web/components/atoms';

import { PrescriptionBadge } from './PrescriptionBadge';

describe('PrescriptionBadge', () => {
  it('maps its colours onto the brand and success badges', () => {
    const { container, rerender } = render(
      <PrescriptionBadge label="3 sets x 12" icon={Icons.REPEAT} />
    );
    expect(container.firstElementChild?.className).toContain('bg-ffp-dark-blue text-white');

    rerender(<PrescriptionBadge label="30s rest" icon={Icons.CLOCK} variant="purple" />);
    expect(container.firstElementChild?.className).toContain(
      'bg-ffp-light-purple text-ffp-dark-blue'
    );

    rerender(<PrescriptionBadge label="45s" icon={Icons.CLOCK} variant="green" />);
    expect(container.firstElementChild?.className).toContain('bg-success text-white');
  });

  it('pairs each size with its corner radius', () => {
    const { container, rerender } = render(
      <PrescriptionBadge label="4 exercises" icon={Icons.REPEAT} size="sm" />
    );
    expect(container.firstElementChild?.className).toContain('py-1 text-xs');
    expect(container.firstElementChild?.className).toContain('rounded-md');

    rerender(<PrescriptionBadge label="4 exercises" icon={Icons.REPEAT} size="md" />);
    expect(container.firstElementChild?.className).toContain('py-2 text-sm');
    expect(container.firstElementChild?.className).toContain('rounded-lg');
  });
});
