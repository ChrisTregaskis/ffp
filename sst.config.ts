/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Configuration for Fit For Purpose (FFP)
 *
 * This configuration defines the infrastructure for the FFP platform.
 * Region: eu-west-2 (London) - UK-based audience
 * Stages: dev, staging (prod to be added later)
 *
 * VPC Strategy (Phase 1):
 * - Using AWS default VPC to avoid NAT Gateway costs (~£30-35/month)
 * - Resources (RDS, Lambda) will automatically use default VPC when no `vpc` prop specified
 * - Custom VPC with private subnets will be added pre-production (see FFP-101)
 */
export default $config({
  app(input) {
    return {
      name: 'ffp',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-2', // London region for UK-based audience
        },
      },
    };
  },
  async run() {
    // Cognito User Pool with custom attributes for multi-tenant authentication
    const userPool = new sst.aws.CognitoUserPool('UserPool', {
      usernames: ['email'], // Users sign in with email address
      transform: {
        userPool: (args: any) => {
          // Password policy configuration
          args.passwordPolicy = {
            minimumLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true,
            temporaryPasswordValidityDays: 7,
          };

          // Custom attributes for multi-tenant architecture
          // NOTE: AWS Cognito does not support required custom attributes
          // We must validate these at the application level during registration
          args.schemas = [
            {
              name: 'tenantId',
              attributeDataType: 'String',
              mutable: false, // Cannot be changed after creation
              required: false, // AWS limitation: custom attributes cannot be required
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '256',
              },
            },
            {
              name: 'role',
              attributeDataType: 'String',
              mutable: true, // Can be changed (e.g., user promotion)
              required: false, // AWS limitation: custom attributes cannot be required
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '50',
              },
            },
            {
              name: 'parentBusinessId',
              attributeDataType: 'String',
              mutable: true, // Can be changed if user switches businesses
              required: false, // Optional: only for sub-users under businesses
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '256',
              },
            },
          ];

          // Auto-verify email addresses
          args.autoVerifiedAttributes = ['email'];

          // Account recovery via email
          args.accountRecoverySetting = {
            recoveryMechanisms: [
              {
                name: 'verified_email',
                priority: 1,
              },
            ],
          };
        },
      },
    });

    // User Pool Client for web application
    const userPoolClient = userPool.addClient('Web', {
      transform: {
        client: (args: any) => {
          // OAuth configuration
          args.allowedOauthFlows = ['code'];
          args.allowedOauthScopes = ['email', 'openid', 'profile'];
          args.allowedOauthFlowsUserPoolClient = true;

          // Callback URLs (localhost for dev, will add production URLs later)
          args.callbackUrls = ['http://localhost:5173/auth/callback'];
          args.logoutUrls = ['http://localhost:5173'];

          // Token validity periods
          args.accessTokenValidity = 60; // 60 minutes
          args.idTokenValidity = 60; // 60 minutes
          args.refreshTokenValidity = 30; // 30 days
          args.tokenValidityUnits = {
            accessToken: 'minutes',
            idToken: 'minutes',
            refreshToken: 'days',
          };

          // Enable token revocation
          args.enableTokenRevocation = true;

          // Prevent client secret (not needed for SPA)
          args.generateSecret = false;
        },
      },
    });

    // Export User Pool and Client details
    return {
      userPoolId: userPool.id,
      userPoolArn: userPool.arn,
      userPoolClientId: userPoolClient.id,
      region: 'eu-west-2',
    };
  },
});
