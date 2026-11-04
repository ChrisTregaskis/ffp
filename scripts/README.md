# Scripts

Operational scripts for environment setup, database management, and deployment verification. Most are relevant when setting up a new environment (dev, staging, production) or onboarding a new developer.

## Environment Setup (One-Time per Environment)

| Script                            | Command                                                | Purpose                                                                                            |
| --------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `setup-cloudfront-signing-key.sh` | `bash scripts/setup-cloudfront-signing-key.sh <stage>` | Generates RSA key pair and stores as SST secrets for CloudFront signed URLs                        |
| `bootstrap-super-admin.ts`        | `pnpm bootstrap:super-admin`                           | Creates the first system admin in the platform organisation; Cognito emails the temporary password |

## Database

| Script                  | Command                                | Purpose                                                                                                                             |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `seed-database.ts`      | `pnpm seed:reference` / `pnpm seed:db` | Reference catalogue and platform organisation (any environment); `seed:db` adds the local demo. `--fresh` empties first, local only |
| `seed-video-assets.ts`  | `pnpm seed:video-assets`               | Puts a sample clip at every seeded video's S3 key (bucket from `.sst/outputs.json`, or `--bucket`). Skips keys that exist           |
| `test-db-connection.ts` | `pnpm db:test`                         | Quick connectivity check — useful for debugging connection issues                                                                   |
| `verify-migration.ts`   | `pnpm db:verify`                       | Verifies tables, enums, indexes, foreign keys, and RLS policies exist after migration                                               |

## Deployment Verification

| Script                     | Command                                         | Purpose                                                                                    |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `verify-cloudfront-oac.sh` | `bash scripts/verify-cloudfront-oac.sh <stage>` | Verifies direct S3 access is blocked (403) and unsigned CloudFront URLs are rejected (403) |

## New Environment Checklist

1. Run signing key setup, before the first deploy: `bash scripts/setup-cloudfront-signing-key.sh <stage>`
2. Deploy infrastructure: `sst deploy --stage <stage>`
3. Create the database roles as the master user: `pnpm db:roles`
4. Run database migrations as the migrator: `pnpm db:migrate`
5. Verify migration: `pnpm db:verify`
6. Seed the reference catalogue and platform organisation: `pnpm seed:reference`
7. Bootstrap the first system admin: `SUPER_ADMIN_EMAIL=… pnpm bootstrap:super-admin`
8. Verify CloudFront OAC: `bash scripts/verify-cloudfront-oac.sh <stage>`

Locally, `pnpm seed:db` replaces step 6 (it adds the demo), and `pnpm seed:video-assets` puts a sample clip at every seeded video's key so the demo videos play.

See `project-documentation/deployment.md` for full deployment documentation.
