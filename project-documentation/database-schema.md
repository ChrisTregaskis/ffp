# FFP - Database Schema Documentation

## Overview

FFP uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation, accessed through Drizzle ORM for type-safe database operations. All tenant-scoped tables enforce RLS policies to prevent cross-tenant data access.

## Why PostgreSQL + RLS + Drizzle ORM

### Benefits

- **Single database**: Cost-effective, simpler operations
- **Strong isolation**: Database-enforced security (not just application-level)
- **Type-safe queries**: Drizzle provides end-to-end TypeScript type safety
- **Serverless-optimized**: Lightweight ORM perfect for Lambda functions
- **Easy analytics**: Query across tenants when needed
- **ACID guarantees**: Full transaction support
- **Proven at scale**: Used by major SaaS platforms

### Trade-offs

- Requires careful query design
- All queries must include tenant context
- Must test data isolation thoroughly

## Database Configuration (RDS)

### Phase 1 Setup

- **Instance**: t3.small or t4g.small (2 vCPU, 2GB RAM)
- **Storage**: 50GB SSD with auto-scaling enabled
- **Availability**: Single AZ (can upgrade to Multi-AZ later)
- **Backups**: Daily automated, 7-day retention
- **Encryption**: At rest via KMS
- **Connection limit**: ~100 connections (Lambda optimized)

## Drizzle ORM Setup

### Installation

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit drizzle-zod @types/pg
```

### Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema/*',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
});
```

### Importing Schemas

All database schemas are available through the `@ffp/database` package:

```typescript
// Importing all schemas
import { users, customers, tenants } from '@ffp/database/schema';

// Importing specific types
import type { User, Customer, Tenant } from '@ffp/database/schema';

// Importing everything from the package
import * as database from '@ffp/database';
```

**Package Structure:**

- Main exports: `@ffp/database` (all schemas and types)
- Schema exports: `@ffp/database/schema` (specific schemas)

### Database Client

```typescript
// lib/database.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10, // Connection pool size
});

export const db = drizzle(pool);

// RLS context setting (PostgreSQL-specific, uses raw SQL)
export async function setRLSContext(tenantId: string, userId?: string) {
  await db.execute(sql`SET app.tenant_id = ${tenantId}`);
  if (userId) {
    await db.execute(sql`SET app.user_id = ${userId}`);
  }
}

// Transaction wrapper with RLS
export async function withRLS<T>(
  tenantId: string,
  userId: string | undefined,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET app.tenant_id = ${tenantId}`);
    if (userId) {
      await tx.execute(sql`SET app.user_id = ${userId}`);
    }
    return await callback(tx);
  });
}
```

## Core Schema Definitions

### Tenants Table

_Now Implemented - View `packages/database/src/schema/tenants.ts` for up-to-date schema`_

### Customers Table

_Now Implemented - View `packages/database/src/schema/customers.ts` for up-to-date schema`_

### Users Table

_Now Implemented - View `packages/database/src/schema/users.ts` for up-to-date schema`_

### Assessment Templates Table

```typescript
// schema/assessment-templates.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';

export const assessmentTemplates = pgTable(
  'assessment_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    questions: jsonb('questions').notNull(),
    scoringConfig: jsonb('scoring_config').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_assessment_templates_active').on(table.isActive),
  })
);

// Auto-generated Zod schemas
export const insertAssessmentTemplateSchema = createInsertSchema(assessmentTemplates);
export const selectAssessmentTemplateSchema = createSelectSchema(assessmentTemplates);

// TypeScript types
export type AssessmentTemplate = typeof assessmentTemplates.$inferSelect;
export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;

// No RLS needed (system-managed, not tenant-specific)
```

### User Assessments Table

