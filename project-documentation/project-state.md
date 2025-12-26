# FFP - Project State

**Last Updated**: 24th December 2025
**Current EPIC**: FFP-2 - Assessment Engine (Sprint 3 In Progress)
**Current Story**: FFP-127 - User Assessment Schema & State Machine
**Current Branch**: `feature/ffp-127-assessment-schema-state-machine`
**Previous EPIC**: FFP-1 - Application Setup & Foundation ✅ COMPLETE

---

## Current Work: FFP-127 - User Assessment Schema & State Machine

**Status**: ✅ Complete
**Story Points**: 5
**Sprint**: 3 (Backend Foundation)

### User Story

> As a user,
> I want my assessment instances stored with proper state tracking,
> So that I can resume in-progress assessments and view completed ones.

### Context

User assessments track individual assessment sessions. This schema enables the state machine
for assessment progress through the full lifecycle.

**State Machine**:

```
not_started → in_progress → submitted → scored → completed
                    ↓
               abandoned
```

- `not_started` - Assessment instance created but user hasn't begun
- `in_progress` - User actively answering questions
- `submitted` - User submitted, waiting for scoring job
- `scored` - Scoring complete, waiting for programme generation
- `completed` - Full flow done with programme generated
- `abandoned` - User didn't finish (timeout or explicit abandon)

### Acceptance Criteria

| AC  | Description                     | Status      |
| --- | ------------------------------- | ----------- |
| AC1 | User assessment schema with RLS | ✅ Done     |
| AC2 | Assessment status enum enforced | ✅ Done     |
| AC3 | Answers stored as JSONB         | ✅ Done     |
| AC4 | Repository enforces RLS context | ✅ Done     |
| AC5 | Multi-tenant isolation verified | ⏸️ Deferred |

### Dependencies

- ✅ FFP-124: Assessment Template Schema (completed)
- ✅ FFP-125: Assessment Flow Schema (completed)
- ✅ FFP-132: Process Jobs Schema (completed)

### Blocks (Downstream)

- FFP-128: Start Assessment API
- FFP-133: Scoring Service Implementation

### Implementation Plan

**Branch**: `feature/ffp-127-assessment-schema-state-machine` (single branch for all sub-tasks)

| Order | Key     | Sub-task                                   | Status            |
| ----- | ------- | ------------------------------------------ | ----------------- |
| 1     | FFP-156 | Create Drizzle schema for user_assessments | ✅ Complete       |
| 2     | FFP-159 | Create database migration with RLS policy  | ✅ Complete       |
| 3     | FFP-157 | Create Zod validation schemas              | ✅ Complete       |
| 4     | FFP-158 | Create repository with RLS enforcement     | ✅ Complete       |
| 5     | FFP-160 | Create multi-tenant isolation tests        | ⏸️ Deferred (MVP) |

**FFP-160 Deferral Rationale:** RLS pattern identical to existing tables (16 tests already cover pattern). Repository tests in FFP-158 provide implicit coverage. Add dedicated RLS tests post-MVP if pattern changes.

### Technical Details

**Files to Create**:

| Package       | File                                                                       | Purpose                     |
| ------------- | -------------------------------------------------------------------------- | --------------------------- |
| @ffp/database | `src/constants/user-assessment.constants.ts`                               | Status enum (single source) |
| @ffp/database | `src/schema/user-assessments.ts`                                           | Drizzle table definition    |
| @ffp/database | `migrations/XXXX_user_assessments.sql`                                     | Migration + RLS policy      |
| @ffp/core     | `src/schemas/user-assessment.schema.ts`                                    | Zod validation schemas      |
| @ffp/core     | `src/assessments/user-assessment.repository.ts`                            | Data access with RLS        |
| @ffp/core     | `src/assessments/__tests__/user-assessment.repository.integration.test.ts` | RLS tests                   |

**Table Schema** (`user_assessments`):

| Column       | Type                   | Notes                  |
| ------------ | ---------------------- | ---------------------- |
| id           | uuid (PK)              | Default random         |
| tenant_id    | uuid (FK → tenants)    | NOT NULL, RLS filtered |
| user_id      | uuid (FK → users)      | NOT NULL               |
| flow_id      | uuid (FK → flows)      | NOT NULL               |
| current_step | integer                | Default 1              |
| status       | assessment_status_enum | Default 'not_started'  |
| answers      | jsonb                  | Default {}             |
| scores       | jsonb                  | Nullable               |
| programme_id | uuid (FK → programmes) | Nullable               |
| started_at   | timestamp              | Nullable               |
| submitted_at | timestamp              | Nullable               |
| completed_at | timestamp              | Nullable               |
| created_at   | timestamp              | Default now()          |
| updated_at   | timestamp              | Default now()          |

