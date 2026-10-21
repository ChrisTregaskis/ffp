import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { UserRole } from '@ffp/core';

import { useAuth } from '@web/hooks/useAuth';
import { useSidebar } from '@web/hooks/useSidebar';

import { SideMenu } from './SideMenu';

vi.mock('@web/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@web/hooks/useSidebar', () => ({ useSidebar: vi.fn() }));

const renderMenu = (role: UserRole, isCollapsed = false): void => {
  vi.mocked(useAuth).mockReturnValue({ user: { role } } as ReturnType<typeof useAuth>);
  vi.mocked(useSidebar).mockReturnValue({
    isCollapsed,
    toggleCollapsed: vi.fn(),
  } as unknown as ReturnType<typeof useSidebar>);
  render(
    <MemoryRouter initialEntries={['/admin/organisations']}>
      <SideMenu handleLogout={vi.fn()} />
    </MemoryRouter>
  );
};

describe('SideMenu', () => {
  it('groups the admin areas under their headings', () => {
    renderMenu('system_admin');

    const assessments = within(screen.getByRole('group', { name: 'Assessments' }));
    expect(assessments.getByText('Assessments', { selector: 'p' })).toBeTruthy();
    expect(assessments.getByText('Question Bank')).toBeTruthy();

    const programmes = within(screen.getByRole('group', { name: 'Programmes' }));
    for (const label of ['Programme Templates', 'Exercises', 'Exercise Tags']) {
      expect(programmes.getByText(label)).toBeTruthy();
    }
    expect(programmes.queryByText('Users')).toBe(null);
  });

  it('marks a group with a rule when collapsed', () => {
    renderMenu('system_admin', true);

    expect(screen.getByRole('separator', { name: 'Programmes' })).toBeTruthy();
  });

  it('leaves the member navigation ungrouped', () => {
    renderMenu('programme_user');

    expect(screen.queryByRole('separator')).toBe(null);
    expect(screen.queryByRole('group', { name: 'Programmes' })).toBe(null);
  });
});
