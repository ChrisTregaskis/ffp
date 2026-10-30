# FFP - Database Schema Documentation

## Overview

FFP uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation, accessed through Drizzle ORM for type-safe database operations. Every member- and organisation-data table enforces RLS to prevent cross-organisation data access; `process_jobs` is the one organisation-scoped table without it (see Table Classification).

---

## Why PostgreSQL + RLS + Drizzle ORM

### Benefits

- **Single database**: Cost-effective, simpler operations
- **Strong isolation**: Database-enforced security (not just application-level)
- **Type-safe queries**: Drizzle provides end-to-end TypeScript type safety
- **Serverless-optimised**: Lightweight ORM perfect for Lambda functions
- **Easy analytics**: Query across organisations when needed (system admin)
- **ACID guarantees**: Full transaction support

### Trade-offs

- Requires careful query design
- All queries must include organisation context
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
│                           DATABASE SCHEMA (ERD)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  A ──▶ B : B holds A's id                                               │
│  MULTI-TENANT HIERARCHY (RLS enforced)                                  │
│  ═════════════════════════════════════                                  │
│                                                                         │
│  ┌───────────────┐   ┌─────────────┐     ┌─────────────┐                │
│  │ organisations │──▶│  locations  │────▶│    users    │                │
│  │───────────────│   │─────────────│     │─────────────│                │
│  │ id            │   │ org_id      │     │ org_id      │                │
│  │ name          │   │ id          │     │ location_id │                │
│  │ type          │   │ name        │     │ email       │                │
│  │ settings      │   │ status      │     │ role        │                │
│  │ status        │   │ account_code│     │ cognito_sub │                │
│  └───────────────┘   └─────────────┘     └──────┬──────┘                │
│                                                 │                       │
│                                                 ▼                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   MEMBER DATA (RLS enforced)                     │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  programmes ──▶ programme_phases ──▶ user_sessions               │   │
│  │      │                                    │                      │   │
│  │      ▼                                    ▼                      │   │
│  │  user_assessments                  user_session_exercises        │   │
│  │      │          │                         │                      │   │
│  │      ▼          ▼                         ▼                      │   │
│  │  user_assessment_answers           exercise_completions          │   │
│  │                 assessment_safety_triggers                       │   │
│  │                                                                  │   │
│  │  Every table here carries organisation_id; users own             │   │
│  │  programmes and user_assessments                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SYSTEM CONTENT (no RLS: shared across organisations)                   │
│  ════════════════════════════════════════════════════                   │
│                                                                         │
│  Assessment catalogue                                                   │
│    assessment_flows ──▶ flow_steps ◀── assessment_templates             │
│    assessment_templates ──▶ template_questions ◀── questions            │
│    (scoring config is flow-level JSONB on assessment_flows)             │
│                                                                         │
│  Programme templates                                                    │
│    programme_templates ──▶ template_phases ──▶ template_sessions        │
│    template_sessions ──▶ session_exercises ◀── videos                   │
│    template_sessions ──▶ template_session_slots ──▶ template_slot_tags  │
│                                                                         │
│  Video catalogue                                                        │
│    videos ──▶ video_tags ◀── tags ◀── tag_categories                    │
│                                                                         │
│  Jobs                                                                   │
│    process_jobs: carries organisation_id, but the job processor claims  │
│    jobs across organisations, so it has no RLS yet                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Table Classification

### RLS-Protected Tables (Organisation Data)

RLS is enabled on these 11 tables, and forced too outside production (`FORCE` is skipped when `ENVIRONMENT` is `production` or `prod`), so even the table owner is filtered. Policies key on `app.organisation_id`; the admin bypass policies are below.

