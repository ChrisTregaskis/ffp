# FFP - Deployment Documentation

## Overview

FFP uses SST (Serverless Stack) for infrastructure as code, S3 + CloudFront for frontend hosting, and GitHub for version control. This document covers deployment workflows, environment management, and CI/CD pipelines.

**Version Control Platform:** GitHub

**Phase 1 Deployment Strategy:** Manual deployments with basic automated testing (GitHub Actions for CI only, not CD)

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
import { SSTConfig } from 'sst';
import { AuthStack } from './stacks/AuthStack';
import { DatabaseStack } from './stacks/DatabaseStack';
import { StorageStack } from './stacks/StorageStack';
import { ApiStack } from './stacks/ApiStack';
import { MonitoringStack } from './stacks/MonitoringStack';

export default {
  config(_input) {
    return {
      name: 'ffp',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    // Set stage-specific configuration
    app.setDefaultFunctionProps({
      runtime: 'nodejs18.x',
      timeout: '30 seconds',
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
const api = new Api(stack, 'Api', {
  defaults: {
    function: {
      bind: [auth, videosBucket, sessionsTable],
    },
  },
  routes: {
    'GET /assessments': 'functions/assessments/list.handler',
  },
});

// In Lambda function
import { Resource } from 'sst';

export const handler = async (event) => {
  const bucketName = Resource.Videos.name; // Type-safe!
  const userPoolId = Resource.Auth.userPoolId;
  // ...
};
```

## Database Migrations

### Using Drizzle Kit

```bash
# Install Drizzle
npm install drizzle-orm pg
npm install -D drizzle-kit drizzle-zod @types/pg
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop",
    "db:check": "drizzle-kit check"
  }
}
```

### Migration Workflow

```bash
# 1. Make changes to schema files (schema/*.ts)

# 2. Generate migration from schema changes
npm run db:generate

# 3. Review generated SQL
cat migrations/0001_add_user_preferences.sql

# 4. Apply migrations to database
npm run db:migrate

# 5. Check migration status
npm run db:check
```

### Development Workflow (db:push)

```bash
# Push schema changes directly to database (bypasses migrations)
npm run db:push

# ⚠️ WARNING: Only use in development
# This doesn't create migration files
# Production should always use db:generate + db:migrate
```

### Environment-Specific Migrations

```bash
# Development
DB_HOST=localhost DB_NAME=ffp_dev npm run db:migrate

# Staging
DB_HOST=ffp-staging.xxx.rds.amazonaws.com DB_NAME=ffp_staging npm run db:migrate

# Production
DB_HOST=ffp-prod.xxx.rds.amazonaws.com DB_NAME=ffp_prod npm run db:migrate
```

### Pre-Deployment Migration Lambda

```typescript
// functions/migrations/run.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export const handler = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const db = drizzle(pool);

  try {
    console.log('Starting migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Migrations complete' }),
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};
```

### Drizzle Studio

```bash
# Start Drizzle Studio (visual database GUI)
npm run db:studio

# Opens browser at https://local.drizzle.studio
# Provides visual interface for:
# - Browsing tables and data
# - Running queries
# - Inspecting schema
# - Testing relationships
```

## Frontend Deployment (S3 + CloudFront + CircleCI)

### S3 Bucket Setup

```typescript
// stacks/FrontendStack.ts
import { Bucket } from 'sst/constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export function FrontendStack({ stack }: StackContext) {
  const websiteBucket = new Bucket(stack, 'Website', {
    cdk: {
      bucket: {
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'index.html', // SPA routing
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      },
    },
  });

  const distribution = new Distribution(stack, 'CDN', {
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
        responsePagePath: '/index.html',
        ttl: Duration.minutes(5),
      },
    ],
  });

  return { websiteBucket, distribution };
}
```

### GitHub Actions Configuration (Future - Phase 2+)

Note: Full CI/CD is deferred to Phase 2. For Phase 1, we use manual deployments with basic automated testing only.

```yaml
# .github/workflows/test.yml (Phase 1 - Testing Only)
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
```

### GitHub Actions Configuration (Future - Phase 2+ Full CI/CD)

This is an example of full automated deployment that will be implemented in Phase 2+:

```yaml
# .github/workflows/deploy-staging.yml (Future Phase 2+)
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
          node-version: '18'
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
          node-version: '18'
      - run: npm ci
      - run: npm run sst deploy -- --stage staging
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - run: npm run db:migrate -- --env staging
```

### Environment Variables (GitHub Actions)

Set these in GitHub Repository Settings → Secrets and variables → Actions:

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

# 3. Make schema changes
# Edit schema/users.ts

# 4. Generate and apply migration
npm run db:generate
npm run db:migrate

# 5. Run tests
npm run test
npm run test:e2e

# 6. Deploy to personal dev environment
npm run sst deploy --stage dev

# 7. Commit and push
git add .
git commit -m "feat: add assessment timer"
git push origin feature/assessment-timer

# 8. Create pull request on GitHub
# GitHub PR created and reviewed

# 9. After approval, merge to develop
# Manual deployment to staging (Phase 1)
# Future: GitHub Actions auto-deploys (Phase 2+)
```

### Staging Deployment

