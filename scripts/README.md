# Scripts

Operational scripts for environment setup, database management, and deployment verification. Most are relevant when setting up a new environment (dev, staging, production) or onboarding a new developer.

## Environment Setup (One-Time per Environment)

| Script                            | Command                                                | Purpose                                                                     |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `setup-cloudfront-signing-key.sh` | `bash scripts/setup-cloudfront-signing-key.sh <stage>` | Generates RSA key pair and stores as SST secrets for CloudFront signed URLs |
| `bootstrap-super-admin.ts`        | `pnpm bootstrap:super-admin`                           | Creates platform tenant and super admin user (Cognito + database)           |

## Database

| Script                  | Command          | Purpose                                                                               |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `seed-database.ts`      | `pnpm seed:db`   | Seeds environment with initial data. Supports `--fresh` flag to truncate first        |
| `test-db-connection.ts` | `pnpm db:test`   | Quick connectivity check — useful for debugging connection issues                     |
| `verify-migration.ts`   | `pnpm db:verify` | Verifies tables, enums, indexes, foreign keys, and RLS policies exist after migration |

## Deployment Verification

| Script                     | Command                                         | Purpose                                                                                    |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `verify-cloudfront-oac.sh` | `bash scripts/verify-cloudfront-oac.sh <stage>` | Verifies direct S3 access is blocked (403) and unsigned CloudFront URLs are rejected (403) |

## New Environment Checklist

1. Deploy infrastructure: `sst deploy --stage <stage>`
2. Run signing key setup: `bash scripts/setup-cloudfront-signing-key.sh <stage>`
3. Run database migrations: `pnpm db:migrate`
4. Verify migration: `pnpm db:verify`
5. Bootstrap super admin: `pnpm bootstrap:super-admin`
6. Seed data (if needed): `pnpm seed:db`
7. Verify CloudFront OAC: `bash scripts/verify-cloudfront-oac.sh <stage>`

See `project-documentation/deployment.md` for full deployment documentation.