```typescript
// schema/user-assessments.ts
import { pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { assessmentTemplates } from './assessment-templates';

export const assessmentStatusEnum = pgEnum('assessment_status', [
  'in_progress',
  'completed',
  'abandoned',
]);

export const userAssessments = pgTable(
  'user_assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => assessmentTemplates.id, { onDelete: 'restrict' }),
    status: assessmentStatusEnum('status').notNull().default('in_progress'),
    answers: jsonb('answers').default({}),
    score: jsonb('score'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantUserIdx: index('idx_user_assessments_tenant_user').on(table.tenantId, table.userId),
    statusIdx: index('idx_user_assessments_status').on(table.status),
  })
);

// Relations
export const userAssessmentsRelations = relations(userAssessments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userAssessments.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userAssessments.userId],
    references: [users.id],
  }),
  template: one(assessmentTemplates, {
    fields: [userAssessments.templateId],
    references: [assessmentTemplates.id],
  }),
}));

// Auto-generated Zod schemas
export const insertUserAssessmentSchema = createInsertSchema(userAssessments);
export const selectUserAssessmentSchema = createSelectSchema(userAssessments);

// TypeScript types
export type UserAssessment = typeof userAssessments.$inferSelect;
export type NewUserAssessment = typeof userAssessments.$inferInsert;

// RLS enabled via migration (see below)
```

### Programs Table

```typescript
// schema/programs.ts
import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { userAssessments } from './user-assessments';

export const difficultyLevelEnum = pgEnum('difficulty_level', [
  'beginner',
  'intermediate',
  'advanced',
]);

export const programs = pgTable(
  'programs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => userAssessments.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    durationWeeks: integer('duration_weeks').notNull(),
    difficultyLevel: difficultyLevelEnum('difficulty_level').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantUserIdx: index('idx_programs_tenant_user').on(table.tenantId, table.userId),
    assessmentIdx: index('idx_programs_assessment').on(table.assessmentId),
  })
);

// Relations
export const programsRelations = relations(programs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [programs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [programs.userId],
    references: [users.id],
  }),
  assessment: one(userAssessments, {
    fields: [programs.assessmentId],
    references: [userAssessments.id],
  }),
  sessions: many(programSessions),
}));

// Auto-generated Zod schemas
export const insertProgramSchema = createInsertSchema(programs);
export const selectProgramSchema = createSelectSchema(programs);

// TypeScript types
export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;

// RLS enabled via migration (see below)
```

### Videos Table

```typescript
// schema/videos.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    s3Key: varchar('s3_key', { length: 500 }).notNull().unique(),
    thumbnailUrl: text('thumbnail_url'),
    durationSeconds: integer('duration_seconds').notNull(),
    difficultyLevel: difficultyLevelEnum('difficulty_level').notNull(),
    bodyParts: text('body_parts').array().notNull(),
    equipment: text('equipment').array(),
    tags: text('tags').array(),
    isActive: boolean('is_active').notNull().default(true),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    difficultyIdx: index('idx_videos_difficulty').on(table.difficultyLevel),
    activeIdx: index('idx_videos_active').on(table.isActive),
  })
);

// Auto-generated Zod schemas
export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);

// TypeScript types
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

// No RLS needed (system-managed content library)
```

## Row-Level Security (RLS) Implementation

### Enabling RLS via Migration

```typescript
// migrations/custom/enable-rls.sql.ts
import { sql } from 'drizzle-orm';

export const enableRLS = sql`
  -- Enable RLS on tenant-scoped tables
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  CREATE POLICY tenant_isolation_users ON users
    FOR ALL 
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

  CREATE POLICY tenant_isolation_assessments ON user_assessments
    FOR ALL 
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

  CREATE POLICY tenant_isolation_programs ON programs
    FOR ALL 
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

  CREATE POLICY tenant_isolation_sessions ON program_sessions
    FOR ALL 
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

  CREATE POLICY tenant_isolation_progress ON user_progress
    FOR ALL 
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

  -- Audit logs policy (system admins only)
  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

  CREATE POLICY admin_only_audit_logs ON audit_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = current_setting('app.user_id', true)::UUID
        AND users.role = 'system_admin'
      )
    );
`;
```

### System Administrator Multi-Tenant Access

System administrators (`role='system_admin'`) need access to all tenants for platform management. This is achieved through:

**1. Platform Tenant ID**

System admins use a special reserved tenant ID instead of belonging to a specific customer tenant:

