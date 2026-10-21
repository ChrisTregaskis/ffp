import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { MobileMenu } from './MobileMenu';

import type { MobileMenuNavItem } from './MobileMenu';

const item = (label: string, group?: string): MobileMenuNavItem => ({
  key: label,
  label,
  icon: 'Home',
  path: `/${label.toLowerCase()}`,
  section: 'main',
  group,
});

describe('MobileMenu', () => {
  it('shows each group under its heading, and ungrouped items above them', async () => {
    render(
      <MemoryRouter>
        <MobileMenu
          navItems={[
            item('Users'),
            item('Assessments', 'Assessments'),
            item('Exercises', 'Programmes'),
            item('Exercise Tags', 'Programmes'),
          ]}
        />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Toggle mobile menu' }));

    const programmes = screen.getByRole('group', { name: 'Programmes' });
    expect(within(programmes).getByText('Programmes')).toBeTruthy();
    expect(within(programmes).getByText('Exercises')).toBeTruthy();
    expect(within(programmes).getByText('Exercise Tags')).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'Assessments' })).queryByText('Users')).toBe(
      null
    );
    expect(screen.getByText('Users')).toBeTruthy();
  });
});
