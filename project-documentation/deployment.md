# FFP - Deployment Documentation

## Overview

FFP uses SST (Serverless Stack) for infrastructure-as-code, S3 + CloudFront for frontend hosting, and GitHub Actions for CI/CD. This document captures key decisions, patterns, and constraints. Detailed implementation will be planned via Jira stories when deploying staging and production.

## Environment Strategy

| Environment | Purpose                                            | Deployment                             | Estimated Cost              |
| ----------- | -------------------------------------------------- | -------------------------------------- | --------------------------- |
| **dev**     | Personal developer environment, hot-reload Lambdas | Manual (`sst dev`)                     | ~£10-20/month               |
| **staging** | QA, client demos, mirrors production config        | Manual (Phase 1), automated (Phase 2+) | ~£30-50/month               |
| **prod**    | Customer-facing, enhanced monitoring & backups     | Manual (Phase 1), automated (Phase 2+) | ~£36-66/month (<1000 users) |

## Key Decisions

### SST Stage Naming

Use project-specific stage names, never the default macOS username (causes cross-project lock conflicts and state corruption):

```bash
sst dev --stage ct-ffp           # [✓] Project-specific
sst dev                          # [✗]  Defaults to username, conflicts across projects
```

### Database Migrations (Drizzle)

**Migration-only workflow** - see CLAUDE.md for full rationale on never using `db:push`.

```bash
# Schema change → generate → review → migrate
pnpm db:generate    # Creates .sql migration file
pnpm db:migrate     # Applies migrations with tracking
pnpm db:studio      # Visual database browser (read-only verification)
```

Migrations require `DB_MIGRATE_USER` (elevated privileges) due to RLS restrictions on the application user.

### Secrets Management

- Application secrets use **SST Secrets** (`sst secret set`) — per-stage, automatically linked to Lambda functions via `Resource.<SecretName>.value`
- Database credentials in **AWS Secrets Manager** (accessed via `@aws-sdk/client-secrets-manager`)
- Naming convention for Secrets Manager: `ffp/{stage}/secret-name` (e.g., `ffp/prod/db-credentials`)
- Never commit secrets to code or environment files

### CloudFront Signing Key Setup (Per-Environment Prerequisite)

CloudFront signed URLs require an RSA key pair per environment. This is a **one-time setup** — keys are stored as SST secrets and reused across deployments.

#### When to Run

- **New environment setup** (dev, staging, production) — run once before the first `sst deploy`
- **Key rotation** — re-run to generate a new key pair (overwrites existing secrets)
- **NOT on every deploy** — SST references the stored secrets automatically at deploy time

#### How to Run

```bash
# One-time setup per environment
bash scripts/setup-cloudfront-signing-key.sh <stage>

# Examples
bash scripts/setup-cloudfront-signing-key.sh dev
bash scripts/setup-cloudfront-signing-key.sh staging
bash scripts/setup-cloudfront-signing-key.sh production
```

The script:

1. Generates an RSA 2048 key pair (via OpenSSL)
2. Validates the key pair before uploading
3. Stores the private key as `CloudFrontSigningKey` (SST secret)
4. Stores the public key as `CloudFrontSigningPublicKey` (SST secret)
5. Removes key files from disk (cleanup trap)

#### Prerequisites

- OpenSSL installed (standard on macOS/Linux)
- SST Ion CLI installed
- AWS credentials configured for the target account

#### Verify Secrets

```bash
sst secret list --stage <stage>
# Should show: CloudFrontSigningKey, CloudFrontSigningPublicKey
```

#### How It Works at Deploy Time

At deploy time, SST reads the stored secrets automatically — no manual intervention needed:

| Secret                       | Used by                        | Purpose                                    |
| ---------------------------- | ------------------------------ | ------------------------------------------ |
| `CloudFrontSigningKey`       | Lambda functions (via `link`)  | Sign CloudFront URLs at runtime            |
| `CloudFrontSigningPublicKey` | CloudFront Public Key resource | Verify signed URLs (embedded in Key Group) |

Lambda functions access the private key via `Resource.CloudFrontSigningKey.value` (auto-decrypted at cold start). The key pair ID is available via `Resource.CloudFrontKeyPairId.value`.

#### Post-Deployment Verification

After deploying with OAC and Key Group, verify access is correctly restricted:

```bash
bash scripts/verify-cloudfront-oac.sh <stage>
```

This script uploads a test file to S3, verifies direct S3 access returns 403, verifies unsigned CloudFront access returns 403, then cleans up.

### SST Deployment Outputs

After a successful deployment, SST outputs resource identifiers needed for configuration and testing:

```
✓  Complete
   apiUrl: https://abc123xyz.execute-api.eu-west-2.amazonaws.com
   assetsBucket: ffp-dev-assetsbucketbucket-dnvmaanu
   cdnUrl: https://d25o0th3bf9azm.cloudfront.net
   region: eu-west-2
   userPoolArn: arn:aws:cognito-idp:eu-west-2:123456789012:userpool/eu-west-2_ABC123XYZ
   userPoolClientId: 7ams44epvr3jgb9dnto3a94hmh
   userPoolId: eu-west-2_ABC123XYZ
   videosBucket: ffp-dev-videosbucketbucket-fhwfrwta
```

Access outputs from the last deployment:

```bash
cat .sst/outputs.json
```

| Output             | Description           | Used For                          |
| ------------------ | --------------------- | --------------------------------- |
| `apiUrl`           | API Gateway endpoint  | Frontend API calls, health checks |
| `userPoolId`       | Cognito User Pool ID  | Authentication configuration      |
| `userPoolClientId` | User Pool Client ID   | Frontend authentication           |
| `userPoolArn`      | User Pool ARN         | IAM policies, Lambda triggers     |
| `videosBucket`     | S3 videos bucket name | Video upload/storage              |
| `assetsBucket`     | S3 assets bucket name | Static asset storage              |
| `cdnUrl`           | CloudFront CDN URL    | Video delivery                    |
| `region`           | AWS region            | SDK configuration                 |

### Personal Stage CORS

When using `sst dev` (personal stage), CORS defaults to `http://localhost:5173`.

### Branch Strategy

| Branch           | Environment    | Deployment                              |
| ---------------- | -------------- | --------------------------------------- |
| Feature branches | dev (personal) | Manual                                  |
| `develop`        | staging        | Manual (Phase 1) → Automated (Phase 2+) |
| `main`           | production     | Manual (Phase 1) → Automated (Phase 2+) |

## CI/CD Approach

### Phase 1: Automated Testing Only

- GitHub Actions runs tests and linting on push/PR
- All deployments are manual via SST CLI
- Rationale: learn SST patterns hands-on first, automate when deployment frequency becomes painful

### Phase 2+: Full Automated Deployment

- Automated staging deploys on `develop` merge
- Automated production deploys on `main` merge
- Database migration automation
- Frontend build → S3 sync → CloudFront invalidation

## Patterns to Implement

### SST Resource Binding

SST injects resource references (bucket names, pool IDs) into Lambda functions automatically - no manual environment variable wiring needed.

### Pre-Deployment Migration Lambda

A dedicated Lambda function for running Drizzle migrations during deployment, rather than running migrations from a local machine against remote databases.

### Rollback Strategy

| Layer             | Approach                                                   |
| ----------------- | ---------------------------------------------------------- |
| **Backend (SST)** | Redeploy from previous git tag                             |
| **Database**      | Manual reverse migration SQL, or restore from RDS snapshot |
| **Frontend**      | Redeploy previous build to S3 + CloudFront invalidation    |

### Disaster Recovery

- **Database**: Automated daily RDS snapshots (7-day retention), point-in-time recovery
- **Videos (S3)**: Versioning enabled, lifecycle to Glacier after 90 days
- **Infrastructure**: All defined in Git (SST + Drizzle) - can rebuild from scratch

## Deployment Checklist (High-Level)

### First Deploy to a New Environment

1. Run `bash scripts/setup-cloudfront-signing-key.sh <stage>` (one-time signing key setup)
2. Verify secrets stored: `sst secret list --stage <stage>`

### Every Deploy

1. All tests passing, code reviewed
2. Migration SQL reviewed
3. Deploy to staging first, run smoke tests
4. Deploy to production
5. Verify health endpoint:
   ```bash
   API_URL=$(cat .sst/outputs.json | grep -o '"apiUrl":"[^"]*"' | cut -d'"' -f4)
   curl -v $API_URL/health
   ```
6. Run `bash scripts/verify-cloudfront-oac.sh <stage>` (verify OAC access restrictions)
7. Monitor CloudWatch for 30 minutes post-deploy
8. Verify critical user flows

## Cost Optimisation Notes

- Tear down dev environments when not in use
- Use `t3.micro` RDS for dev
- Consider RDS Reserved Instances for production (40% savings)
- Use ARM64 Lambda runtime (20% cost savings)
- Enable S3 Intelligent-Tiering

---

_Detailed implementation steps, GitHub Actions workflows, and SST stack configuration will be planned via Jira stories when deploying staging and production for the first time._