```typescript
import { PLATFORM_TENANT_ID } from '@ffp/core';

// System admin has tenantId = 'platform' (PLATFORM_TENANT_ID constant)
// This is NOT a real customer tenant, but a marker for platform-level access
const systemAdminJWT = {
  sub: 'admin-user-id',
  email: 'admin@ffp.com',
  'custom:tenantId': PLATFORM_TENANT_ID, // 'platform'
  'custom:customerId': null,
  'custom:role': 'system_admin',
};
```

**2. RLS Policy Bypass**

RLS policies check for `role='system_admin'` to grant cross-tenant access:

```sql
-- Example: Users table policy with system_admin bypass
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (
    -- Either: Match tenant_id (normal users)
    tenant_id = current_setting('app.tenant_id', true)::UUID
    OR
    -- Or: System admin role bypasses tenant isolation
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.user_id', true)::UUID
      AND u.role = 'system_admin'
    )
  );
```

**3. Application-Level Context Extraction**

Handler functions extract context and handle system admin case:

```typescript
export function extractUserContext(event: APIGatewayEvent): TenantContext {
  const claims = event.requestContext.authorizer.jwt.claims;
  const role = claims['custom:role'] as string;
  const tenantId = claims['custom:tenantId'] as string;

  // System admins can operate across all tenants
  // Still set tenantId to PLATFORM_TENANT_ID for audit trails
  return {
    actor: {
      type: 'user',
      userId: claims.sub,
      userRole: role,
      email: claims.email,
    },
    tenantId: tenantId, // Will be PLATFORM_TENANT_ID for system_admin
    customerId: role === 'system_admin' ? null : claims['custom:customerId'],
  };
}
```

**Important Notes:**

- `PLATFORM_TENANT_ID` ('platform') is a **reserved identifier** and must never be used for customer tenants
- System admin queries still require RLS context to be set (for audit purposes)
- Database-level policies perform the role check to grant cross-tenant access
- System admins should still be scoped to specific operations for security (e.g., read-only audit logs)

### Usage in Lambda Functions

```typescript
import { withRLS } from '../lib/database';
import { userAssessments } from '../schema/user-assessments';
import { eq } from 'drizzle-orm';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const tenantId = claims['custom:tenantId'] as string;
  const userId = claims.sub as string;

  // RLS automatically applied to all queries within this transaction
  const assessments = await withRLS(tenantId, userId, async (tx) => {
    return await tx.select().from(userAssessments).where(eq(userAssessments.userId, userId));
  });

  return {
    statusCode: 200,
    body: JSON.stringify(assessments),
  };
};
```

## Repository Pattern with Drizzle

### Repository Implementation

```typescript
// repositories/assessment.repository.impl.ts
import { eq, and } from 'drizzle-orm';
import { db, withRLS } from '../lib/database';
import { userAssessments } from '../schema/user-assessments';
import type { NewUserAssessment, UserAssessment } from '../schema/user-assessments';

export class AssessmentRepositoryImpl implements AssessmentRepository {
  async create(data: NewUserAssessment, context: TenantContext): Promise<UserAssessment> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      const [assessment] = await tx
        .insert(userAssessments)
        .values({
          ...data,
          tenantId: context.tenantId,
        })
        .returning();

      return assessment;
    });
  }

  async getById(id: string, context: TenantContext): Promise<UserAssessment | null> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      const [assessment] = await tx
        .select()
        .from(userAssessments)
        .where(and(eq(userAssessments.id, id), eq(userAssessments.tenantId, context.tenantId)))
        .limit(1);

      return assessment || null;
    });
  }

  async findByUser(userId: string, context: TenantContext): Promise<UserAssessment[]> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      return await tx
        .select()
        .from(userAssessments)
        .where(
          and(eq(userAssessments.userId, userId), eq(userAssessments.tenantId, context.tenantId))
        );
    });
  }

  async update(
    id: string,
    data: Partial<UserAssessment>,
    context: TenantContext
  ): Promise<UserAssessment> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      const [updated] = await tx
        .update(userAssessments)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(userAssessments.id, id), eq(userAssessments.tenantId, context.tenantId)))
        .returning();

      return updated;
    });
  }
}
```

## Migration Strategy

### Using Drizzle Kit

```bash
# Generate migration from schema changes
npm run db:generate

# Review generated SQL
cat migrations/0001_add_user_preferences.sql

# Apply migrations to database
npm run db:migrate

# Check migration status
npm run db:check
```

