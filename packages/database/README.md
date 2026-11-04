# @ffp/database

Database layer for Fit For Purpose (FFP) application.

## Overview

This package provides:

- **Drizzle ORM schemas** for organisations, locations, and users tables
- **Type-safe database access** with automatic TypeScript type inference
- **Migration management** via Drizzle Kit
- **Row-Level Security (RLS)** utilities for multi-tenant data isolation
- **Connection pooling** optimised for AWS Lambda

## Usage

### Importing Schemas

**Recommended: Import from package root**

```typescript
// Import client and schemas from package root
import { getDb, withDb, type DbClient } from '@ffp/database';
import { users, locations, organisations } from '@ffp/database/schema';
import type { User, Location, Organisation } from '@ffp/database/schema';

// Avoid: Direct client import (internal implementation detail)
import { getDb } from '@ffp/database/client'; // Don't do this
```

### Connection Pooling

The database package uses a singleton connection pool optimised for AWS Lambda:

```typescript
import { getDb, withDb } from '@ffp/database';
import { users } from '@ffp/database/schema';
import { eq } from 'drizzle-orm';

// Option 1: Direct database access
const db = getDb();
const user = await db.select().from(users).where(eq(users.id, userId));

// Option 2: Using withDb helper (recommended for Lambda)
export const handler = async (event: APIGatewayEvent) => {
  return withDb(async (db) => {
    const user = await db.select().from(users).where(eq(users.id, userId));
    return { statusCode: 200, body: JSON.stringify(user) };
  });
};
```

**Lambda Best Practices:**

- Connection pool is created once per Lambda container
- Reused across multiple invocations (warm starts)
- Automatically cleaned up when container shuts down
- One pool per container, shared by `getDb()` and core's `withRLS`; at most 2 connections

**Configuration:**

The connection pool uses the following environment variables:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_TLS_MODE` - `local` turns TLS off for local Postgres; unset or `verify` verifies against the pinned RDS CA (`certs/rds-ca-bundle.pem`)

**Connection Limits:**

Each Lambda container opens up to 2 connections. Plan capacity to avoid exceeding RDS `max_connections`:

- RDS `max_connections` depends on instance size (e.g., db.t4g.micro = 81 connections)
- Calculate safe limit: `concurrent containers * 2 <= max_connections - 10 (buffer)`

**Security:**

- **TLS fails closed**: every connection (the pool, migrations, seed, bootstrap, verify, drizzle-kit) uses `dbTlsConfig()`, which verifies against the pinned RDS CA unless the connection is marked `DB_TLS_MODE=local`. There is no mode that encrypts without verifying.
- **Deployed functions** get `DB_TLS_MODE` from their stage's runtime profile (`src/lib/runtime-profile.ts`) and the CA bundle copied to the package root by `sst.config.ts`
- **Credentials**: Environment variables in Phase 1, migrating to AWS Secrets Manager in Phase 2

### Running Migrations

From the project root:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply ALL migrations (schema + RLS + grants) - RECOMMENDED
# Connects as DB_MIGRATE_USER with DB_MIGRATE_PASSWORD
pnpm db:migrate

# Apply schema migrations only (advanced)
pnpm db:migrate:schema

# Open Drizzle Studio (visual database browser)
pnpm db:studio

# Check migration status
pnpm db:check
```

## Testing

The database package includes comprehensive unit and integration tests.

### Test Database Setup

Integration tests require a separate test database. This is a **one-time setup** per development environment.

#### One-Time Setup

```bash
# Create test database
psql -h localhost -U [superuser] -d postgres -c "CREATE DATABASE ffp_test;"

# Grant permissions to application user
psql -h localhost -U [superuser] -d postgres -c "GRANT CREATE ON DATABASE ffp_test TO root_user;"
psql -h localhost -U [superuser] -d ffp_test -c "GRANT ALL ON SCHEMA public TO root_user;"

# Run migrations on test database; DB_TEST_USER gives the suites' role the same grants
cd packages/database
DB_NAME=ffp_test DB_TEST_USER=test_user pnpm db:migrate
```

**Note**: Replace `[superuser]` with your PostgreSQL superuser. Find your superuser with:

```bash
psql -h localhost -U root_user -d postgres -c "\du"
```

#### Running Tests

