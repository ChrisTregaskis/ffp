# FFP - Deployment Documentation

## Overview

FFP uses SST (Serverless Stack) for infrastructure as code, S3 + CloudFront for frontend hosting, and CircleCI for CI/CD automation. This document covers deployment workflows, environment management, and CI/CD pipelines.

## Environment Strategy

### Three Environments

**Development (dev)**

- Personal developer environments
- Hot-reload Lambda functions
- Separate resources per developer
- Cost: ~$10-20/month per developer

**Staging (staging)**

- Shared testing environment
- Mirrors production configuration
- Used for QA and client demos
- Cost: ~$30-50/month

**Production (prod)**

- Customer-facing environment
- Enhanced monitoring and backups
- Strict change control
- Cost: ~$36-66/month (<1000 users)

## SST Deployment

### Installation

```bash
npm install -g sst
npm install
```

### Development Workflow

```bash
# Start live Lambda development (hot reload)
npm run sst dev

# Deploy to dev environment
npm run sst deploy --stage dev

# View logs
npm run sst logs --stage dev --function assessments

# Remove all resources
npm run sst remove --stage dev
```

### SST Configuration

```typescript
// sst.config.ts
import { SSTConfig } from "sst";
import { AuthStack } from "./stacks/AuthStack";
import { DatabaseStack } from "./stacks/DatabaseStack";
import { StorageStack } from "./stacks/StorageStack";
import { ApiStack } from "./stacks/ApiStack";
import { MonitoringStack } from "./stacks/MonitoringStack";

export default {
  config(_input) {
    return {
      name: "ffp",
      region: "us-east-1",
    };
  },
  stacks(app) {
    // Set stage-specific configuration
    app.setDefaultFunctionProps({
      runtime: "nodejs18.x",
      timeout: "30 seconds",
      environment: {
        STAGE: app.stage,
      },
    });

    // Deploy stacks in order (respecting dependencies)
    app
      .stack(AuthStack)
      .stack(DatabaseStack)
      .stack(StorageStack)
      .stack(ApiStack)
      .stack(MonitoringStack);
  },
} satisfies SSTConfig;
```

### Resource Binding

SST automatically injects resource references:

```typescript
// stacks/ApiStack.ts
const api = new Api(stack, "Api", {
  defaults: {
    function: {
      bind: [auth, videosBucket, sessionsTable],
    },
  },
  routes: {
    "GET /assessments": "functions/assessments/list.handler",
  },
});

// In Lambda function
import { Resource } from "sst";

export const handler = async (event) => {
  const bucketName = Resource.Videos.name; // Type-safe!
  const userPoolId = Resource.Auth.userPoolId;
  // ...
};
```

## Database Migrations

### Using Knex.js

```bash
# Create migration
npm run db:migration:create add_video_tags

# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status
```

### Migration Workflow

```typescript
// package.json scripts
{
  "scripts": {
    "db:migrate": "knex migrate:latest",
    "db:migrate:rollback": "knex migrate:rollback",
    "db:migrate:status": "knex migrate:status",
    "db:migration:create": "knex migrate:make",
    "db:seed": "knex seed:run"
  }
}
```

### Pre-Deployment Migration

```typescript
// functions/migrations/run.ts
import { Knex } from "knex";
import knexConfig from "../../knexfile";

export const handler = async () => {
  const knex = Knex(knexConfig[process.env.STAGE || "development"]);

  try {
    await knex.migrate.latest();
    console.log("Migrations completed successfully");
    return { statusCode: 200, body: "Migrations complete" };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await knex.destroy();
  }
};
```

## Frontend Deployment (S3 + CloudFront + CircleCI)

### S3 Bucket Setup

```typescript
// stacks/FrontendStack.ts
import { Bucket } from "sst/constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export function FrontendStack({ stack }: StackContext) {
  const websiteBucket = new Bucket(stack, "Website", {
    cdk: {
      bucket: {
        websiteIndexDocument: "index.html",
        websiteErrorDocument: "index.html", // SPA routing
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      },
    },
  });

  const distribution = new Distribution(stack, "CDN", {
    defaultBehavior: {
      origin: new S3Origin(websiteBucket.bucket, {
        originAccessIdentity: oai,
      }),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    },
    errorResponses: [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
        ttl: Duration.minutes(5),
      },
    ],
  });

  return { websiteBucket, distribution };
}
```

