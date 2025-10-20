import { APP_NAME, TENANT_STATUS, TENANT_TYPES, USER_ROLES } from '@core/lib/constants';
import type { Tenant } from '@core/types/tenant.types';
import type { User } from '@core/types/user.types';

/**
 * Test file to verify TypeScript path aliases work correctly
 * This file uses internal @core/ aliases to import from other parts of core package
 */

export interface PathAliasTest {
  tenant: Tenant;
  user: User;
  appName: string;
}

/**
 * Test function demonstrating internal path aliases work
 */
export function testPathAliases(): PathAliasTest {
  const mockTenant: Tenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    type: TENANT_TYPES.BUSINESS,
    ownerUserId: 'test-owner-id',
    status: TENANT_STATUS.ACTIVE,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    tenantId: mockTenant.id,
    role: USER_ROLES.BUSINESS_USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    tenant: mockTenant,
    user: mockUser,
    appName: APP_NAME,
  };
}