### Example Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop",
    "db:check": "drizzle-kit check"
  }
}
```

### Pre-Deployment Migration

```typescript
// functions/migrations/run.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export const handler = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const db = drizzle(pool);

  try {
    console.log('Starting migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Migrations complete' }),
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};
```

## Testing Data Isolation

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestTenant, createTestUser } from './test-helpers';
import { db, withRLS } from '../lib/database';
import { userAssessments } from '../schema/user-assessments';
import { eq } from 'drizzle-orm';

describe('Multi-tenant data isolation', () => {
  let tenant1: any;
  let tenant2: any;
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    tenant1 = await createTestTenant({ type: 'individual' });
    tenant2 = await createTestTenant({ type: 'individual' });
    user1 = await createTestUser({ tenantId: tenant1.id });
    user2 = await createTestUser({ tenantId: tenant2.id });
  });

  it('prevents cross-tenant data access', async () => {
    // Create assessment for tenant1
    const [assessment1] = await withRLS(tenant1.id, user1.id, async (tx) => {
      return await tx
        .insert(userAssessments)
        .values({
          tenantId: tenant1.id,
          userId: user1.id,
          templateId: 'template-id',
        })
        .returning();
    });

    // Try to query from tenant2 context (should not see tenant1 data)
    const assessments = await withRLS(tenant2.id, user2.id, async (tx) => {
      return await tx.select().from(userAssessments);
    });

    expect(assessments).not.toContainEqual(expect.objectContaining({ id: assessment1.id }));
  });

  it('allows customer sub-users to see shared data', async () => {
    const customerTenant = await createTestTenant({ type: 'customer' });
    const owner = await createTestUser({
      tenantId: customerTenant.id,
      role: 'customer_owner',
    });
    const subUser = await createTestUser({
      tenantId: customerTenant.id,
      role: 'customer_user',
      customerId: owner.id,
    });

    // Owner creates assessment
    const [assessment] = await withRLS(customerTenant.id, owner.id, async (tx) => {
      return await tx
        .insert(userAssessments)
        .values({
          tenantId: customerTenant.id,
          userId: owner.id,
          templateId: 'template-id',
        })
        .returning();
    });

    // Sub-user can see it (same tenant)
    const subUserAssessments = await withRLS(customerTenant.id, subUser.id, async (tx) => {
      return await tx.select().from(userAssessments);
    });

    expect(subUserAssessments).toContainEqual(expect.objectContaining({ id: assessment.id }));
  });

  afterAll(async () => {
    // Cleanup test data
  });
});
```

## Performance Optimization

### Indexes

All foreign keys have indexes defined in schema:

- `tenant_id` indexed on all multi-tenant tables
- `user_id` indexed for user-specific queries
- Composite indexes for common query patterns

### Connection Pooling

- Lambda functions reuse database connections
- Pool size: 10 connections (Lambda optimized)
- Connection timeout: 30 seconds

### Query Optimization

- Use prepared statements for repeated queries
- Add indexes based on query patterns in schema
- Specify columns instead of `SELECT *`
- Use LIMIT for large result sets

### Prepared Statements Example

```typescript
import { sql } from 'drizzle-orm';
import { users } from '@ffp/database/schema';

// Prepare frequently-used query
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('userId')))
  .prepare('get_user_by_id');

// Execute with parameters (more efficient for repeated queries)
const user = await getUserById.execute({ userId: '123' });
```

## Backup & Recovery

### Automated Backups

- Daily snapshots at 3 AM UTC
- 7-day retention (Phase 1)
- Point-in-time recovery within retention window

### Manual Backups

```bash
# Backup before major changes
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup.sql

# Restore if needed
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup.sql
```

## Future Enhancements

### Read Replicas (Phase 2)

- Offload read-heavy queries to replicas
- Reduce load on primary database
- ~$30/month additional cost

### Database Partitioning (Phase 3)

- Partition large tables by tenant_id
- Improve query performance at scale
- Complex migration required

### Connection Pooler (RDS Proxy)

- Reduce Lambda connection overhead
- Better connection management
- ~$15/month additional cost
