# FFP - Deployment Documentation

## Overview

FFP uses SST (Serverless Stack) for infrastructure as code and AWS Amplify for frontend deployment. This document covers deployment workflows, environment management, and CI/CD pipelines.

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

## Frontend Deployment (Amplify)

### Setup

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure
```

### Amplify Configuration

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

### Environment Variables (Amplify Console)

```bash
# Staging environment
VITE_API_ENDPOINT=https://api-staging.ffp.app
VITE_COGNITO_USER_POOL_ID=us-east-1_ABC123
VITE_COGNITO_CLIENT_ID=abc123def456
VITE_CLOUDFRONT_DOMAIN=d123456789.cloudfront.net

# Production environment
VITE_API_ENDPOINT=https://api.ffp.app
VITE_COGNITO_USER_POOL_ID=us-east-1_XYZ789
VITE_COGNITO_CLIENT_ID=xyz789abc123
VITE_CLOUDFRONT_DOMAIN=d987654321.cloudfront.net
```

### Branch Mapping

- `main` branch → production environment
- `develop` branch → staging environment
- Feature branches → PR previews (optional)

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
# Amplify auto-deploys frontend to staging
# Run SST deploy to staging manually
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

# Frontend auto-deploys via Amplify

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

# Frontend auto-deploys via Amplify

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

### Frontend Rollback (Amplify)

1. Go to Amplify Console
2. Select app → Environment (production)
3. Click "Redeploy" on previous successful build
4. Or revert commit and push:

```bash
git revert HEAD
git push origin main
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

## CI/CD Pipeline (Future)

### GitHub Actions Example

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run sst deploy -- --stage staging
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - run: npm run db:migrate -- --env staging
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

### Issue: Frontend Build Fails (Amplify)

1. Check build logs in Amplify Console
2. Verify environment variables are set
3. Check if API endpoint is correct
4. Trigger manual rebuild

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
