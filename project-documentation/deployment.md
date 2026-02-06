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
sst dev --stage ct-ffp           # ✅ Project-specific
sst dev                          # ❌ Defaults to username, conflicts across projects
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

- All secrets in **AWS Secrets Manager** (never in code or environment files)
- Naming convention: `ffp/{stage}/secret-name` (e.g., `ffp/prod/db-credentials`)
- Access via `@aws-sdk/client-secrets-manager` in Lambda functions

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

1. All tests passing, code reviewed
2. Migration SQL reviewed
3. Deploy to staging first, run smoke tests
4. Deploy to production
5. Monitor CloudWatch for 30 minutes post-deploy
6. Verify critical user flows

## Cost Optimisation Notes

- Tear down dev environments when not in use
- Use `t3.micro` RDS for dev
- Consider RDS Reserved Instances for production (40% savings)
- Use ARM64 Lambda runtime (20% cost savings)
- Enable S3 Intelligent-Tiering

---

_Detailed implementation steps, GitHub Actions workflows, and SST stack configuration will be planned via Jira stories when deploying staging and production for the first time._
