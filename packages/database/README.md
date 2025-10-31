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

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_SSL` - Enable SSL/TLS (set to 'true' for production RDS)
- `NODE_ENV` - Environment (affects SSL certificate validation)

**Connection Limits:**

Each Lambda container creates up to 10 connections. Plan capacity to avoid exceeding RDS `max_connections`:

- RDS `max_connections` depends on instance size (e.g., db.t4g.micro = 81 connections)
- Calculate safe limit: `reserved_concurrency × 10 ≤ max_connections - 10 (buffer)`
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

## RLS Migration Test - Fresh Database

Can check super users for local db running `psql -h localhost -U root_user -d postgres -l`

1. Drop and recreate database:
   psql -h localhost -U [replace-with-super-user] -d postgres -c "DROP DATABASE IF EXISTS ffp_dev;"
   psql -h localhost -U [replace-with-super-user] -d postgres -c "CREATE DATABASE ffp_dev;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "GRANT CREATE ON DATABASE ffp_dev TO root_user;"
   psql -h localhost -U [replace-with-super-user] -d ffp_dev -c "GRANT ALL ON SCHEMA public TO root_user;"

2. Run migrations:
   `pnpm db:migrate`

3. Run RLS tests:
   `pnpm test`

4. Verify idempotency (run migrations again):
   `pnpm db:migrate`

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
