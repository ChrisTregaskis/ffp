import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  type AdminCreateUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CUSTOM_ATTRIBUTES } from '../../core/src/lib/constants.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { SuperAdminCognitoSeed, PlatformTenantSeed } from './types.js';

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
 * @param tenantData - Platform tenant data (schema-derived, for custom attributes)
 * @throws {Error} If Cognito operation fails
 */
export const seedSuperAdminCognito = async (
  cognitoData: SuperAdminCognitoSeed,
  tenantData: PlatformTenantSeed
): Promise<AdminCreateUserCommandOutput> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding super admin in Cognito...`);

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
          { Name: COGNITO_CUSTOM_ATTRIBUTES.TENANT_ID, Value: tenantData.id },
          { Name: COGNITO_CUSTOM_ATTRIBUTES.ROLE, Value: 'system_admin' },
        ],
        TemporaryPassword: cognitoData.temporaryPassword,
        DesiredDeliveryMediums: ['EMAIL'],
      })
    );

    console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Super admin created in Cognito`);
    console.log(`  Email: ${cognitoData.email}`);
    console.log(
      `  ${terminalPrefix(TerminalPrefix.WARNING)} Temporary password: ${cognitoData.temporaryPassword}`
    );

    return response;
  } catch (error) {
    // If user already exists, skip creation (common when re-seeding database)
    if (error instanceof Error && error.name === 'UsernameExistsException') {
      console.log(
        `${terminalPrefix(TerminalPrefix.SUCCESS)} Super admin already exists in Cognito (skipped)`
      );
      console.log(`  Email: ${cognitoData.email}`);
      console.log(`  Cognito Sub: ${cognitoData.cognitoSub} (from config)`);

      // Return empty response - user already exists
      return {} as AdminCreateUserCommandOutput;
    }
    throw error;
  }
};
