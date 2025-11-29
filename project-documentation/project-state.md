# FFP - Project State

**Last Updated**: November 28, 2025
**Current EPIC**: FFP-2 - Assessment Engine (Planning)
**Current Branch**: `planning/ffp-110-assessment-engine`
**Previous EPIC**: FFP-1 - Application Setup & Foundation ✅ COMPLETE

---

## Current Work: Assessment Engine Planning (FFP-110)

**Status**: Phase 0 Complete ✅ | Phases 1-4 Pending
**Plan File**: `~/.claude/plans/mutable-waddling-pretzel.md`

### Phase 0 Decisions (Complete)

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

### Remaining Planning Phases

- **Phase 1**: Research & update assessment-engine.md
- **Phase 2**: Sprint planning user stories
- **Phase 3**: Sub-task breakdown (per category)
- **Phase 4**: Sprint prioritisation (may span 3+ sprints)

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
