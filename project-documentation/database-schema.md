# FFP - Database Schema Documentation

## Overview

FFP uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation. All tenant-scoped tables enforce RLS policies to prevent cross-tenant data access.

## Why PostgreSQL + RLS

### Benefits

- **Single database**: Cost-effective, simpler operations
- **Strong isolation**: Database-enforced security (not just application-level)
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

## Core Schema

### Tenants Table

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'business')),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_type ON tenants(type);
```

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- Cognito sub
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  cognito_sub VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'system_admin',
    'business_owner',
    'business_admin',
    'business_user',
    'individual_user'
  )),
  parent_business_id UUID REFERENCES users(id) ON DELETE SET NULL,
  profile_image_url TEXT,
  phone VARCHAR(20),
  date_of_birth DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_parent_business_id ON users(parent_business_id)
  WHERE parent_business_id IS NOT NULL;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own tenant's users
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
```

### Assessment Templates Table

```sql
CREATE TABLE assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  questions JSONB NOT NULL,  -- JSON schema defined questions
  scoring_config JSONB NOT NULL,  -- Scoring algorithm configuration
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_templates_active ON assessment_templates(is_active)
  WHERE is_active = true;

-- No RLS needed (system-managed, not tenant-specific)
```

### User Assessments Table

```sql
CREATE TABLE user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',
    'completed',
    'abandoned'
  )),
  answers JSONB DEFAULT '{}',
  score JSONB,  -- Calculated scores
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_assessments_tenant_user ON user_assessments(tenant_id, user_id);
CREATE INDEX idx_user_assessments_status ON user_assessments(status);

-- Enable RLS
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_assessments ON user_assessments
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
```

### Programs Table

```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES user_assessments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN (
    'beginner',
    'intermediate',
    'advanced'
  )),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_programs_tenant_user ON programs(tenant_id, user_id);
CREATE INDEX idx_programs_assessment ON programs(assessment_id);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_programs ON programs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
```

### Program Sessions Table

```sql
CREATE TABLE program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_duration_minutes INTEGER NOT NULL,
  UNIQUE(program_id, session_number)
);

CREATE INDEX idx_program_sessions_tenant_program ON program_sessions(tenant_id, program_id);

-- Enable RLS
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_sessions ON program_sessions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
```

### Session Exercises Table

```sql
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE RESTRICT,
  exercise_order INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  UNIQUE(session_id, exercise_order)
);

CREATE INDEX idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX idx_session_exercises_video ON session_exercises(video_id);

-- No RLS needed (inherits from session via FK)
```

### Videos Table

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  s3_key VARCHAR(500) NOT NULL UNIQUE,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN (
    'beginner',
    'intermediate',
    'advanced'
  )),
  body_parts TEXT[] NOT NULL,  -- ['legs', 'core', 'upper_body']
  equipment TEXT[],  -- ['dumbbells', 'resistance_band', 'none']
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_difficulty ON videos(difficulty_level);
CREATE INDEX idx_videos_body_parts ON videos USING GIN(body_parts);
CREATE INDEX idx_videos_equipment ON videos USING GIN(equipment);
CREATE INDEX idx_videos_active ON videos(is_active) WHERE is_active = true;

-- No RLS needed (system-managed content library)
```

### User Progress Table

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'skipped'
  )),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (
    progress_percentage >= 0 AND progress_percentage <= 100
  ),
  completed_sets INTEGER DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, session_id, video_id)
);

CREATE INDEX idx_user_progress_tenant_user ON user_progress(tenant_id, user_id);
CREATE INDEX idx_user_progress_session ON user_progress(session_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_progress ON user_progress
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
```

### Audit Log Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,  -- 'user.login', 'assessment.complete', etc.
  resource_type VARCHAR(50),  -- 'user', 'assessment', 'program', etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Audit logs viewable by system admins only (special RLS policy)
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
```

## Row-Level Security (RLS) Implementation

### Setting Context Per Request

Every Lambda function must set the tenant context before querying:

```typescript
// lib/database.ts
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10, // Connection pool size
});

export async function setRLSContext(tenantId: string, userId?: string) {
  const client = await pool.connect();
  try {
    await client.query("SET app.tenant_id = $1", [tenantId]);
    if (userId) {
      await client.query("SET app.user_id = $1", [userId]);
    }
    return client;
  } catch (error) {
    client.release();
    throw error;
  }
}

