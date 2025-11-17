import { APP_NAME, TENANT_TYPES, USER_ROLES } from '../lib/constants';

import type { Tenant } from '../schemas/tenant.schema';
import type { User } from '../schemas/user.schema';

/**
 * Test file demonstrating internal imports within the core package
 * Uses relative imports since @core/ path aliases don't resolve within the same package
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