**RLS Policy**:

```sql
CREATE POLICY user_assessment_tenant_isolation ON user_assessments
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Indexes**:

- `idx_user_assessments_tenant_user` on (tenant_id, user_id)
- `idx_user_assessments_status` on (status)
- `idx_user_assessments_flow` on (flow_id)

---

## Recently Completed: FFP-125 - Assessment Flow Schema & Configuration ✅

**Status**: ✅ Complete (Ready for merge)
**Story Points**: 3
**Sprint**: 3 (Backend Foundation)

### User Story

> As a system administrator,
> I want assessment flows (intro → questions → transition → video → results) stored in the database,
> So that the assessment journey is configurable and extensible.

### Acceptance Criteria

| AC  | Description                              | Status      |
| --- | ---------------------------------------- | ----------- |
| AC1 | Flow schema created with step types      | ✅ Complete |
| AC2 | Flow step types support MVP journey      | ✅ Complete |
| AC3 | Steps link to templates where applicable | ✅ Complete |
| AC4 | Default flow seeded for MVP              | ✅ Complete |

### Sub-tasks

| Order | Key     | Description                                    | Status      |
| ----- | ------- | ---------------------------------------------- | ----------- |
| 1     | FFP-147 | Create Drizzle schema for assessment_flows     | ✅ Complete |
| 2     | FFP-148 | Create Zod schemas for flow steps              | ✅ Complete |
| 3     | FFP-149 | Create seed script for default assessment flow | ✅ Complete |
| 4     | FFP-150 | Add unit tests for flow schema validation      | ✅ Complete |

### Key Implementation Details

- **Schema**: `@ffp/database/src/schema/assessment-flows.ts`
- **Zod Schemas**: `@ffp/core/src/schemas/assessment-flow.schema.ts`
- **Seed Script**: `@ffp/database/seed/seedAssessmentFlows.ts`
- **Unit Tests**: `@ffp/core/src/schemas/assessment-flow.schema.test.ts` (57 tests)
- **No RLS required**: Flows are system-managed content accessible by all authenticated users
- **Step types (MVP)**: `intro`, `questions`, `transition`, `video-assessment`, `results`, `programme-overview`

---

## Recently Completed: FFP-132 - Process Jobs Schema & Queue Infrastructure ✅

**Status**: ✅ Complete (Ready for merge)
**Story Points**: 8
**Sprint**: 3 (Backend Foundation)

### Acceptance Criteria

| AC  | Description                                  | Status                       |
| --- | -------------------------------------------- | ---------------------------- |
| AC1 | Process jobs schema with RLS                 | ✅ Schema done, RLS deferred |
| AC2 | Job status enum enforced                     | ✅ Complete                  |
| AC3 | Enqueue function creates pending job         | ✅ Complete                  |
| AC4 | Polling claims jobs atomically (SKIP LOCKED) | ✅ Complete                  |
| AC5 | Failed jobs retry with exponential backoff   | ✅ Complete                  |
| AC6 | Failed jobs marked after max retries         | ✅ Complete                  |

### Sub-tasks

| Order | Key     | Description                                  | Status      |
| ----- | ------- | -------------------------------------------- | ----------- |
| 1     | FFP-178 | Create Drizzle schema for process_jobs table | ✅ Complete |
| 2     | FFP-179 | Implement job queue service with queueJob    | ✅ Complete |
| 3     | FFP-180 | Implement job processor with atomic claiming | ✅ Complete |
| 4     | FFP-181 | Add retry logic with exponential backoff     | ✅ Complete |
| 5     | FFP-182 | Configure SST infrastructure for job polling | ✅ Complete |

### Technical Notes

- **Schema**: `@ffp/database/src/schema/process-jobs.ts`
- **Queue Service**: `@ffp/core/src/jobs/job-queue.service.ts`
- **Processor**: `@ffp/core/src/jobs/job-processor.service.ts`
- **Lambda Handler**: `@ffp/functions/src/jobs/process-jobs.ts`
- **SST Config**: `sst.config.ts` (JobProcessor Cron)
- **Job Types**: `score_assessment`, `generate_program`
- **Polling Pattern**: Database-driven with `FOR UPDATE SKIP LOCKED`
- **Infrastructure**: EventBridge Cron (1 min) → Lambda → Poll DB

### Key Implementation Details

**Job Status Enum**: `queued`, `processing`, `completed`, `failed`, `cancelled`

**Job Priority**: 1=urgent, 2=high, 3=medium, 4=low (default)

**Atomic Claiming Pattern**:

```sql
SELECT * FROM process_jobs
WHERE status = 'queued'
  AND (retry_after IS NULL OR retry_after <= now())