### CircleCI Configuration

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.1.0
  aws-cli: circleci/aws-cli@4.0.0

jobs:
  test:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run tests
          command: npm run test
      - run:
          name: Run linter
          command: npm run lint

  build-and-deploy-frontend:
    docker:
      - image: cimg/node:18.17
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - node/install-packages
      - aws-cli/setup
      - run:
          name: Build frontend
          command: |
            npm run build
          environment:
            VITE_API_ENDPOINT: << parameters.api_endpoint >>
            VITE_COGNITO_USER_POOL_ID: << parameters.cognito_pool_id >>
            VITE_COGNITO_CLIENT_ID: << parameters.cognito_client_id >>
      - run:
          name: Deploy to S3
          command: |
            aws s3 sync dist/ s3://<< parameters.bucket_name >> --delete
      - run:
          name: Invalidate CloudFront cache
          command: |
            aws cloudfront create-invalidation \
              --distribution-id << parameters.distribution_id >> \
              --paths "/*"

  deploy-backend:
    docker:
      - image: cimg/node:18.17
    parameters:
      stage:
        type: string
    steps:
      - checkout
      - node/install-packages
      - aws-cli/setup
      - run:
          name: Deploy SST
          command: npm run sst deploy -- --stage << parameters.stage >>
      - run:
          name: Run migrations
          command: npm run db:migrate -- --env << parameters.stage >>

workflows:
  staging-deployment:
    jobs:
      - test:
          filters:
            branches:
              only: develop
      - deploy-backend:
          stage: staging
          requires:
            - test
          filters:
            branches:
              only: develop
      - build-and-deploy-frontend:
          environment: staging
          api_endpoint: https://api-staging.ffp.app
          cognito_pool_id: ${STAGING_COGNITO_POOL_ID}
          cognito_client_id: ${STAGING_COGNITO_CLIENT_ID}
          bucket_name: ffp-staging-website
          distribution_id: ${STAGING_DISTRIBUTION_ID}
          requires:
            - deploy-backend
          filters:
            branches:
              only: develop

  production-deployment:
    jobs:
      - test:
          filters:
            branches:
              only: main
      - deploy-backend:
          stage: prod
          requires:
            - test
          filters:
            branches:
              only: main
      - build-and-deploy-frontend:
          environment: production
          api_endpoint: https://api.ffp.app
          cognito_pool_id: ${PROD_COGNITO_POOL_ID}
          cognito_client_id: ${PROD_COGNITO_CLIENT_ID}
          bucket_name: ffp-prod-website
          distribution_id: ${PROD_DISTRIBUTION_ID}
          requires:
            - deploy-backend
          filters:
            branches:
              only: main
```

### Environment Variables (CircleCI)

Set these in CircleCI Project Settings → Environment Variables:

```bash
# Staging
STAGING_COGNITO_POOL_ID=us-east-1_ABC123
STAGING_COGNITO_CLIENT_ID=abc123def456
STAGING_DISTRIBUTION_ID=E1234567890ABC

# Production
PROD_COGNITO_POOL_ID=us-east-1_XYZ789
PROD_COGNITO_CLIENT_ID=xyz789abc123
PROD_DISTRIBUTION_ID=E9876543210XYZ

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
```

### Branch Mapping

- `main` branch → production environment (auto-deploy via CircleCI)
- `develop` branch → staging environment (auto-deploy via CircleCI)
- Feature branches → Manual deploy to dev environments

## Deployment Workflows

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/assessment-timer

# 2. Develop with live Lambda reload
npm run sst dev

# 3. Run tests
npm run test
npm run test:e2e

# 4. Deploy to personal dev environment
npm run sst deploy --stage dev

# 5. Commit and push
git add .
git commit -m "feat: add assessment timer"
git push origin feature/assessment-timer

# 6. Create pull request
# GitHub/Azure DevOps PR created

# 7. After approval, merge to develop
# CircleCI auto-deploys backend + frontend to staging
```

### Staging Deployment

