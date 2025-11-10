# @ffp/database

Database layer for Fit For Purpose (FFP) application.

## Overview

This package provides:

- **Drizzle ORM schemas** for tenants, customers, and users tables
- **Type-safe database access** with automatic TypeScript type inference
- **Migration management** via Drizzle Kit
- **Row-Level Security (RLS)** utilities for multi-tenant data isolation
- **Connection pooling** optimised for AWS Lambda

## Usage

### Importing Schemas

**Recommended: Import from package root**

```typescript
// ✅ Import client and schemas from package root
import { getDb, withDb, type DbClient } from '@ffp/database';
import { users, customers, tenants } from '@ffp/database/schema';
import type { User, Customer, Tenant } from '@ffp/database/schema';

// ⚠️ Avoid: Direct client import (internal implementation detail)
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
- Maximum 10 connections per container prevents PostgreSQL exhaustion

**Configuration:**

The connection pool uses the following environment variables:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_SSL` - Enable SSL/TLS (set to 'true' for production RDS)
- `NODE_ENV` - Environment (affects SSL certificate validation)

**Connection Limits:**

Each Lambda container creates up to 10 connections. Plan capacity to avoid exceeding RDS `max_connections`:

- RDS `max_connections` depends on instance size (e.g., db.t4g.micro = 81 connections)
- Calculate safe limit: `reserved_concurrency * 10 <= max_connections - 10 (buffer)`
- Example: 5 concurrent Lambdas = 50 connections max (safe for db.t4g.micro)

**Security:**

- **Production**: SSL enabled with certificate verification (`DB_SSL=true`, `NODE_ENV=production`)
- **Development**: SSL optional, allows self-signed certificates for local PostgreSQL
- **Credentials**: Environment variables in Phase 1, migrating to AWS Secrets Manager in Phase 2

### Running Migrations

From the project root:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply ALL migrations (schema + RLS + roles) - RECOMMENDED
pnpm db:migrate

# Apply schema migrations only (advanced)
pnpm db:migrate:schema

# Push schema directly (dev only, bypasses migrations)
pnpm db:push

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

# Run migrations on test database
cd packages/database
DB_NAME=ffp_test pnpm db:migrate
```

**Note**: Replace `[superuser]` with your PostgreSQL superuser. Find your superuser with:

```bash
psql -h localhost -U root_user -d postgres -c "\du"
```

#### Running Tests

```bash
# All tests (unit + integration - 68 tests)
pnpm --filter=@ffp/database test

# Unit tests only (no database required)
pnpm --filter=@ffp/database test drizzle.test

# Integration tests only (requires test database)
pnpm --filter=@ffp/database test integration.test

# Watch mode for development
pnpm --filter=@ffp/database test:watch

# With coverage report
pnpm --filter=@ffp/database test --coverage
```

#### Test Coverage

- **Unit Tests** (`__tests__/drizzle.test.ts`) - 16 tests
  - Connection pool configuration
  - Schema type inference
  - Migration structure validation
  - No database connection required

- **Integration Tests** (`__tests__/integration.test.ts`) - 15 tests
  - CRUD operations with RLS enforcement
  - Connection pool behaviour
  - Database constraints (foreign keys, unique)
  - Transaction handling (commit/rollback)
  - Multi-tenant data isolation

- **Client Tests** (`src/client.test.ts`) - 21 tests
  - Connection pool singleton pattern
  - Environment variable validation
  - SSL configuration

- **RLS Tests** (`src/lib/rls.test.ts`) - 16 tests
  - RLS context utilities
  - UUID validation
  - Cross-tenant isolation

**Total: 68 tests**

#### Troubleshooting

**Error: `database "ffp_test" does not exist`**

- Run the one-time setup commands above to create the test database

**Error: `permission denied to create database`**

- Use a PostgreSQL superuser (not `root_user`) in the setup commands
- Check superusers with: `psql -h localhost -U root_user -d postgres -c "\du"`

**Tests fail with RLS policy errors**

- Ensure migrations ran successfully: `DB_NAME=ffp_test pnpm db:migrate`
- Check RLS status in test database:
  ```bash
  psql -h localhost -U root_user -d ffp_test -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
  ```

## Three-Tier Architecture

FFP uses a three-tier multi-tenant architecture:

1. **Tenants** (root) - Individual or business organisations
   - `type`: 'individual' | 'business'
   - Root of the tenant hierarchy

2. **Customers** (middle) - Billing entities for business tenants
   - Only exists for business tenants
   - Handles subscription and billing

3. **Users** (leaf) - Individual user accounts
   - Linked to either tenant (individual) or customer (business)
   - All user actions scoped by `tenant_id`

### Row-Level Security

All tenant-scoped tables use PostgreSQL Row-Level Security (RLS) for automatic data isolation.

**RLS is applied automatically** when you run `pnpm db:migrate` - no manual setup required!

**RLS Policies:**

```sql
-- Applied automatically to all tenant-scoped tables
CREATE POLICY tenant_isolation ON tenants
  USING (id = current_setting('app.tenant_id')::uuid);