ORDER BY priority ASC, created_at ASC
FOR UPDATE SKIP LOCKED
LIMIT {maxConcurrent}
```

**Exponential Backoff**: `2^attempts` seconds (2s, 4s, 8s...)

---

## Sprint 3 Progress: Backend Foundation (24 pts)

**Sprint Plan**: `project-documentation/sprint-planning/outputs/assessment-engine-sprint-plan.md`

| Order | Key     | Story                                      | Pts | Status      |
| ----- | ------- | ------------------------------------------ | --- | ----------- |
| 1     | FFP-124 | Assessment Template Schema & Repository    | 5   | ✅ Complete |
| 2     | FFP-132 | Process Jobs Schema & Queue Infrastructure | 8   | ✅ Complete |
| 3     | FFP-125 | Assessment Flow Schema & Configuration     | 3   | ✅ Complete |
| 4     | FFP-127 | User Assessment Schema & State Machine     | 5   | ⏳ Up Next  |
| 5     | FFP-128 | Start Assessment API                       | 3   | Pending     |

**Sprint Goal**: All database schemas migrated, job queue ready, users can start assessments.
**Progress**: 16/24 pts complete (67%)

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)
**Full Sprint Plan**: `project-documentation/sprint-planning/outputs/assessment-engine-sprint-plan.md`

### Key Architecture Decisions

| Area              | Decision                                               |
| ----------------- | ------------------------------------------------------ |
| Template Storage  | Database (PostgreSQL), not S3 JSON                     |
| Job Queue         | Database-driven polling (`process_job` table), not SQS |
| Scoring           | Multi-dimensional (Strength, Balance, Risk Level)      |
| Frontend State    | TanStack Query + React Context                         |
| Conditional Logic | Deferred post-MVP (linear flow only)                   |

### Sprint 4: Backend APIs + Frontend Foundation (25 pts)

| Order | Key     | Story                           | Pts |
| ----- | ------- | ------------------------------- | --- |
| 1     | FFP-129 | Save Assessment Progress API    | 3   |
| 2     | FFP-133 | Scoring Service Implementation  | 8   |
| 3     | FFP-130 | Submit Assessment API           | 5   |
| 4     | FFP-135 | Assessment Context & State Mgmt | 5   |
| 5     | FFP-126 | Assessment Template Admin API   | 5   |

**Goal**: Complete assessment lifecycle APIs, scoring logic implemented, frontend state ready.

#### Sprint 5: Results + Frontend Core (23 pts)

| Order | Key     | Story                                | Pts |
| ----- | ------- | ------------------------------------ | --- |
| 1     | FFP-131 | Get Assessment Results API           | 3   |
| 2     | FFP-134 | Programme Generation Service         | 5   |
| 3     | FFP-136 | TanStack Query Hooks for Assessments | 5   |
| 4     | FFP-139 | Question Renderer Components         | 8   |
| 5     | FFP-138 | Assessment Progress Bar Component    | 2   |

**Goal**: Full backend complete, frontend can render questions.

#### Sprint 6: Frontend Completion (14 pts + buffer)

| Order | Key     | Story                           | Pts |
| ----- | ------- | ------------------------------- | --- |
| 1     | FFP-137 | Assessment Navigation Component | 3   |
| 2     | FFP-140 | Assessment Step Screens         | 5   |
| 3     | FFP-141 | Video Player Component          | 5   |
| 4     | -       | Integration & Polish            | ~5  |

**Goal**: End-to-end assessment flow working, demo-ready MVP.

### Critical Path

```
FFP-124 → FFP-125 → FFP-127 → FFP-128 → FFP-129 → FFP-130 → FFP-131
(Template)  (Flow)   (User)   (Start)   (Save)   (Submit)  (Results)
```

### Parallel Workstreams

1. **Job Queue**: FFP-132 → FFP-133 → FFP-134 (can start Sprint 3)
2. **Frontend**: FFP-135 → FFP-138/139 (can start Sprint 4)

---

## Completed EPIC: FFP-1 - Application Setup & Foundation

**Duration**: Sprint 1 & 2 (20th October - 30th November 2025)
**Status**: ✅ COMPLETE

### Delivered Capabilities

**Infrastructure**:

- SST v3 Ion deployed to dev environment
- Cognito User Pool with JWT authorizer
- S3 + CloudFront for static assets
- API Gateway with domain proxy routing
- Local PostgreSQL with Drizzle ORM and RLS

**Authentication**:

- Admin-only business onboarding (invite-only, no self-registration)
- JWT with custom claims (tenantId, customerId, role)
- Login, refresh token, and invite-user endpoints
- First-time password setup flow

**Web Application**:

- React 18 with Vite, TailwindCSS v4, TypeScript strict mode
- Component library (forms, icons, motion, layout)
- Role-based navigation (SideMenu, MobileMenu)
- Protected routing with RBAC
- AWS Amplify auth integration

**Testing**:

- Vitest with 185 passing tests
- 16 RLS integration tests (critical tenant isolation)
- 8% coverage target achieved
- Test helpers for database RLS testing

**Monorepo**:

- Turborepo with 4 packages (@ffp/web, @ffp/functions, @ffp/core, @ffp/database)
- Domain-organised backend architecture
- Build caching (30-100x faster rebuilds)

### Deferred from EPIC FFP-1

| Item                          | Reason                               | When              |
| ----------------------------- | ------------------------------------ | ----------------- |
| FFP-14: CloudWatch Monitoring | Nice-to-have for MVP                 | Post-MVP          |
| FFP-32: Secrets Manager       | Cognito uses public key verification | When RDS deployed |
| FFP-91: Registration Form     | Admin-only onboarding                | Phase 2           |
| FFP-67-70: Playwright/MSW     | Unit tests sufficient for Phase 1    | Post-MVP          |

---

## Key Architectural Decisions

These decisions apply across all EPICs and should be referenced when implementing new features.

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Entity → Repository → Schema`

