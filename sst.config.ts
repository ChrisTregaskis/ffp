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
    const requiredDbEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as const;
    const missingVars = requiredDbEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required database environment variables: ${missingVars.join(', ')}. ` +
          'Please ensure these are set before deploying.'
      );
    }

    // Type-safe access to validated environment variables
    const dbEnv = {
      DB_HOST: process.env.DB_HOST!,
      DB_PORT: process.env.DB_PORT!,
      DB_NAME: process.env.DB_NAME!,
      DB_USER: process.env.DB_USER!,
      DB_PASSWORD: process.env.DB_PASSWORD!,
      DB_SSL: process.env.DB_SSL || 'false',
    };

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
              name: 'customerId',
              attributeDataType: 'String',
              mutable: true, // Can be changed if user switches customers
              required: false, // Optional: only for users under customer organisations
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
          args.callbackUrls = ['http://localhost:3000/auth/callback'];
          args.logoutUrls = ['http://localhost:3000'];

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

          // Auth flows: SRP for browser, USER_PASSWORD for server/testing
          args.explicitAuthFlows = [
            'ALLOW_USER_SRP_AUTH',
            'ALLOW_USER_PASSWORD_AUTH',
            'ALLOW_REFRESH_TOKEN_AUTH',
          ];

          // Prevent client secret (not needed for SPA)
          args.generateSecret = false;
        },
      },
    });

    // S3 Buckets for video and asset storage
    const videosBucket = new sst.aws.Bucket('VideosBucket', {
      cors: {
        allowHeaders: ['*'],
        allowMethods: ['GET', 'HEAD'],
        allowOrigins: ['*'], // Will be restricted to specific origins in production
      },
      transform: {
        bucket: (args: any) => {
          // Enable AES256 encryption at rest
          args.serverSideEncryptionConfiguration = {
            rules: [
              {
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: 'AES256',
                },
              },
            ],
          };
        },
      },
    });

    const assetsBucket = new sst.aws.Bucket('AssetsBucket', {
      cors: {
        allowHeaders: ['*'],
        allowMethods: ['GET', 'HEAD'],
        allowOrigins: ['*'], // Will be restricted to specific origins in production
      },
      transform: {
        bucket: (args: any) => {
          // Enable AES256 encryption at rest
          args.serverSideEncryptionConfiguration = {
            rules: [
              {
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: 'AES256',
                },
              },
            ],
          };
        },
      },
    });

    // CloudFront CDN for video delivery
    const videoCdn = new sst.aws.Cdn('VideoCdn', {
      origins: [
        {
          domainName: videosBucket.domain,
          originId: 'S3-Videos',
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: 'S3-Videos',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        defaultTtl: 86400, // 24 hours
        minTtl: 0,
        maxTtl: 31536000, // 1 year
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
      },
      transform: {
        distribution: (args: any) => {
          // Use only North America and Europe for cost optimisation
          args.priceClass = 'PriceClass_100';
        },
      },
    });

    // API Gateway with Cognito JWT Authorizer
    // CORS origins are stage-aware to support different environments
    // Any stage other than 'staging' or 'production' defaults to localhost (for dev and personal stages)
    const allowedOrigins =
      $app.stage === 'production'
        ? ['https://app.fitforpurpose.app'] // TODO: Replace with actual production domain when available
        : $app.stage === 'staging'
          ? ['https://staging.fitforpurpose.app'] // TODO: Replace with actual staging domain when available
          : ['http://localhost:3000']; // Dev server (for 'dev', personal stages, etc.)

    const api = new sst.aws.ApiGatewayV2('Api', {
      cors: {
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowOrigins: allowedOrigins,
        allowHeaders: ['*'],
        allowCredentials: true,
      },
      transform: {
        api: (args: any) => {
          // Global throttle settings apply to all routes
          // 1000 requests/minute (~16 req/sec) is appropriate during development and staging
          // Health check endpoint is public but these limits prevent abuse
          // Per-route throttling can be added later if specific endpoints need different limits
          args.throttleSettings = {
            rateLimit: 1000, // Requests per minute
            burstLimit: 2000, // Maximum burst capacity
          };
        },
      },
    });

    // Add Cognito JWT authorizer
    // Note: authorizer is created here but will be used in future
    // for protected routes. Example: api.route('GET /users', { handler: '...', auth: { authorizer } })
    const authorizer = api.addAuthorizer({
      name: 'CognitoAuthorizer',
      jwt: {
        issuer: $interpolate`https://cognito-idp.eu-west-2.amazonaws.com/${userPool.id}`,
        audiences: [userPoolClient.id],
      },
    });

    // Handler environment variables
    const handlerEnv = {
      environment: {
        COGNITO_USER_POOL_ID: userPool.id,
        COGNITO_CLIENT_ID: userPoolClient.id,
        COGNITO_REGION: 'eu-west-2',
        ...dbEnv,
      },
    };

    // Args parameter for routes requiring authentication
    const args = {
      auth: {
        jwt: {
          authorizer: authorizer.id,
        },
      },
    };

    const cognitoPermissionActions = [
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminDeleteUser',
      'cognito-idp:AdminGetUser',
      'cognito-idp:AdminUpdateUserAttributes',
    ];

    const repositoryFunctionsPath = 'packages/functions/src';

    // Public health check endpoint (no authentication required)
    api.route('GET /health', {
      handler: `${repositoryFunctionsPath}/health/check.handler`,
      ...handlerEnv,
    });

    // Auth domain routes (mix of public and protected routes)
    // Note: Authentication is handled per-endpoint in the router
    // - Public: /auth/login, /auth/complete-new-password
    // - Protected: /auth/invite-user (requires JWT)
    api.route('ANY /auth/{proxy+}', {
      handler: `${repositoryFunctionsPath}/auth/index.handler`,
      ...handlerEnv,
      permissions: [
        {
          actions: cognitoPermissionActions,
          resources: [userPool.arn],
        },
      ],
    });

    // CORS preflight routes (no JWT authorizer — browser OPTIONS requests carry no token)
    // API Gateway CORS config adds response headers; Lambda returns 204 via router
    api.route('OPTIONS /admin/{proxy+}', {
      handler: `${repositoryFunctionsPath}/admin/index.handler`,
      ...handlerEnv,
    });
    api.route('OPTIONS /user/{proxy+}', {
      handler: `${repositoryFunctionsPath}/user/index.handler`,
      ...handlerEnv,
    });
    api.route('OPTIONS /assessments/{proxy+}', {
      handler: `${repositoryFunctionsPath}/assessments/index.handler`,
      ...handlerEnv,
    });
    api.route('OPTIONS /programmes/{proxy+}', {
      handler: `${repositoryFunctionsPath}/programs/index.handler`,
      ...handlerEnv,
    });

    // Admin domain routes (system_admin role required - validated in handlers)
    api.route(
      'ANY /admin/{proxy+}',
      { handler: `${repositoryFunctionsPath}/admin/index.handler`, ...handlerEnv },
      args
    );

    // User domain routes (authenticated users with user-specific requests)
    api.route(
      'ANY /user/{proxy+}',
      {
        handler: `${repositoryFunctionsPath}/user/index.handler`,
        ...handlerEnv,
        permissions: [
          {
            actions: cognitoPermissionActions,
            resources: [userPool.arn],
          },
        ],
      },
      args
    );

    // Assessments domain routes (authenticated users - assessment lifecycle)
    api.route(
      'ANY /assessments/{proxy+}',
      { handler: `${repositoryFunctionsPath}/assessments/index.handler`, ...handlerEnv },
      args
    );

    // Programmes domain routes (authenticated users - programme data)
    api.route(
      'ANY /programmes/{proxy+}',
      { handler: `${repositoryFunctionsPath}/programs/index.handler`, ...handlerEnv },
      args
    );

    // =========================================================================
    // JOB PROCESSING INFRASTRUCTURE
    // Lambda function exists in all stages for manual invocation.
    // Cron schedule only deployed in staging/production to avoid unnecessary
    // costs in development environments.
    // =========================================================================

    // Conservative timeout for batch job processing. Actual processing should
    // complete much faster, but this allows for cold starts and retries.
    const JOB_PROCESSOR_TIMEOUT = '5 minutes';

    // Job processor environment (database access only, no Cognito needed)
    const jobProcessorEnv = {
      environment: dbEnv,
    };

    // Job processor Lambda — available in all stages for manual triggering
    new sst.aws.Function('JobProcessor', {
      handler: `${repositoryFunctionsPath}/jobs/process-jobs.handler`,
      timeout: JOB_PROCESSOR_TIMEOUT,
      ...jobProcessorEnv,
    });

    // Cron schedule only in staging/production — no recurring costs in dev
    if ($app.stage === 'staging' || $app.stage === 'production') {
      new sst.aws.Cron('JobProcessorCron', {
        schedule: 'rate(1 minute)',
        job: {
          handler: `${repositoryFunctionsPath}/jobs/process-jobs.handler`,
          timeout: JOB_PROCESSOR_TIMEOUT,
          ...jobProcessorEnv,
        },
      });
    }

    // Export resource identifiers
    return {
      // Cognito resources
      userPoolId: userPool.id,
      userPoolArn: userPool.arn,
      userPoolClientId: userPoolClient.id,
      // Storage resources
      videosBucket: videosBucket.name,
      assetsBucket: assetsBucket.name,
      cdnUrl: videoCdn.url,
      // API Gateway
      apiUrl: api.url,
      // General
      region: 'eu-west-2',
    };
  },
});
