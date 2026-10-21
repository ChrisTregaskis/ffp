import { describe, expect, it } from 'vitest';

import type { UserRole } from '@ffp/core';

import { routes } from '@web/config/routes';

import { getRoleHomePath } from './rbac';

const ROLES: UserRole[] = ['programme_user', 'customer_owner', 'customer_admin', 'system_admin'];

describe('getRoleHomePath', () => {
  it.each(ROLES)('sends a %s home to a page that role may open', (role) => {
    const { allowedRoles } = routes[getRoleHomePath(role)];

    // As ProtectedRoute judges it: no roles, or an empty list, admits everyone
    expect(allowedRoles?.length ? allowedRoles : [role]).toContain(role);
  });
});
