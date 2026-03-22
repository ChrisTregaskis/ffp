import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  type AdminCreateUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CUSTOM_ATTRIBUTES } from '../../core/src/lib/constants.js';
import { createLogger } from '../src/lib/logger.js';
import type { SuperAdminCognitoSeed, PlatformOrganisationSeed } from './types.js';

const logger = createLogger('seed-super-admin-cognito');

/**
 * Cognito region
 * Defaults to eu-west-2 (London) for GDPR compliance if AWS_REGION not set
 */
const COGNITO_REGION = process.env.AWS_REGION ?? 'eu-west-2';

/**
 * Cognito client instance
 */
const cognito = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

/**
 * Validates required environment variables for Cognito operations
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = (): void => {
  const requiredVars = ['COGNITO_USER_POOL_ID'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Seeds the super admin user in AWS Cognito with exact data from configuration.
 * This is NOT idempotent - it will fail if the user already exists.
 *
 * Note: This imports from @ffp/core which is a dev-time dependency for seeding only.
 *
 * @param cognitoData - Super admin Cognito seed data from config
 * @param organisationData - Platform organisation data (schema-derived, for custom attributes)
 * @throws {Error} If Cognito operation fails
 */
export const seedSuperAdminCognito = async (
  cognitoData: SuperAdminCognitoSeed,
  organisationData: PlatformOrganisationSeed
): Promise<AdminCreateUserCommandOutput> => {
  logger.info('Seeding super admin in Cognito...');

  validateEnvironment();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userPoolId = process.env.COGNITO_USER_POOL_ID!;

  try {
    const response = await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: cognitoData.email,
        UserAttributes: [
          { Name: 'email', Value: cognitoData.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: 'System' },
          { Name: 'family_name', Value: 'Admin' },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.ORGANISATION_ID, Value: organisationData.id },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.ROLE, Value: 'system_admin' },
        ],
        TemporaryPassword: cognitoData.temporaryPassword,
        DesiredDeliveryMediums: ['EMAIL'],
      })
    );

    logger.info('Super admin created in Cognito', { email: cognitoData.email });
    logger.warn('Temporary password set', { temporaryPassword: cognitoData.temporaryPassword });

    return response;
  } catch (error) {
    // If user already exists, skip creation (common when re-seeding database)
    if (error instanceof Error && error.name === 'UsernameExistsException') {
      logger.info('Super admin already exists in Cognito (skipped)', {
        email: cognitoData.email,
        cognitoSub: cognitoData.cognitoSub,
      });

      // Return empty response - user already exists
      return {} as AdminCreateUserCommandOutput;
    }
    throw error;
  }
};
