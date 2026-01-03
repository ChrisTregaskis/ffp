# FFP - Database Schema Documentation

## Overview

FFP uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation, accessed through Drizzle ORM for type-safe database operations. All tenant-scoped tables enforce RLS policies to prevent cross-tenant data access.

// TODO: When the APP is essentially ready for MVP launch, this document needs to be condensed removing code examples that simply now dulicate what is built. Users or AI Agents, should at this point be referring to the actual implemented code. As such, code examples for files already created can be removed to avoid maintainence burden keeping in sync as well as potentially misleading those that read it here.

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

**⚠️ IMPORTANT: Type Management Pattern**

FFP uses **Zod schemas in @ffp/core as the single source of truth** for all entity types (User, Tenant, Customer, etc.). Database schemas in @ffp/database are manually kept in sync.

**For application code (services, handlers, components):**

```typescript
// ✅ CORRECT: Import types from @ffp/core
import { User, UserRole, Tenant, TenantType, Customer, CustomerStatus } from '@ffp/core';
import { USER_ROLES, TENANT_TYPES, CUSTOMER_STATUS } from '@ffp/core';
```

**For repository/database code only:**

```typescript
// ⚠️ EXCEPTION: Repositories MAY import database schemas for internal use
import { users, customers, tenants } from '@ffp/database/schema';
import { NewUser, User as DbUser } from '@ffp/database/schema/users';

// But even repositories should return types from @ffp/core
import type { User } from '@ffp/core';
```

**Package Structure:**

- **Types**: Import from `@ffp/core` (User, Tenant, Customer, etc.)
- **Database schemas**: Import from `@ffp/database/schema` (users table, etc.)
- **Validation schemas**: Import from `@ffp/core` (createUserSchema, etc.)

**Why this pattern:**

1. **Single source of truth**: Zod schemas in @ffp/core define types once
2. **Runtime validation**: Zod provides validation + TypeScript types
3. **Cross-package consistency**: All packages use same types from @ffp/core
4. **Reduced duplication**: No duplicate type definitions

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
export const setRLSContext = async (tenantId: string, userId?: string) => {
  await db.execute(sql`SET app.tenant_id = ${tenantId}`);
  if (userId) {
    await db.execute(sql`SET app.user_id = ${userId}`);
  }
};

// Transaction wrapper with RLS
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
import { relations } from 'drizzle-orm';
import { users } from './users';
import { templateQuestions } from './template-questions';
import type { ScoringConfig } from '../types';

export const assessmentTemplates = pgTable(
  'assessment_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    // Note: Questions are now in normalised tables (questions + template_questions)
    scoringConfig: jsonb('scoring_config').$type<ScoringConfig>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_assessment_templates_active').on(table.isActive),
    index('idx_assessment_templates_name').on(table.name),
  ]
);

// Relations
export const assessmentTemplatesRelations = relations(assessmentTemplates, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [assessmentTemplates.createdBy],
    references: [users.id],
  }),
  templateQuestions: many(templateQuestions),
}));

// Auto-generated Zod schemas
export const insertAssessmentTemplateSchema = createInsertSchema(assessmentTemplates);
export const selectAssessmentTemplateSchema = createSelectSchema(assessmentTemplates);

// TypeScript types
export type AssessmentTemplateRecord = typeof assessmentTemplates.$inferSelect;
export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;

// No RLS needed (system-managed, not tenant-specific)
```

### Questions Table

```typescript
// schema/questions.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { QUESTION_TYPES, SCORE_DIMENSIONS } from '../constants/question.constants';
import type { QuestionOption, QuestionValidation } from '../types';

// Enums defined from shared constants
export const questionTypeEnum = pgEnum('question_type', [...QUESTION_TYPES]);
export const scoreDimensionEnum = pgEnum('score_dimension', [...SCORE_DIMENSIONS]);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Human-readable identifier (e.g., 'goal-primary', 'pain-level') */
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    /** Type of question determines UI and validation */
    type: questionTypeEnum('type').notNull(),
    /** The question text displayed to users */
    questionText: text('question_text').notNull(),
    /** Optional description or help text */
    description: text('description'),
    /** Answer options for choice-based questions */
    options: jsonb('options').$type<QuestionOption[]>(),
    /** Validation rules for the question */
    validation: jsonb('validation').$type<QuestionValidation>(),
    /** Reference to video for video-response type questions */
    videoId: uuid('video_id'),
    /** Score dimension this question contributes to */
    scoreDimension: scoreDimensionEnum('score_dimension'),
    /** Whether this question is currently active */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_questions_slug').on(table.slug),
    index('idx_questions_type').on(table.type),
    index('idx_questions_is_active').on(table.isActive),
  ]
);

// Auto-generated Zod schemas
export const insertQuestionSchema = createInsertSchema(questions);
export const selectQuestionSchema = createSelectSchema(questions);

// TypeScript types
export type QuestionRecord = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

// No RLS needed (system-managed content)
```

### Template Questions Table (Join Table)

```typescript
// schema/template-questions.ts
import { pgTable, uuid, integer, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { assessmentTemplates } from './assessment-templates';
import { questions } from './questions';
import type { ConfigOverrides } from '../types';

export const templateQuestions = pgTable(
  'template_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Reference to the assessment template */
    templateId: uuid('template_id')
      .notNull()
      .references(() => assessmentTemplates.id, { onDelete: 'cascade' }),
    /** Reference to the question */
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    /** Order in which question appears within the template (1-based) */
    displayOrder: integer('display_order').notNull(),
    /** Template-specific overrides for question text, description, or validation */
    configOverrides: jsonb('config_overrides').$type<ConfigOverrides>(),
  },
  (table) => [
    // Each question can only appear once per template
    uniqueIndex('idx_template_questions_template_question').on(table.templateId, table.questionId),
    // Display order must be unique within a template
    uniqueIndex('idx_template_questions_template_order').on(table.templateId, table.displayOrder),
    // Efficient lookup of all questions for a template
    index('idx_template_questions_template').on(table.templateId),
  ]
);