```bash
# After PR merge to develop
git checkout develop
git pull

# Deploy backend
npm run sst deploy --stage staging

# Run database migrations
npm run db:migrate -- --env staging

# CircleCI auto-deploys frontend to staging

# Smoke test
npm run test:e2e -- --env staging
```

### Production Deployment

```bash
# Create release branch
git checkout -b release/v1.2.0
git push origin release/v1.2.0

# Deploy to production
npm run sst deploy --stage prod

# Run migrations (with backup first)
npm run db:backup -- --env prod
npm run db:migrate -- --env prod

# Merge to main
git checkout main
git merge release/v1.2.0
git push origin main

# Tag release
git tag v1.2.0
git push origin v1.2.0

# CircleCI auto-deploys frontend to production

# Monitor CloudWatch for errors
npm run logs:watch -- --stage prod
```

## Rollback Procedures

### Backend Rollback (SST)

```bash
# List recent deployments
sst list --stage prod

# Rollback to previous version
sst rollback --stage prod --version v1.1.5

# Or redeploy from previous git tag
git checkout v1.1.5
npm run sst deploy --stage prod
```

### Database Rollback

```bash
# Rollback last migration
npm run db:migrate:rollback -- --env prod

# Or restore from backup
npm run db:restore -- --env prod --backup-id 2025-10-05-03-00
```

### Frontend Rollback (S3 + CloudFront)

**Option 1: Redeploy previous version**
```bash
# Find previous successful git commit
git log --oneline

# Checkout previous version
git checkout <commit-hash>

# Build and deploy manually
npm run build
aws s3 sync dist/ s3://ffp-prod-website --delete
aws cloudfront create-invalidation --distribution-id $PROD_DISTRIBUTION_ID --paths "/*"

# Return to main branch
git checkout main
```

**Option 2: Revert commit and trigger CircleCI**
```bash
git revert HEAD
git push origin main
# CircleCI will automatically deploy the reverted version
```

**Option 3: S3 versioning (if enabled)**
```bash
# List previous versions
aws s3api list-object-versions --bucket ffp-prod-website

# Restore specific version
aws s3api copy-object \
  --copy-source ffp-prod-website/index.html?versionId=<version-id> \
  --bucket ffp-prod-website \
  --key index.html
```

## Secrets Management

### AWS Secrets Manager

```bash
# Store database credentials
aws secretsmanager create-secret \
  --name ffp/prod/db-credentials \
  --secret-string '{
    "host": "ffp-prod-db.xxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "username": "ffp_admin",
    "password": "super-secret-password",
    "database": "ffp_prod"
  }'

# Store JWT secret
aws secretsmanager create-secret \
  --name ffp/prod/jwt-secret \
  --secret-string '{"secret":"your-jwt-secret-key"}'
```

### Access in Lambda

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export async function getSecret(secretName: string) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString!);
}

// Usage
const dbCredentials = await getSecret(
  `ffp/${process.env.STAGE}/db-credentials`
);
```

### Rotation Policy

- **Database passwords**: Rotate every 90 days
- **JWT secrets**: Rotate every 180 days
- **API keys**: Rotate on employee offboarding

## Monitoring Deployments

### Post-Deployment Checks

```bash
# Check API health
curl https://api.ffp.app/health

# Check database connectivity
npm run db:test-connection -- --env prod

# View recent logs
npm run logs:tail -- --stage prod --function assessments