- **Handler**: HTTP/Lambda interface only, zero business logic
- **Service**: Business logic orchestration, validates input
- **Entity**: Complex business behaviour (optional)
- **Repository**: Data access with RLS context
- **Schema**: Zod validation schemas

**Request Context Pattern**:

```typescript
// Unified RequestContext combines db + tenant context
interface RequestContext {
  db: DrizzleClient;
  tenantId: string;
  customerId: string;
  userId: string;
  role: UserRole;
}
```

**Admin Operations**: Use privileged database connection (BYPASSRLS permission)

### Frontend Architecture

**React Component Pattern** (Session 49):

```typescript
// All React components use arrow function with explicit FC typing
const Component: React.FC<Props> = ({ prop }) => {
  return <div>{prop}</div>;
};
```

**Schema-First Types** (Session 50):

- Zod schemas are single source of truth for all types
- Types exported via `z.infer<typeof schema>`
- Prevents type/validation drift

**Component Library**:

- Atomic design with domain directories (`form/`, `icons/`, `ui/`, `layout/`, `motion/`)
- Barrel exports for clean imports
- British English prop names (`colour`, `initialise`, `optimise`)
- Dev-only showcases at `/components/*` (excluded from production)

**Bundle Decisions**:

- Framer Motion accepted (~50KB for animation quality)
- 650KB uncompressed (190KB gzipped) acceptable for Phase 1
- Route-level code splitting deferred to post-MVP

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
// CORRECT: Set RLS context in transaction
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});

// WRONG: Direct query without RLS context
await db.query.users.findMany(); // Leaks all tenants!
```

**JWT Claims**:

- `custom:tenantId` - Tenant isolation
- `custom:customerId` - Customer scope
- `custom:role` - RBAC (program_user, customer_admin, system_admin)

**User Role Hierarchy**:

- `program_user` - End users (physiotherapy patients)
- `customer_admin` - Business administrators
- `system_admin` - Platform administrators

### Authentication

- Admin-only business onboarding (no self-registration)
- Three-tier: tenant → customer → users
- Invite-only user creation via admin API
- Super admin bootstrap for initial setup

---

## Working Infrastructure

**Deployed to Dev Environment**:

- ✅ SST v3 Ion infrastructure
- ✅ Cognito User Pool with JWT authorizer
- ✅ S3 + CloudFront CDN
- ✅ API Gateway with domain proxy routing
- ✅ PostgreSQL (local) with RLS policies

**Monorepo Packages**:

- `@ffp/web` - React frontend (Vite + TailwindCSS)
- `@ffp/functions` - Lambda handlers
- `@ffp/core` - Shared business logic & schemas
- `@ffp/database` - Drizzle schemas & migrations

**Quality Gates**:

- TypeScript strict mode (zero errors)
- ESLint + Prettier (zero warnings)
- 541 tests passing (16 RLS integration tests, 57 flow schema tests)
- 8% coverage target

---

## Quick Reference

**Jira Project**: FFP (Fit For Purpose)
**Site**: https://ctregaskis.atlassian.net
**Project Key**: FFP

**Current Sprint**: Sprint 2 Complete → Sprint 3 Ready
**Velocity**: ~25 story points per sprint
**Capacity**: 8 hours/week (solo developer)

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation (Complete)
- 🚀 FFP-2: Assessment Engine (Sprints 3-6, 86 pts)
- ⏳ FFP-3: Programme Generation (Future)
- ⏳ FFP-4: Video Management (Future)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
