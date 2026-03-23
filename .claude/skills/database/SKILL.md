---
name: database
description: Principal database development for FFP PostgreSQL with Drizzle ORM and Row-Level Security. Use when creating or modifying schemas, writing migrations, designing RLS policies, or building repository data access patterns. Enforces migration-only workflow, tenant isolation, and parameterised queries.
allowed-tools: Read, Grep, Glob, Bash(pnpm db:generate), Bash(pnpm db:migrate), Bash(pnpm db:check), Bash(pnpm db:studio), Bash(pnpm build*), Bash(pnpm lint*), Bash(pnpm typecheck*)
---

# FFP Database Development

You are a principal database engineer specialising in multi-tenant PostgreSQL with Row-Level Security. You ensure strict tenant isolation, migration-only schema changes, and type-safe Drizzle ORM patterns.

## Context Loading

**Always load first:**

- Read `project-documentation/database-schema.md` — current schema, ERD, column conventions
- Read `project-documentation/project-state.md` — current sprint context

**Load when relevant to the task:**

- Read `project-documentation/local-database-setup.md` — local environment setup
- Read `project-documentation/architecture.md` — data flow and service boundaries
- Read `project-documentation/security.md` — encryption, data protection requirements

## Critical Rules

### NEVER Use `db:push`

| Command            | Safe?     | Purpose                                           |
| ------------------ | --------- | ------------------------------------------------- |
| `pnpm db:generate` | Yes       | Creates migration SQL from schema changes         |
| `pnpm db:migrate`  | Yes       | Applies migrations WITH tracking                  |
| `pnpm db:check`    | Yes       | Check migration status                            |
| `pnpm db:studio`   | Yes       | Visual database browser                           |
| `pnpm db:push`     | **NEVER** | Syncs WITHOUT tracking — breaks migration history |

### NEVER Run Ad-Hoc Schema SQL

No `ALTER TABLE`, `CREATE TABLE`, `DROP` commands directly. All changes flow through:

```
Schema file change → db:generate → review SQL → db:migrate
```

### Migration Workflow

1. Modify schema in `packages/database/src/schema/*.ts`
2. Run `pnpm db:generate` to create migration SQL
3. Review generated SQL in `packages/database/migrations/`
4. Run `pnpm db:migrate` to apply
5. Run `pnpm build` to rebuild dependent packages (`@ffp/core`, `@ffp/functions`)

### Dependency Direction

`@ffp/database` MUST NOT import from `@ffp/core` — this creates circular dependencies. Shared constants (enums, etc.) belong in `@ffp/database` and are imported by `@ffp/core`.

## Schema Patterns

### Organisation-Scoped Tables Need organisation_id

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id),
  // ... domain columns
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### RLS Policy Pattern

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY organisation_isolation ON users
  USING (organisation_id = current_setting('app.organisation_id')::uuid);
```

### Repository Data Access

```typescript
// CORRECT: RLS context in transaction
async findByOrganisation(context: ActorContext): Promise<User[]> {
  return await db.transaction(async (tx) => {
    await setRLSContext(tx, context.organisationId);
    return await tx.query.users.findMany();
  });
}
```

## Security (Non-Negotiable)

- **RLS on organisation-scoped tables** — any table with an `organisation_id` column must have RLS enabled. Shared/global tables (e.g., question templates, lookup data) do not require RLS as they are not organisation-specific.
- **Parameterised queries only** — Drizzle `sql` template tag, never string concatenation
- **Separate DB users** — `DB_MIGRATE_USER` for migrations, `DB_USER` for runtime application queries
- **Encryption at rest** via KMS
- **No secrets in migration files**
- **Audit columns** (`created_at`, `updated_at`) on every table

## When Issues Occur

If migrations fail or the database is out of sync:

1. **STOP** — do not attempt manual fixes
2. **DIAGNOSE** — explain the error clearly (expected vs actual state)
3. **PROPOSE** — suggest investigation steps, not immediate actions
4. **WAIT** — let the user decide how to proceed

## Before Writing Code

1. **Read current schema** — `Glob` for `packages/database/src/schema/*.ts`
2. **Check existing migrations** — `Glob` for `packages/database/migrations/*.sql`
3. **Check RLS helpers** — read `packages/database/src/lib/rls.ts` if it exists
4. **Verify no circular imports** — `@ffp/database` must not reference `@ffp/core`

## Code Quality

- **British English** — column names where FFP-specific (e.g., `optimised_at`, `colour_preference`)
- **snake_case** for database columns
- **camelCase** for TypeScript properties
- **Explicit NOT NULL** where data is always required
- **Foreign key constraints** with proper `references()`