export async function query<T>(
  sql: string,
  params: any[],
  tenantId: string,
  userId?: string
): Promise<T[]> {
  const client = await setRLSContext(tenantId, userId);
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### Usage in Lambda Functions

```typescript
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event
) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const tenantId = claims["custom:tenantId"] as string;
  const userId = claims.sub as string;

  // RLS automatically applied to all queries
  const assessments = await query(
    "SELECT * FROM user_assessments WHERE user_id = $1",
    [userId],
    tenantId,
    userId
  );

  return {
    statusCode: 200,
    body: JSON.stringify(assessments),
  };
};
```

## Migration Strategy

### Using Knex.js

```bash
npm install knex pg
```

```typescript
// knexfile.ts
import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
    },
  },
  production: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
  },
};

export default config;
```

### Example Migration

```typescript
// migrations/20250101000000_create_tenants_and_users.ts
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create tenants table
  await knex.schema.createTable("tenants", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("type", 20).notNullable();
    table.string("name", 255).notNullable();
    table.jsonb("settings").defaultTo("{}");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.check("type IN (?, ?)", ["individual", "business"]);
  });

  // Create users table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary();
    table
      .uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    table.string("email", 255).notNullable().unique();
    table.string("cognito_sub", 255).notNullable().unique();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("role", 50).notNullable();
    table
      .uuid("parent_business_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.text("profile_image_url");
    table.string("phone", 20);
    table.date("date_of_birth");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index("tenant_id");
    table.index("email");
  });

  // Enable RLS
  await knex.raw("ALTER TABLE users ENABLE ROW LEVEL SECURITY");

  // Create RLS policy
  await knex.raw(`
    CREATE POLICY tenant_isolation_users ON users
    FOR ALL 
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("tenants");
}
```

## Testing Data Isolation

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestTenant, createTestUser, query } from "./test-helpers";

describe("Multi-tenant data isolation", () => {
  let tenant1: any;
  let tenant2: any;
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    tenant1 = await createTestTenant({ type: "individual" });
    tenant2 = await createTestTenant({ type: "individual" });
    user1 = await createTestUser({ tenantId: tenant1.id });
    user2 = await createTestUser({ tenantId: tenant2.id });
  });

  it("prevents cross-tenant data access", async () => {
    // Create assessment for tenant1
    const assessment1 = await query(
      "INSERT INTO user_assessments (tenant_id, user_id, template_id) VALUES ($1, $2, $3) RETURNING *",
      [tenant1.id, user1.id, "template-id"],
      tenant1.id
    );

    // Try to query from tenant2 context (should not see tenant1 data)
    const assessments = await query(
      "SELECT * FROM user_assessments",
      [],
      tenant2.id
    );

    expect(assessments).not.toContainEqual(
      expect.objectContaining({ id: assessment1[0].id })
    );
  });

  it("allows business sub-users to see shared data", async () => {
    const businessTenant = await createTestTenant({ type: "business" });
    const owner = await createTestUser({
      tenantId: businessTenant.id,
      role: "business_owner",
    });
    const subUser = await createTestUser({
      tenantId: businessTenant.id,
      role: "business_user",
      parentBusinessId: owner.id,
    });

    // Owner creates assessment
    const assessment = await query(
      "INSERT INTO user_assessments (tenant_id, user_id, template_id) VALUES ($1, $2, $3) RETURNING *",
      [businessTenant.id, owner.id, "template-id"],
      businessTenant.id
    );

    // Sub-user can see it (same tenant)
    const subUserAssessments = await query(
      "SELECT * FROM user_assessments",
      [],
      businessTenant.id
    );

    expect(subUserAssessments).toContainEqual(
      expect.objectContaining({ id: assessment[0].id })
    );
  });

  afterAll(async () => {
    // Cleanup test data
  });
});
```

## Performance Optimization

### Indexes

All foreign keys have indexes for efficient joins:

- `tenant_id` indexed on all multi-tenant tables
- `user_id` indexed for user-specific queries
- Composite indexes for common query patterns

### Connection Pooling

- Lambda functions reuse database connections
- Pool size: 10 connections (Lambda optimized)
- Connection timeout: 30 seconds

### Query Optimization

- Use EXPLAIN ANALYZE for slow queries
- Add indexes based on query patterns
- Avoid SELECT \* (specify columns)
- Use LIMIT for large result sets

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