# Check CloudWatch alarms
aws cloudwatch describe-alarms --state-value ALARM
```

### Deployment Metrics

Track these in CloudWatch:

- Deployment duration
- Error rate (5 min post-deploy)
- Response time (5 min post-deploy)
- Database connection pool usage

### Rollback Triggers

Automatically rollback if:

- Error rate >5% in first 5 minutes
- Response time >2 seconds (p95)
- Any critical CloudWatch alarm triggered

## CI/CD Pipeline (CircleCI)

### Setup Steps

1. **Connect Repository to CircleCI**
   - Log into CircleCI
   - Add your GitHub/Bitbucket repository
   - CircleCI will detect `.circleci/config.yml`

2. **Configure Environment Variables**
   - Navigate to Project Settings → Environment Variables
   - Add all required variables (see "Environment Variables" section above)
   - Store AWS credentials securely

3. **Configure Contexts (Optional)**
   ```yaml
   # For sharing variables across projects
   workflows:
     production-deployment:
       jobs:
         - deploy-backend:
             context: aws-production
   ```

4. **Setup Status Badges**
   ```markdown
   ![CircleCI](https://circleci.com/gh/your-org/ffp.svg?style=svg)
   ```

### Manual Deployment Trigger

```bash
# Trigger a deployment from CLI
circleci trigger-pipeline --branch main

# Or use CircleCI web UI:
# 1. Go to Pipelines
# 2. Click "Trigger Pipeline"
# 3. Select branch and parameters
```

### Build Optimization

```yaml
# Cache dependencies for faster builds
- restore_cache:
    keys:
      - v1-dependencies-{{ checksum "package-lock.json" }}
      - v1-dependencies-

- run: npm ci

- save_cache:
    paths:
      - node_modules
    key: v1-dependencies-{{ checksum "package-lock.json" }}
```

## Disaster Recovery

### Backup Strategy

**Database Backups**

- Automated daily snapshots (7-day retention)
- Manual backup before major changes
- Point-in-time recovery (within retention)

**S3 Backups**

- Versioning enabled on video bucket
- Lifecycle policy: Archive to Glacier after 90 days
- Cross-region replication (future)

**Infrastructure as Code**

- All infrastructure in Git (SST)
- Can rebuild from scratch in <1 hour

### Recovery Procedures

**Database Corruption**

```bash
# Restore from latest snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ffp-prod-db-restored \
  --db-snapshot-identifier ffp-prod-db-2025-10-05-03-00

# Update connection strings
# Run health checks
```

**Complete Infrastructure Loss**

```bash
# Checkout infrastructure code
git clone https://github.com/ffp/infrastructure
cd infrastructure

# Deploy all stacks
npm run sst deploy -- --stage prod

# Restore database from snapshot
npm run db:restore -- --snapshot latest

# Verify functionality
npm run test:smoke
```

## Deployment Schedule

### Regular Deployments

- **Staging**: Daily (automated from develop branch)
- **Production**: Weekly (Tuesday 10 AM PST)
- **Hotfixes**: As needed (with approval)

### Deployment Windows

- **Preferred**: Tuesday-Thursday, 10 AM - 2 PM PST
- **Avoid**: Friday afternoons, weekends, holidays
- **Blackout**: Week before major holidays

### Change Freeze

- 2 weeks before major product launch
- During high-traffic events
- When critical bugs exist in staging

## Troubleshooting Deployments

### Issue: SST Deploy Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name ffp-prod-ApiStack

# Remove stuck stack
sst remove --stage prod
# Then redeploy
sst deploy --stage prod
```

### Issue: Migration Fails

```bash
# Check migration status
npm run db:migrate:status -- --env prod

# Rollback failed migration
npm run db:migrate:rollback -- --env prod

# Fix migration file
# Redeploy
npm run db:migrate -- --env prod
```

### Issue: Frontend Build Fails (CircleCI)

1. Check build logs in CircleCI dashboard
2. Verify environment variables are set in CircleCI project settings
3. Check if API endpoint is correct in workflow parameters
4. Re-run workflow from CircleCI dashboard
5. Test build locally:

```bash
npm run build
# Check for errors
```

## Cost Optimization

### Development Environments

- Tear down personal dev environments when not in use
- Use smaller RDS instances for dev (t3.micro)
- Limit Lambda provisioned concurrency

### Production

- Use AWS Reserved Instances for RDS (40% savings)
- Enable S3 Intelligent-Tiering
- Set CloudFront cache TTL appropriately
- Use ARM64 Lambda (20% cost savings)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Secrets updated (if needed)
- [ ] Deployment announcement sent
- [ ] Rollback plan prepared

### During Deployment

- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor CloudWatch alarms
- [ ] Check error rates
- [ ] Verify critical user flows

### Post-Deployment

- [ ] Monitor for 30 minutes
- [ ] Check user feedback
- [ ] Document any issues
- [ ] Update deployment log
- [ ] Send deployment completion notice