| Table                        | Policies                                                                                                                                                | Description                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `organisations`              | `organisation_read_isolation` (SELECT: own organisation, or the platform organisation), `organisation_write_isolation` (own organisation), admin bypass | Organisation registry                                      |
| `locations`                  | `location_isolation`, admin bypass                                                                                                                      | Location entities                                          |
| `users`                      | `user_isolation`, admin bypass                                                                                                                          | User accounts                                              |
| `user_assessments`           | `user_assessment_organisation_isolation`                                                                                                                | Assessment instances                                       |
| `user_assessment_answers`    | `user_assessment_answers_organisation_isolation`                                                                                                        | Individual answers                                         |
| `assessment_safety_triggers` | `assessment_safety_triggers_organisation_isolation`                                                                                                     | One row per submitted assessment that raised safety advice |
| `programmes`                 | `programme_organisation_isolation`, `programme_admin_read_bypass` (SELECT)                                                                              | Generated programmes                                       |
| `programme_phases`           | `programme_phases_organisation_isolation`                                                                                                               | A programme's phases                                       |
| `user_sessions`              | `user_sessions_organisation_isolation`                                                                                                                  | A member's sessions within a phase                         |
| `user_session_exercises`     | `user_session_exercises_organisation_isolation`                                                                                                         | The exercises of a member's session                        |
| `exercise_completions`       | `exercise_completions_organisation_isolation`                                                                                                           | Exercise completions within a started session              |

16 policies in all. Every policy other than the admin bypasses compares `organisation_id` (or the organisation's own `id`) with `NULLIF(current_setting('app.organisation_id', true), '')::uuid`.

### Tables Without RLS

These hold shared, system-managed content (or, for `process_jobs`, a queue the job processor reads across organisations). The admin routes over the catalogue tables are gated on `system_admin` in the handler, not by RLS.

| Table                    | Description                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `assessment_flows`       | Assessment journey with flow-level scoring config                                              |
| `flow_steps`             | Normalised step definitions with branching rules                                               |
| `assessment_templates`   | A set of questions a step shows                                                                |
| `template_questions`     | Template ↔ question links, with per-template overrides                                        |
| `questions`              | Reusable question bank                                                                         |
| `programme_templates`    | Programme blueprints                                                                           |
| `template_phases`        | A programme template's phases                                                                  |
| `template_sessions`      | A template phase's sessions                                                                    |
| `session_exercises`      | A template session's fixed exercises                                                           |
| `template_session_slots` | A template session's slots, filled from a tag pool when a programme is generated               |
| `template_slot_tags`     | The tags a slot draws from                                                                     |
| `videos`                 | Video content library                                                                          |
| `tag_categories`         | The seeded axes videos are tagged by                                                           |
| `tags`                   | Admin-authored tags within a category                                                          |
| `video_tags`             | Video ↔ tag links                                                                             |
| `process_jobs`           | Async job queue. Carries `organisation_id`, but the processor claims jobs across organisations |

---

## Type Management Pattern

**Zod schemas in `@ffp/core` are the single source of truth** for all entity types. Database schemas are kept in sync manually.

### Import Rules

```typescript
// [✓] CORRECT: Application code imports types from @ffp/core
import { User, UserRole, Organisation, Location } from '@ffp/core';

// [✓] CORRECT: Repository code imports table schemas from @ffp/database
import { users, locations, organisations } from '@ffp/database/schema';

// [✓] CORRECT: But repositories return types from @ffp/core
import type { User } from '@ffp/core';
```

### Package Responsibilities

| Import From     | Use For                                        |
| --------------- | ---------------------------------------------- |
| `@ffp/core`     | Types (User, Organisation), Validation schemas |
| `@ffp/database` | Table definitions, DB operations               |

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
│     JWT contains: organisationId, userId, role                          │
│                                                                         │
│  2. SET RLS CONTEXT                                                     │
│     ─────────────────                                                   │
│     SET app.organisation_id = 'uuid-here';                              │
│     SET app.user_id = 'uuid-here';                                      │
│                                                                         │
│  3. QUERY EXECUTES                                                      │
│     ─────────────────                                                   │
│     SELECT * FROM users;                                                │
│                                                                         │
│  4. RLS POLICY APPLIED                                                  │
│     ────────────────────                                                │
│     PostgreSQL automatically filters:                                   │
│     WHERE organisation_id = current_setting('app.organisation_id')::UUID│
│                                                                         │
│  5. RESULT                                                              │
│     ────────                                                            │
│     Only rows matching organisation_id are returned                     │
│     Cross-organisation access is IMPOSSIBLE at database level           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### RLS Policy Pattern

```sql
-- Standard organisation isolation policy
CREATE POLICY user_isolation ON users
  FOR ALL
  USING (organisation_id = NULLIF(current_setting('app.organisation_id', true), '')::UUID);
```

### System Admin Multi-Tenant Access

System administrator queries run under `withAdminContext` (`@ffp/database`), which sets `app.is_admin = 'true'` for the transaction. Separate permissive policies key on that flag:

| Table                                 | Admin bypass                                         |
| ------------------------------------- | ---------------------------------------------------- |
| `organisations`, `locations`, `users` | `FOR ALL`                                            |
| `programmes`                          | `FOR SELECT` only; writes stay organisation-isolated |
| Every other organisation-scoped table | None                                                 |

```sql
CREATE POLICY programme_admin_read_bypass ON programmes
  FOR SELECT
  USING (current_setting('app.is_admin', true) = 'true');
```

To read deeper into one member's data (phases, sessions, exercises, completions), resolve the user under admin context, then read under **that user's own organisation** with `withRLS`, taking the organisation from the user's row and never from the request. Policies live in `packages/database/src/migrations/apply-rls.ts` and are re-applied by every `pnpm db:migrate`.

### Using RLS in Code

```typescript
import { withRLS } from '@ffp/database';

// All queries within this transaction are automatically filtered by organisation
const assessments = await withRLS(organisationId, userId, async (tx) => {
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
  organisationId: string,
  userId: string | undefined,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> => {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET app.organisation_id = ${organisationId}`);
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
| Organisations           | `packages/database/src/schema/organisations.ts`           |
| Locations               | `packages/database/src/schema/locations.ts`               |
| Users                   | `packages/database/src/schema/users.ts`                   |
| Assessment Templates    | `packages/database/src/schema/assessment-templates.ts`    |
| Assessment Flows        | `packages/database/src/schema/assessment-flows.ts`        |
| Flow Steps              | `packages/database/src/schema/flow-steps.ts`              |
| Questions               | `packages/database/src/schema/questions.ts`               |
| Template Questions      | `packages/database/src/schema/template-questions.ts`      |
| User Assessments        | `packages/database/src/schema/user-assessments.ts`        |
| User Assessment Answers | `packages/database/src/schema/user-assessment-answers.ts` |
| Process Jobs            | `packages/database/src/schema/process-jobs.ts`            |

