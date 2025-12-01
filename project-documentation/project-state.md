# FFP - Project State

**Last Updated**: December 1, 2025
**Current EPIC**: FFP-2 - Assessment Engine (Planning → Sub-tasks)
**Current Branch**: `planning/ffp-110-assessment-engine`
**Previous EPIC**: FFP-1 - Application Setup & Foundation ✅ COMPLETE

---

## Current Work: Assessment Engine Planning (FFP-110)

**Status**: Phase 0-2 Complete ✅ | Phase 3 In Progress
**Plan File**: `~/.claude/plans/mutable-waddling-pretzel.md`

### Planning Progress

| Phase   | Description                    | Status         |
| ------- | ------------------------------ | -------------- |
| Phase 0 | Scope & architecture decisions | ✅ Complete    |
| Phase 1 | Update assessment-engine.md    | ✅ Complete    |
| Phase 2 | User stories in Jira           | ✅ Complete    |
| Phase 3 | Sub-task breakdown (batched)   | 🚀 In Progress |
| Phase 4 | Sprint prioritisation          | ⏳ Pending     |

### Phase 0 Decisions

| Area              | Decision                                               |
| ----------------- | ------------------------------------------------------ |
| Template Storage  | Database (PostgreSQL with RLS), not S3 JSON            |
| Job Queue         | Database-driven polling (`process_job` table), not SQS |
| Execution         | Lambda only (no ECS for MVP)                           |
| Frontend State    | TanStack Query + React Context                         |
| Scoring           | Multi-dimensional (Strength, Balance, Risk Level)      |
| Assessment Access | NOT tenant-restricted for MVP                          |
| Conditional Logic | Deferred post-MVP (linear flow only)                   |
| Admin UI          | Basic CRUD forms (no visual builder)                   |
| Video Hosting     | Self-hosted S3 + CloudFront                            |
| Save Behaviour    | On Continue/Back click only (not debounced)            |
| Velocity          | ~25 story points per sprint                            |

### Phase 2: User Stories Created (18 stories, 86 points)

**Domain 1: Assessment Templates (13 pts)**

| Key     | Summary                                 | Points |
| ------- | --------------------------------------- | ------ |
| FFP-124 | Assessment Template Schema & Repository | 5      |
| FFP-125 | Assessment Flow Schema & Configuration  | 3      |
| FFP-126 | Assessment Template Admin API           | 5      |

**Domain 2: User Assessments (19 pts)**

| Key     | Summary                                | Points |
| ------- | -------------------------------------- | ------ |
| FFP-127 | User Assessment Schema & State Machine | 5      |
| FFP-128 | Start Assessment API                   | 3      |
| FFP-129 | Save Assessment Progress API           | 3      |
| FFP-130 | Submit Assessment API                  | 5      |
| FFP-131 | Get Assessment Results API             | 3      |

**Domain 3: Process Jobs (16 pts)**

| Key     | Summary                                    | Points |
| ------- | ------------------------------------------ | ------ |
| FFP-132 | Process Jobs Schema & Queue Infrastructure | 8      |
| FFP-133 | Scoring Service Implementation             | 8      |

**Domain 4: Programme Generation (5 pts)**

| Key     | Summary                      | Points |
| ------- | ---------------------------- | ------ |
| FFP-134 | Programme Generation Service | 5      |

**Domain 5: Frontend Flow (33 pts)**

| Key     | Summary                               | Points |
| ------- | ------------------------------------- | ------ |
| FFP-135 | Assessment Context & State Management | 5      |
| FFP-136 | TanStack Query Hooks for Assessments  | 5      |
| FFP-137 | Assessment Navigation Component       | 3      |
| FFP-138 | Assessment Progress Bar Component     | 2      |
| FFP-139 | Question Renderer Components          | 8      |
| FFP-140 | Assessment Step Screens               | 5      |
| FFP-141 | Video Player Component                | 5      |

### Phase 3: Sub-task Batches (Pending)

Sub-tasks will be created in batches (max 5-6 per story):

| Batch | Stories                   | Focus Area                   |
| ----- | ------------------------- | ---------------------------- |
| 1     | FFP-124, FFP-125, FFP-126 | Assessment Templates         |
| 2     | FFP-127, FFP-128, FFP-129 | User Assessments (Part 1)    |
| 3     | FFP-130, FFP-131          | User Assessments (Part 2)    |
| 4     | FFP-132, FFP-133          | Process Jobs & Scoring       |
| 5     | FFP-134                   | Programme Generation         |
| 6     | FFP-135, FFP-136, FFP-137 | Frontend State & Navigation  |
| 7     | FFP-138, FFP-139          | Frontend Components (Part 1) |
| 8     | FFP-140, FFP-141          | Frontend Components (Part 2) |

### Capacity Planning

- **Total Points**: 86
- **Velocity**: ~25 pts/sprint
- **Estimated Sprints**: 3-4 (Sprint 3, 4, 5, possibly 6)
- **Suggested Sprint 3 Focus**: Backend foundation (FFP-124 to FFP-132)

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
- 185 tests passing (16 RLS integration tests)
- 8% coverage target

---

## Quick Reference

**Jira Project**: FFP (Fit For Purpose)
**Site**: https://ctregaskis.atlassian.net
**Project Key**: FFP

**Current Sprint**: Sprint 2 (ends 30th Nov 2025)
**Velocity**: ~25 story points per sprint
**Capacity**: 8 hours/week (solo developer)

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation (Complete)
- 🚀 FFP-2: Assessment Engine (Planning)
- ⏳ FFP-3: Programme Generation (Future)
- ⏳ FFP-4: Video Management (Future)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
