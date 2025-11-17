import { APP_NAME, TENANT_TYPES, USER_ROLES } from '@core/lib/constants';
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
export const testPathAliases = (): PathAliasTest => {
  const mockTenant: Tenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    type: TENANT_TYPES.BUSINESS,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'test-user-id',
    cognitoSub: 'test-cognito-sub',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    tenantId: mockTenant.id,
    role: USER_ROLES.CUSTOMER_ADMIN,
    customerId: null,
    profileImageUrl: null,
    phone: null,
    dateOfBirth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    tenant: mockTenant,
    user: mockUser,
    appName: APP_NAME,
  };
};