### Pending Schemas

| Table      | Status      |
| ---------- | ----------- |
| Audit Logs | Not started |

---

## Performance Optimisation

### Indexing Strategy

All schemas include appropriate indexes:

- `organisation_id` indexed on all RLS tables
- `user_id` indexed for user-specific queries
- Composite indexes for common query patterns (e.g., `organisation_id + user_id`)
- Unique indexes for business constraints

### Query Best Practices

| Practice                | Example                                          |
| ----------------------- | ------------------------------------------------ |
| Specify columns         | `.select({ id, name })` not `.select()`          |
| Use LIMIT               | `.limit(20)` for list queries                    |
| Use prepared statements | `.prepare('query_name')` for hot paths           |
| Include org filter      | Always filter by `organisation_id` even with RLS |

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

| Test Case                         | Expected Result                       |
| --------------------------------- | ------------------------------------- |
| Query from wrong org context      | Returns empty result                  |
| Insert with wrong organisation_id | RLS blocks or query fails             |
| System admin cross-org query      | Returns data from all organisations   |
| Location user sees parent data    | Returns data within same organisation |

### Integration Test Pattern

```typescript
it('prevents cross-organisation data access', async () => {
  // Create data in org1 context
  const assessment = await withRLS(org1.id, user1.id, async (tx) => {
    return await tx.insert(userAssessments).values({...}).returning();
  });

  // Query from org2 context - should NOT see org1 data
  const results = await withRLS(org2.id, user2.id, async (tx) => {
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
