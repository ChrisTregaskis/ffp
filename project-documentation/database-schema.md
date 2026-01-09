# FFP - Database Schema Documentation

## Overview

FFP uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation, accessed through Drizzle ORM for type-safe database operations. All tenant-scoped tables enforce RLS policies to prevent cross-tenant data access.

---

## Why PostgreSQL + RLS + Drizzle ORM

### Benefits

- **Single database**: Cost-effective, simpler operations
- **Strong isolation**: Database-enforced security (not just application-level)
- **Type-safe queries**: Drizzle provides end-to-end TypeScript type safety
- **Serverless-optimised**: Lightweight ORM perfect for Lambda functions
- **Easy analytics**: Query across tenants when needed (system admin)
- **ACID guarantees**: Full transaction support

### Trade-offs

- Requires careful query design
- All queries must include tenant context
- Must test data isolation thoroughly

---

## Database Configuration (RDS)

### Phase 1 Setup

| Setting          | Value                      |
| ---------------- | -------------------------- |
| Instance         | t3.small or t4g.small      |
| Memory           | 2 vCPU, 2GB RAM            |
| Storage          | 50GB SSD with auto-scaling |
| Availability     | Single AZ (upgrade later)  |
| Backups          | Daily, 7-day retention     |
| Encryption       | At rest via KMS            |
| Connection limit | ~100 connections           |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATABASE SCHEMA (ERD)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MULTI-TENANT HIERARCHY                                                 │
│  ══════════════════════                                                 │
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │   tenants   │────▶│  customers  │────▶│    users    │                │
│  │─────────────│     │─────────────│     │─────────────│                │
│  │ id          │     │ tenant_id   │     │ tenant_id   │                │
│  │ name        │     │ id          │     │ customer_id │                │
│  │ type        │     │ name        │     │ email       │                │
│  │ subdomain   │     │ status      │     │ role        │                │
│  │ status      │     │ owner_id    │     │ cognito_sub │                │
│  └─────────────┘     └─────────────┘     └─────────────┘                │
│        │                                        │                       │
│        │                                        │                       │
│        ▼                                        ▼                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    USER DATA (RLS Enforced)                      │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌───────────────────┐    ┌─────────────────────────┐            │   │
│  │  │  user_assessments │───▶│ user_assessment_answers │            │   │
│  │  │───────────────────│    │─────────────────────────│            │   │
│  │  │ tenant_id         │    │ tenant_id               │            │   │
│  │  │ user_id           │    │ user_assessment_id      │            │   │
│  │  │ flow_id           │    │ question_id             │            │   │
│  │  │ status            │    │ answer_value            │            │   │
│  │  │ scores            │    └─────────────────────────┘            │   │
│  │  └───────────────────┘                                           │   │
│  │           │                                                      │   │
│  │           ▼                                                      │   │
│  │  ┌───────────────────┐    ┌───────────────────┐                  │   │
│  │  │    programs       │    │  process_jobs     │                  │   │
│  │  │───────────────────│    │───────────────────│                  │   │
│  │  │ tenant_id         │    │ tenant_id         │                  │   │
│  │  │ user_id           │    │ type              │                  │   │
│  │  │ assessment_id     │    │ status            │                  │   │
│  │  │ duration_weeks    │    │ payload           │                  │   │
│  │  └───────────────────┘    └───────────────────┘                  │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SYSTEM CONTENT (No RLS - shared across tenants)                        │
│  ═══════════════════════════════════════════════                        │
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │ assessment_     │    │ template_questions  │    │   questions     │  │
│  │ templates       │───▶│ (join table)        │◀───│                 │  │
│  │─────────────────│    │─────────────────────│    │─────────────────│  │
│  │ id              │    │ template_id         │    │ id              │  │
│  │ name            │    │ question_id         │    │ slug            │  │
│  │ scoring_config  │    │ display_order       │    │ type            │  │
│  └─────────────────┘    └─────────────────────┘    │ question_text   │  │
│                                                    │ options         │  │
│  ┌─────────────────┐    ┌─────────────────┐        └─────────────────┘  │
│  │ assessment_     │    │    videos       │                             │
│  │ flows           │    │─────────────────│                             │
│  │─────────────────│    │ id              │                             │
│  │ id              │    │ title           │                             │
│  │ name            │    │ s3_key          │                             │
│  │ steps (JSONB)   │    │ duration        │                             │
│  └─────────────────┘    └─────────────────┘                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Table Classification

