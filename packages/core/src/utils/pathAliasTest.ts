import { APP_NAME, ORGANISATION_TYPES, USER_ROLES } from '../lib/constants';

import type { Organisation } from '../schemas/organisation.schema';
import type { User } from '../schemas/user.schema';

/**
 * Test file demonstrating internal imports within the core package
 * Uses relative imports since @core/ path aliases don't resolve within the same package
 */

export interface PathAliasTest {
  organisation: Organisation;
  user: User;
  appName: string;
}

/**
 * Test function demonstrating internal path aliases work
 */
export const testPathAliases = (): PathAliasTest => {
  const mockOrganisation: Organisation = {
    id: 'test-organisation-id',
    publicId: 'abc123def456',
    name: 'Test Organisation',
    type: ORGANISATION_TYPES.BUSINESS,
    status: 'active',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'test-user-id',
    publicId: 'usr123def456',
    cognitoSub: 'test-cognito-sub',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    organisationId: mockOrganisation.id,
    role: USER_ROLES.CUSTOMER_ADMIN,
    locationId: null,
    profileImageUrl: null,
    phone: null,
    dateOfBirth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    organisation: mockOrganisation,
    user: mockUser,
    appName: APP_NAME,
  };
};