```bash
# All tests (unit + integration - 42 tests)
pnpm --filter=@ffp/database test

# Unit tests only (no database required)
pnpm --filter=@ffp/database test client.test

# Integration tests only (requires test database)
pnpm --filter=@ffp/database test integration.test

# Watch mode for development
pnpm --filter=@ffp/database test:watch

# With coverage report
pnpm --filter=@ffp/database test --coverage
```

#### Test Coverage

- **Integration Tests** (`__tests__/integration.test.ts`) - 5 tests
  - Database constraints (foreign key, unique, cascade)
  - Transaction rollback

- **Client Tests** (`src/client.test.ts`) - 21 tests, no database required
  - Connection pool singleton pattern
  - Environment variable validation
  - SSL configuration

- **RLS Tests** (`src/lib/rls.test.ts`) - 16 tests
  - RLS context utilities
  - Cross-organisation read isolation

**Total: 42 tests**

#### Troubleshooting

**Error: `database "ffp_test" does not exist`**

- Run the one-time setup commands above to create the test database

**Error: `permission denied to create database`**

- Use a PostgreSQL superuser (not `root_user`) in the setup commands
- Check superusers with: `psql -h localhost -U root_user -d postgres -c "\du"`

**Tests fail with RLS policy errors**

- Ensure migrations ran successfully: `DB_NAME=ffp_test DB_TEST_USER=test_user pnpm db:migrate` (from `packages/database`)
- Check RLS status in test database:
  ```bash
  psql -h localhost -U root_user -d ffp_test -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
  ```

## Three-Tier Architecture

FFP uses a three-tier multi-tenant architecture:

1. **Organisations** (root) - Individual or business entities
   - `type`: 'individual' | 'business'
   - Root of the organisation hierarchy

2. **Locations** (middle) - Physical locations within business organisations
   - Only exists for business organisations
   - Handles location-specific configuration

3. **Users** (leaf) - Individual user accounts
   - Linked to either organisation (individual) or location (business)
   - All user actions scoped by `organisation_id`

### Row-Level Security

All organisation-scoped tables use PostgreSQL Row-Level Security (RLS) for automatic data isolation.

**RLS is applied automatically** when you run `pnpm db:migrate` - no manual setup required!

**RLS Policies:**

```sql
-- Applied automatically to all organisation-scoped tables
CREATE POLICY organisation_isolation ON organisations
  USING (id = current_setting('app.organisation_id')::uuid);

CREATE POLICY location_isolation ON locations
  USING (organisation_id = current_setting('app.organisation_id')::uuid);

CREATE POLICY user_isolation ON users
  USING (organisation_id = current_setting('app.organisation_id')::uuid);
```

**Environment Behaviour:**

- **Development/Test**: FORCE RLS enabled (enforces RLS even for superusers - critical for testing)
- **Production**: Standard RLS (superusers can bypass for analytics, but `app_user` role enforces RLS)

**Usage in Application Code:**

```typescript
import { withRLS, setRLSContext } from '@ffp/database';

// Option 1: Use withRLS for automatic transaction handling (RECOMMENDED)
const users = await withRLS(db, organisationId, undefined, async (tx) => {
  return await tx.select().from(users);
});

// Option 2: Set context manually
await db.transaction(async (tx) => {
  await setRLSContext(tx, organisationId, userId);
  return await tx.select().from(users);
});
```

## Database Seeding

Two seeds, both run by `scripts/seed-database.ts` and connected as the schema owner (`DB_MIGRATE_USER` / `DB_MIGRATE_PASSWORD`), as migrations are.

| Seed      | Command               | Holds                                                                                                                                                                                                                                   | Where             |
| --------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Reference | `pnpm seed:reference` | The wellness questions, assessment templates, flow and steps (with the safety-check warning), the level programme templates with their phases and sessions but no exercises, and the platform organisation. Ids and content are in code | Every environment |
| Demo      | `pnpm seed:db`        | Runs the reference seed, then adds the demo organisation, location and users (in Cognito too), the sample videos, the level shells' exercises and slots, the branching demo flow, and a member's programme and assessment               | Local only        |

**The reference seed is safe to re-run anywhere.** It inserts what is missing and never overwrites: an existing flow keeps its name, description and scoring, and the platform organisation keeps its settings, only gaining a default it lacks. A template's question links, a flow's steps and a template's phases and sessions are only seeded with their parent, so what an admin removed stays removed. It runs in one transaction and never changes FORCE RLS.