### RLS-Protected Tables (Tenant Data)

These tables contain user/customer data and **require RLS policies**:

| Table                     | RLS Policy        | Description            |
| ------------------------- | ----------------- | ---------------------- |
| `users`                   | `tenant_id` match | User accounts          |
| `customers`               | `tenant_id` match | Customer organisations |
| `user_assessments`        | `tenant_id` match | Assessment instances   |
| `user_assessment_answers` | `tenant_id` match | Individual answers     |
| `programs`                | `tenant_id` match | Generated programmes   |
| `process_jobs`            | `tenant_id` match | Async job queue        |

### System Content Tables (No RLS)

These tables contain shared content accessible to all authenticated users:

| Table                  | Description                        |
| ---------------------- | ---------------------------------- |
| `tenants`              | Tenant registry (platform-managed) |
| `assessment_templates` | Assessment configuration           |
| `assessment_flows`     | Journey step definitions           |
| `questions`            | Reusable question bank             |
| `template_questions`   | Template ↔ Question links         |
| `videos`               | Video content library              |

---

## Type Management Pattern

**Zod schemas in `@ffp/core` are the single source of truth** for all entity types. Database schemas are kept in sync manually.

### Import Rules

```typescript
// ✅ CORRECT: Application code imports types from @ffp/core
import { User, UserRole, Tenant, Customer } from '@ffp/core';

// ✅ CORRECT: Repository code imports table schemas from @ffp/database
import { users, customers, tenants } from '@ffp/database/schema';

// ✅ CORRECT: But repositories return types from @ffp/core
import type { User } from '@ffp/core';
```

### Package Responsibilities

| Import From     | Use For                                  |
| --------------- | ---------------------------------------- |
| `@ffp/core`     | Types (User, Tenant), Validation schemas |
| `@ffp/database` | Table definitions, DB operations         |

---

## Row-Level Security (RLS)

### How RLS Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       RLS ENFORCEMENT                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. REQUEST ARRIVES                                                     │
│     ─────────────────                                                   │
│     JWT contains: tenantId, userId, role                                │
│                                                                         │
│  2. SET RLS CONTEXT                                                     │
│     ─────────────────                                                   │
│     SET app.tenant_id = 'uuid-here';                                    │
│     SET app.user_id = 'uuid-here';                                      │
│                                                                         │
│  3. QUERY EXECUTES                                                      │
│     ─────────────────                                                   │
│     SELECT * FROM users;                                                │
│                                                                         │
│  4. RLS POLICY APPLIED                                                  │
│     ────────────────────                                                │
│     PostgreSQL automatically filters:                                   │
│     WHERE tenant_id = current_setting('app.tenant_id')::UUID            │
│                                                                         │
│  5. RESULT                                                              │
│     ────────                                                            │
│     Only rows matching tenant_id are returned                           │
│     Cross-tenant access is IMPOSSIBLE at database level                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### RLS Policy Pattern

```sql
-- Standard tenant isolation policy
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
```

### System Admin Multi-Tenant Access

System administrators (`role='system_admin'`) can access all tenants:

```sql
-- Policy with system_admin bypass
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id', true)::UUID
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.user_id', true)::UUID
      AND u.role = 'system_admin'
    )
  );
```

### Using RLS in Code

```typescript
import { withRLS } from '@ffp/database';

// All queries within this transaction are automatically filtered by tenant
const assessments = await withRLS(tenantId, userId, async (tx) => {
  return await tx.select().from(userAssessments);
});
```

---

## Connection Management

### Lambda-Optimised Pool

```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10, // Connection pool size (Lambda-optimised)
});
```

### Transaction Wrapper with RLS

```typescript
export const withRLS = async <T>(
  tenantId: string,
  userId: string | undefined,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> => {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET app.tenant_id = ${tenantId}`);
    if (userId) {
      await tx.execute(sql`SET app.user_id = ${userId}`);
    }
    return await callback(tx);
  });
};
```

---

## Migration Strategy

### Drizzle Kit Commands

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio (visual DB browser)
pnpm db:studio
```