```bash
# After PR merge to develop
git checkout develop
git pull

# Deploy backend (if manual deployment needed)
npm run sst deploy --stage staging

# Run database migrations
npm run db:migrate -- --env staging

# Manual frontend deployment (Phase 1)
# Future: GitHub Actions auto-deploys (Phase 2+)

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

# Manual frontend deployment (Phase 1)
# Future: GitHub Actions auto-deploys (Phase 2+)

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

Drizzle doesn't have built-in rollback commands. You have two options:

**Option 1: Manual rollback SQL**

```bash
# Review the migration you want to rollback
cat migrations/0005_problematic_migration.sql

# Write a reverse migration manually
# Create migrations/0006_rollback_previous.sql with reverse operations

# Apply the rollback migration
npm run db:migrate
```

**Option 2: Restore from backup**

```bash
# Restore from RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ffp-prod-db-restored \
  --db-snapshot-identifier ffp-prod-db-2025-10-15-03-00

# Update connection strings
# Run health checks
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
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function getSecret(secretName: string) {
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
  return JSON.parse(response.SecretString!);
}

// Usage
const dbCredentials = await getSecret(`ffp/${process.env.STAGE}/db-credentials`);
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

# Test Drizzle Studio connection (staging only)
npm run db:studio
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

## CI/CD Pipeline (GitHub Actions)

### Phase 1: Basic Automated Testing Only

For MVP/Phase 1, we implement **automated testing only** - deployments remain manual.

**Setup Steps:**

1. **Create `.github/workflows/test.yml`**
   ```yaml
   name: Test
   ```

on: [push, pull_request]

jobs:
test:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v3

- uses: actions/setup-node@v3
  with:
  node-version: '18' - run: npm ci - run: npm run test - run: npm run lint

````

2. **Configure Repository Secrets**
   - Navigate to Settings → Secrets and variables → Actions
   - Add: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (for future use)

3. **Setup Status Badge**
   ```markdown
   ![Tests](https://github.com/your-org/ffp/actions/workflows/test.yml/badge.svg)
````

**Why Manual Deployments for Phase 1:**

- Solo developer, 8-12 week MVP timeline
- Learn SST deployment patterns hands-on first
- Add automation when deployment frequency becomes painful (Phase 2)
- Aligns with "Speed Over Perfection" principle

### Phase 2+: Full Automated Deployment

**Future enhancements** (see example workflows above):

- Automated staging deployments on `develop` branch merge
- Automated production deployments on `main` branch merge
- Database migration automation
- Frontend build and S3 sync automation
- CloudFront invalidation automation

### Manual Deployment Commands (Phase 1)

```bash
# Backend deployment
npm run sst deploy -- --stage staging
npm run sst deploy -- --stage prod

# Frontend deployment
npm run build
aws s3 sync dist/ s3://ffp-staging-website --delete
aws cloudfront create-invalidation --distribution-id $STAGING_DISTRIBUTION_ID --paths "/*"

# Database migrations
npm run db:migrate -- --env staging
npm run db:migrate -- --env prod
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
- All schema definitions in Git (Drizzle)
- Can rebuild from scratch in <1 hour

### Recovery Procedures

**Database Corruption**

```bash
# Restore from latest snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ffp-prod-db-restored \
  --db-snapshot-identifier ffp-prod-db-2025-10-15-03-00

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

# Apply all migrations
npm run db:migrate

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
npm run db:check

# Review the problematic migration
cat migrations/<failing-migration>.sql

# Options:
# 1. Fix the migration file and re-run
# 2. Drop the migration and regenerate
npm run db:drop
npm run db:generate

# 3. Or restore from backup
npm run db:restore -- --env prod --backup-id 2025-10-15-03-00
```

### Issue: Drizzle Studio Won't Connect

```bash
# Check database credentials
echo $DB_HOST $DB_PORT $DB_NAME

# Test direct connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Verify drizzle.config.ts has correct credentials
cat drizzle.config.ts

# Try with explicit credentials
DB_HOST=localhost DB_PORT=5432 npm run db:studio
```

### Issue: Frontend Build Fails (CircleCI)

1. Check build logs in GitHub Actions dashboard
2. Verify environment variables are set in CircleCI project settings
3. Check if API endpoint is correct in environment variables
4. Re-run workflow from GitHub Actions dashboard
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
- Use `db:push` for rapid schema iteration (no migration files)

### Production

- Use AWS Reserved Instances for RDS (40% savings)
- Enable S3 Intelligent-Tiering
- Set CloudFront cache TTL appropriately
- Use ARM64 Lambda (20% cost savings)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally
- [ ] Migration SQL reviewed (check generated SQL files)
- [ ] Secrets updated (if needed)
- [ ] Deployment announcement sent
- [ ] Rollback plan prepared

### During Deployment

- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Review migration SQL before applying to production
- [ ] Deploy to production
- [ ] Monitor CloudWatch alarms
- [ ] Check error rates
- [ ] Verify critical user flows

### Post-Deployment

- [ ] Monitor for 30 minutes
- [ ] Check user feedback
- [ ] Verify database schema matches expectations (use `db:studio`)
- [ ] Document any issues
- [ ] Update deployment log
- [ ] Send deployment completion notice