**The demo seed and `--fresh` refuse anything but a local database:** a deployed `ENVIRONMENT` (`production`, `production-like`) is refused, and so is any connection not marked `DB_TLS_MODE=local`, which covers a laptop `.env` pointed at a deployed database.

### Demo configuration

The demo's organisation and users come from `seed/config/db-seed.local.<environment>.json` (gitignored; `dev` by default). Copy `db-seed.example.json` to start one. The demo's Cognito users need `COGNITO_USER_POOL_ID`.

```bash
pnpm seed:reference          # reference data only
pnpm seed:db                 # reference, then the demo from db-seed.local.dev.json
pnpm seed:db -- --fresh      # empty the catalogue and member data first (identity data is kept)
```

Changing a seeded row needs `--fresh` locally, because inserts skip existing ids.

The platform organisation's id is fixed in `seed/seedPlatformTenant.ts`, and the seed refuses a database that already holds a platform organisation with another id (an old local database seeded from an earlier example config). Recreate that database with the Fresh Database Setup steps below; `--fresh` keeps organisations. A `platformOrganisation` key left in a local config is ignored and can be removed.

### Seeding Video Media

The seeded videos point at `library/77777777-…-7777777700NN.mp4` keys that nothing else uploads, so on a fresh stage they fail to play. After `pnpm seed:db`, put a sample clip at every seeded key:

```bash
# Bucket and region from .sst/outputs.json (the stage sst dev or sst deploy last ran)
pnpm seed:video-assets

# A specific stage's videos bucket
pnpm seed:video-assets -- --bucket <videos-bucket-name>
```

- Uploads `seed/assets/sample-exercise.mp4` (a five-second silent test pattern, about 165 KB) to each key from `SEED_VIDEO_S3_KEYS` in `seed/seedVideos.ts`
- **Idempotent**: a key that already holds an object is skipped, so real media is never replaced
- Writes to S3 with the AWS credentials of the shell that runs it; it is kept apart from `seed:db` so a database-only seed never touches a bucket

### Seed Architecture

One `seed*.ts` per concern, called from `seed/reference.ts` or `seed/demo.ts`; `seed/index.ts` connects (`seed/connection.ts`), applies the guard (`seed/guard.ts`) and runs them. Tenant tables are written under their organisation's RLS context (`withRLS`), which holds whether or not the table forces RLS on its owner.

## Fresh Database Setup (Development)

Test database migrations and seeding on a clean database:

**Find your PostgreSQL superuser:**

```bash
psql -h localhost -U root_user -d postgres -c "\du"
```

**Setup workflow:**

1. Drop and recreate database:

   ```bash
   psql -h localhost -U [replace-with-super-user] -d postgres -c "DROP DATABASE IF EXISTS ffp_dev;"
   psql -h localhost -U [replace-with-super-user] -d postgres -c "CREATE DATABASE ffp_dev;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO root_user;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "GRANT ALL ON SCHEMA public TO root_user;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "ALTER DATABASE ffp_dev OWNER TO root_user;"
   ```

2. Run migrations (creates tables, enums, RLS policies):

   ```bash
   pnpm db:migrate
   ```

3. Seed the reference data and the demo:

   ```bash
   pnpm seed:db
   ```

4. Run RLS tests:

   ```bash
   pnpm test
   ```

5. Verify idempotency (run migrations again - should be no-op):
   ```bash
   pnpm db:migrate
   ```

**Security Critical**: Never skip setting RLS context in production queries!

## Dependencies

- **`drizzle-orm`** - Type-safe ORM for TypeScript
- **`drizzle-kit`** - CLI for migrations and introspection
- **`pg`** - PostgreSQL client for Node.js

## Security Notes

- **Never disable RLS policies** in production
- **Always validate organisation context** before queries
- **Use parameterised queries** (Drizzle handles this automatically)
- **Encrypt sensitive data** at rest and in transit
- **Audit all data access** with organisation/user context

## Resources

- **Root README**: `../../README.md` - Monorepo structure
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`
- **Database Schema**: `../../project-documentation/database-schema.md`
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [FFP Database Schema Documentation](../../project-documentation/database-schema.md)