### Pre-Deployment Migration Lambda

Migrations run as a Lambda function before deployment:

```typescript
export const handler = async () => {
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './migrations' });
  return { statusCode: 200, body: 'Migrations complete' };
};
```

---

## Implementation Reference

### Implemented Schemas

| Table                   | File Path                                                 |
| ----------------------- | --------------------------------------------------------- |
| Tenants                 | `packages/database/src/schema/tenants.ts`                 |
| Customers               | `packages/database/src/schema/customers.ts`               |
| Users                   | `packages/database/src/schema/users.ts`                   |
| Assessment Templates    | `packages/database/src/schema/assessment-templates.ts`    |
| Assessment Flows        | `packages/database/src/schema/assessment-flows.ts`        |
| Questions               | `packages/database/src/schema/questions.ts`               |
| Template Questions      | `packages/database/src/schema/template-questions.ts`      |
| User Assessments        | `packages/database/src/schema/user-assessments.ts`        |
| User Assessment Answers | `packages/database/src/schema/user-assessment-answers.ts` |
| Process Jobs            | `packages/database/src/schema/process-jobs.ts`            |

### Pending Schemas

| Table            | Status      |
| ---------------- | ----------- |
| Programs         | Not started |
| Program Sessions | Not started |
| Videos           | Not started |
| User Progress    | Not started |
| Audit Logs       | Not started |

---

## Performance Optimisation

### Indexing Strategy

All schemas include appropriate indexes:

- `tenant_id` indexed on all RLS tables
- `user_id` indexed for user-specific queries
- Composite indexes for common query patterns (e.g., `tenant_id + user_id`)
- Unique indexes for business constraints

### Query Best Practices

| Practice                | Example                                    |
| ----------------------- | ------------------------------------------ |
| Specify columns         | `.select({ id, name })` not `.select()`    |
| Use LIMIT               | `.limit(20)` for list queries              |
| Use prepared statements | `.prepare('query_name')` for hot paths     |
| Include tenant filter   | Always filter by `tenant_id` even with RLS |

### Prepared Statements

```typescript
// Prepare frequently-used query for better performance
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('userId')))
  .prepare('get_user_by_id');

// Execute with parameters
const user = await getUserById.execute({ userId: '123' });
```

---

## Backup & Recovery

### Automated Backups

- **Schedule**: Daily at 3 AM UTC
- **Retention**: 7 days (Phase 1)
- **Recovery**: Point-in-time within retention window

### Manual Backup

```bash
# Backup before major changes
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup.sql

# Restore if needed
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup.sql
```

---

## Testing Data Isolation

### Critical Test Cases

| Test Case                          | Expected Result                 |
| ---------------------------------- | ------------------------------- |
| Query from wrong tenant context    | Returns empty result            |
| Insert with wrong tenant_id        | RLS blocks or query fails       |
| System admin cross-tenant query    | Returns data from all tenants   |
| Customer sub-user sees parent data | Returns data within same tenant |

### Integration Test Pattern

```typescript
it('prevents cross-tenant data access', async () => {
  // Create data in tenant1 context
  const assessment = await withRLS(tenant1.id, user1.id, async (tx) => {
    return await tx.insert(userAssessments).values({...}).returning();
  });

  // Query from tenant2 context - should NOT see tenant1 data
  const results = await withRLS(tenant2.id, user2.id, async (tx) => {
    return await tx.select().from(userAssessments);
  });

  expect(results).not.toContainEqual(
    expect.objectContaining({ id: assessment.id })
  );
});
```

---

## Future Enhancements

| Enhancement        | Phase   | Benefit                    | Cost        |
| ------------------ | ------- | -------------------------- | ----------- |
| Read Replicas      | Phase 2 | Offload read queries       | ~£30/month  |
| RDS Proxy          | Phase 2 | Better Lambda connections  | ~£15/month  |
| Table Partitioning | Phase 3 | Improved query performance | Migration   |
| Multi-AZ           | Phase 3 | High availability          | 2x instance |

---

## Related Documentation

- `architecture.md` - Overall system architecture
- `authentication.md` - JWT and context extraction
- `coding-standards.md` - Repository pattern examples
- `assessment-engine.md` - Assessment-specific schemas
