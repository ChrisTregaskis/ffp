# @ffp/database

Database layer for Fit For Purpose (FFP) application.

## Overview

This package provides:

- **Drizzle ORM schemas** for tenants, customers, and users tables
- **Type-safe database access** with automatic TypeScript type inference
- **Migration management** via Drizzle Kit
- **Row-Level Security (RLS)** utilities (future)
- **Connection pooling** optimised for AWS Lambda (future)

## Usage

### Importing Schemas

```typescript
// Import all schemas
import { users, customers, tenants } from '@ffp/database/schema';

// Import types
import type { User, Customer, Tenant } from '@ffp/database/schema';

// Import everything
import * as database from '@ffp/database';
```

### Running Migrations

From the project root:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only)
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

All tenant-scoped tables use PostgreSQL Row-Level Security (RLS) for automatic data isolation:

```sql
-- Example RLS policy (applied automatically)
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Important**: Always set RLS context before queries (implementation coming in FFP-49/50):

```typescript
// Future implementation
await db.transaction(async (tx) => {
  await tx.execute(sql`SET app.tenant_id = ${tenantId}`);
  return await tx.query.users.findMany();
});
```

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