// Relations
export const templateQuestionsRelations = relations(templateQuestions, ({ one }) => ({
  template: one(assessmentTemplates, {
    fields: [templateQuestions.templateId],
    references: [assessmentTemplates.id],
  }),
  question: one(questions, {
    fields: [templateQuestions.questionId],
    references: [questions.id],
  }),
}));

// Auto-generated Zod schemas
export const insertTemplateQuestionSchema = createInsertSchema(templateQuestions);
export const selectTemplateQuestionSchema = createSelectSchema(templateQuestions);

// TypeScript types
export type TemplateQuestionRecord = typeof templateQuestions.$inferSelect;
export type NewTemplateQuestion = typeof templateQuestions.$inferInsert;

// No RLS needed (system-managed content)
```

### User Assessments Table

```typescript
// schema/user-assessments.ts
import { pgTable, uuid, integer, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { assessmentFlows } from './assessment-flows';
import { userAssessmentAnswers } from './user-assessment-answers';
import { USER_ASSESSMENT_STATUSES } from '../constants/user-assessment.constants';

export const userAssessmentStatusEnum = pgEnum('user_assessment_status', [
  ...USER_ASSESSMENT_STATUSES,
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
    flowId: uuid('flow_id')
      .notNull()
      .references(() => assessmentFlows.id, { onDelete: 'restrict' }),
    /** Current step index in the flow (1-based) */
    currentStep: integer('current_step').notNull().default(1),
    /** Assessment state machine status */
    status: userAssessmentStatusEnum('status').notNull().default('not_started'),
    // Note: Answers are now in normalised user_assessment_answers table
    /** Calculated scores after scoring job completes */
    scores: jsonb('scores'),
    /** Reference to generated programme (nullable until programme generation) */
    programmeId: uuid('programme_id'),
    /** When user started the assessment */
    startedAt: timestamp('started_at'),
    /** When user submitted the assessment */
    submittedAt: timestamp('submitted_at'),
    /** When assessment flow completed */
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_assessments_tenant_user').on(table.tenantId, table.userId),
    index('idx_user_assessments_status').on(table.status),
    index('idx_user_assessments_flow').on(table.flowId),
  ]
);

// Relations
export const userAssessmentsRelations = relations(userAssessments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [userAssessments.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userAssessments.userId],
    references: [users.id],
  }),
  flow: one(assessmentFlows, {
    fields: [userAssessments.flowId],
    references: [assessmentFlows.id],
  }),
  answers: many(userAssessmentAnswers),
}));

// Auto-generated Zod schemas
export const insertUserAssessmentSchema = createInsertSchema(userAssessments);
export const selectUserAssessmentSchema = createSelectSchema(userAssessments);

// TypeScript types
export type UserAssessmentRecord = typeof userAssessments.$inferSelect;
export type NewUserAssessment = typeof userAssessments.$inferInsert;

// RLS enabled via migration (see below)
```

### User Assessment Answers Table

```typescript
// schema/user-assessment-answers.ts
import { pgTable, uuid, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { userAssessments } from './user-assessments';
import { questions } from './questions';
import type { AnswerValue } from '../types';

export const userAssessmentAnswers = pgTable(
  'user_assessment_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Tenant ID for RLS isolation - denormalised from user_assessment */
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    /** Reference to the user assessment this answer belongs to */
    userAssessmentId: uuid('user_assessment_id')
      .notNull()
      .references(() => userAssessments.id, { onDelete: 'cascade' }),
    /** Reference to the question being answered */
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    /** The answer value - flexible JSONB to accommodate all question types */
    answerValue: jsonb('answer_value').$type<AnswerValue>().notNull(),
    /** When this answer was recorded/updated */
    answeredAt: timestamp('answered_at').defaultNow().notNull(),
  },
  (table) => [
    // One answer per question per assessment
    uniqueIndex('idx_user_assessment_answers_assessment_question').on(
      table.userAssessmentId,
      table.questionId
    ),
    // Efficient lookup for RLS policy
    index('idx_user_assessment_answers_tenant').on(table.tenantId),
    // Efficient lookup of all answers for an assessment
    index('idx_user_assessment_answers_assessment').on(table.userAssessmentId),
  ]
);

// Relations
export const userAssessmentAnswersRelations = relations(userAssessmentAnswers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userAssessmentAnswers.tenantId],
    references: [tenants.id],
  }),
  userAssessment: one(userAssessments, {
    fields: [userAssessmentAnswers.userAssessmentId],
    references: [userAssessments.id],
  }),
  question: one(questions, {
    fields: [userAssessmentAnswers.questionId],
    references: [questions.id],
  }),
}));

// Auto-generated Zod schemas
export const insertUserAssessmentAnswerSchema = createInsertSchema(userAssessmentAnswers);
export const selectUserAssessmentAnswerSchema = createSelectSchema(userAssessmentAnswers);

// TypeScript types
export type UserAssessmentAnswerRecord = typeof userAssessmentAnswers.$inferSelect;
export type NewUserAssessmentAnswer = typeof userAssessmentAnswers.$inferInsert;

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
  ALTER TABLE user_assessment_answers ENABLE ROW LEVEL SECURITY;
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

  CREATE POLICY tenant_isolation_answers ON user_assessment_answers
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
export const extractUserContext = (event: APIGatewayEvent): TenantContext => {
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
};
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
      role: 'program_user',
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