CREATE POLICY customer_isolation ON customers
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY user_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Environment Behaviour:**

- **Development/Test**: FORCE RLS enabled (enforces RLS even for superusers - critical for testing)
- **Production**: Standard RLS (superusers can bypass for analytics, but `app_user` role enforces RLS)

**Usage in Application Code:**

```typescript
import { withRLS, setRLSContext } from '@ffp/database';

// Option 1: Use withRLS for automatic transaction handling (RECOMMENDED)
const users = await withRLS(db, tenantId, undefined, async (tx) => {
  return await tx.select().from(users);
});

// Option 2: Set context manually
await db.transaction(async (tx) => {
  await setRLSContext(tx, tenantId, userId);
  return await tx.select().from(users);
});
```

## Database Seeding

The database package includes a flexible seeding system for development environments.

### Seed Configuration

Seed data is defined in JSON configuration files located in `seed/config/`:

- **`db-seed.example.json`** - Template showing the structure (committed to repo)
- **`db-seed.local.dev.json`** - Your local development data (gitignored)
- **`db-seed.local.test.json`** - Test data (gitignored, future)

### Setting Up Seed Data

**First time setup:**

1. Copy the example config:

   ```bash
   cp packages/database/seed/config/db-seed.example.json \
      packages/database/seed/config/db-seed.local.dev.json
   ```

2. Edit `db-seed.local.dev.json` with your actual values:
   - Platform tenant ID, name, timestamps
   - Super admin user ID, email, Cognito sub, timestamps
   - Temporary password for Cognito

### Running Seeds

```bash
# Seed development database (uses db-seed.local.dev.json)
pnpm seed:db

# Seed specific environment (future)
pnpm seed:db staging
pnpm seed:db test
```

**Important:**

- Seeds are **NOT idempotent** - they will fail if data already exists
- Always run on a fresh database (see workflow below)
- Seeds bypass RLS (requires BOOTSTRAP_DB_USER with BYPASSRLS privilege)

### Seed Architecture

Individual seed functions are organised in separate files:

- **`seed/seedPlatformTenant.ts`** - Seeds platform tenant
- **`seed/index.ts`** - Orchestrates all seed operations

**Adding new seed data:**

1. Define type in `seed/types.ts`
2. Add data to `db-seed.example.json` and your local config
3. Create seed function file (e.g., `seedSampleBusinesses.ts`)
4. Import and call from `seed/index.ts`

## RLS Migration Test - Fresh Database

Can check super users for local db running `psql -h localhost -U root_user -d postgres -l`

1. Drop and recreate database:

   ```bash
   psql -h localhost -U [replace-with-super-user] -d postgres -c "DROP DATABASE IF EXISTS ffp_dev;"
   psql -h localhost -U [replace-with-super-user] -d postgres -c "CREATE DATABASE ffp_dev;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "GRANT CREATE ON DATABASE ffp_dev TO root_user;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "GRANT ALL ON SCHEMA public TO root_user;"
   ```

2. Run migrations:

   ```bash
   pnpm db:migrate
   ```

3. Seed database:

   ```bash
   pnpm seed:db
   ```

4. Run RLS tests:

   ```bash
   pnpm test
   ```

5. Verify idempotency (run migrations again):
   ```bash
   pnpm db:migrate
   ```

⚠️ **Security Critical**: Never skip setting RLS context in production queries!

## Dependencies

- **`drizzle-orm`** - Type-safe ORM for TypeScript
- **`drizzle-kit`** - CLI for migrations and introspection
- **`pg`** - PostgreSQL client for Node.js
- **`drizzle-zod`** - Generate Zod schemas from Drizzle tables

## Security Notes

- **Never disable RLS policies** in production
- **Always validate tenant context** before queries
- **Use parameterised queries** (Drizzle handles this automatically)
- **Encrypt sensitive data** at rest and in transit
- **Audit all data access** with tenant/user context

## Resources

- **Root README**: `../../README.md` - Monorepo structure
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`
- **Database Schema**: `../../project-documentation/database-schema.md`
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [FFP Database Schema Documentation](../../project-documentation/database-schema.md)
