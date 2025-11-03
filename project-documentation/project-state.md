# FFP - Project State

**Last Updated**: November 3, 2025 - Session 31
**Current Phase**: Sprint 1 Execution - IN PROGRESS 🚀
**Solo Developer**: Christopher Tregaskis
**Time Remaining in Sprint 1**: ~1 week (ending ~November 9, 2025)

---

## Current Phase: Sprint 1 Execution - IN PROGRESS 🚀

**Current User Story/Stories Branch**: `feature/ffp-9-cognito-auth` (to be created)

### Status

✅ **Complete**: Sprint Planning (all 93 subtasks defined)
✅ **Complete**: FFP-7 - Turborepo Monorepo Setup (8/8 subtasks, 13 hours) 🎉
✅ **Complete**: FFP-8 - SST Infrastructure Foundation (6/6 active subtasks, 17 hours) 🎉
✅ **Complete**: FFP-106/107/108 - Database Package Refactoring (3 hours) 🎉
✅ **Complete**: FFP-10 - PostgreSQL Schema with RLS (9/9 subtasks, 24 hours) 🎉 **MERGED TO MAIN**
✅ **Complete**: FFP-11 - Drizzle ORM Setup (9/9 subtasks, 22 hours) 🎉 **MERGED TO MAIN**
🚀 **IN PROGRESS**: FFP-9 - Cognito Authentication (29-30 hours, 13 subtasks)

### Sprint 1 Progress

**FFP-7: Turborepo Monorepo Setup** ✅ **COMPLETE** (13 hours total)

- ✅ FFP-17: Initialise Turborepo and base configuration (1h)
- ✅ FFP-18: Create package structure (web, functions, core) (2h)
- ✅ FFP-19: Configure workspace dependencies (0.5h)
- ✅ FFP-20: Setup TypeScript paths and configuration (1.5h)
- ✅ FFP-21: Configure shared ESLint and Prettier (2.5h)
- ✅ FFP-22: Configure Turborepo build pipeline and caching (2h)
- ✅ FFP-23: Write tests for monorepo setup (2h)
- ✅ FFP-24: Document monorepo structure and commands (1h)

**Time Tracking:**

- Hours completed: 13/13 (100%) ✅
- Subtasks completed: 8/8 (100%) ✅
- **Status**: COMPLETE! 🎉

**FFP-8: SST Infrastructure Foundation** ✅ **COMPLETE** (17 hours effective)

- ✅ FFP-25: Install SST and initialise project (2h)
- ✅ FFP-26: Configure default VPC for Phase 1 (3h)
- ✅ FFP-27: Create Cognito User Pool with custom attributes (2h)
- ⏸️ FFP-28: Create RDS PostgreSQL database - **DEFERRED to FFP-102**
- ✅ FFP-29: Create S3 buckets and CloudFront CDN (3h)
- ✅ FFP-30: Create API Gateway with JWT authoriser (3h)
- ➡️ FFP-31: CloudWatch monitoring - **MOVED to Production Readiness**
- ➡️ FFP-32: Secrets Manager - **MOVED to FFP-9**
- ➡️ FFP-33: Environment settings - **MOVED to Staging Readiness**
- ✅ FFP-34: Deploy and test infrastructure (4h)

**Time Tracking:**

- Hours completed: 17/27 (63% of budget) ✅
- Active subtasks completed: 6/6 (100%) ✅
- Deferred/moved: 4 subtasks to appropriate future stories
- **Status**: COMPLETE! 🎉

**FFP-106/107/108: Database Package Refactoring** ✅ **COMPLETE** (3 hours total)

- ✅ FFP-106: Parent story - Refactor Database Layer to Monorepo Package
- ✅ FFP-107: File Migration & Verification (2h)
  - Created `packages/database/` structure
  - Migrated all schema files, migrations, and drizzle config
  - Updated Turborepo configuration
  - Fixed TypeScript error in customers.ts
  - Verified: install, build, typecheck, db commands
- ✅ FFP-108: Documentation & Cleanup (1h)
  - Updated architecture.md, database-schema.md, README.md
  - Updated local-database-setup.md, CLAUDE.md
  - Created packages/database/README.md
  - Removed old root directories (schema/, migrations/)

**Time Tracking:**

- Hours completed: 3/3 (100%) ✅
- Subtasks completed: 2/2 (100%) ✅
- **Status**: COMPLETE! 🎉

**Key Achievements:**

- ✅ Monorepo best practices - Database now proper workspace package
- ✅ Clean dependency graph - Explicit dependencies via @ffp/database
- ✅ Turborepo integration - Database builds cached and optimised
- ✅ Better organisation - All database code in one location
- ✅ Future-ready - Structure supports RLS utilities and connection pooling
- ✅ Import paths - Clean imports: `import { users } from '@ffp/database/schema'`

**FFP-9: Cognito Authentication** 🚀 **IN PROGRESS** (29-30 hours total, revised from 34h)

**Phase 1: Prerequisites (9.5h)**

- ✅ FFP-43: Error Handling Classes (3.5h) - **COMPLETE** ✅
- ⏸️ FFP-44: Structured Logging (2h) - NOT STARTED ← **NEXT**
- ⏸️ FFP-36: Tenant Context Extraction (2h) - NOT STARTED
- ⏸️ FFP-32: Secrets Manager - JWT Only (2.5h) - NOT STARTED

**Phase 2: Bootstrap + Core Auth (8.5h)**

- ⏸️ Manual: Super User Setup (0.5h) - **NEW PREREQUISITE** - NOT STARTED
- ⏸️ FFP-112: Admin CLI Script (1h) - **NEEDS MANUAL CREATION IN JIRA** (spec ready)
- ✅ FFP-35: Zod Schemas (3h) - **COMPLETE** - Domain-organised schemas created ✅
- ⏸️ FFP-37: Invite User Lambda (4h) - **UPDATED** for super_admin role ✅

**Phase 3: Authentication Endpoints (7h)**

- ⏸️ FFP-38: Login Lambda (3h) - NOT STARTED
- ⏸️ FFP-39: Refresh Token Lambda (2h) - NOT STARTED
- ⏸️ FFP-40: API Gateway Routes (2h) - NOT STARTED

**Phase 4: Testing (12h - can defer FFP-42/45)**

- ⏸️ FFP-41: Unit Tests (4h) - NOT STARTED
- ⏸️ FFP-42: Integration Tests (5h) - DEFERRABLE
- ⏸️ FFP-45: Deployed Environment Tests (3h) - DEFERRABLE

**Phase 5: Documentation (2h)**

- ⏸️ FFP-46: API Documentation (2h) - NOT STARTED

**Time Tracking:**

- Hours completed: 6.5/29-30 (22%)
- Subtasks completed: 2/13 (15%)
- **Status**: Phase 1 in progress - FFP-35 ✅, FFP-43 ✅, FFP-44 next

**Manual Actions Required Before Implementation:**

1. ⚠️ Create FFP-112 in Jira UI (spec file: `FFP-112-JIRA-TICKET.md`)
2. ⚠️ Review super_admin enhancements in FFP-35 and FFP-37

**Ticket Updates Complete:**

- ✅ FFP-35: Updated with super_admin role support (optional tenantId/customerId fields)
- ✅ FFP-37: Updated with dual role support (customer_owner OR super_admin)

**Key Decisions:**

- ✅ Admin-only business onboarding for MVP (no self-registration)
- ✅ Three-tier architecture: tenant → customer → users
- ✅ JWT claims: tenantId, customerId, role
- ✅ Manual business setup via CLI script (FFP-112)
- ✅ Invite-only user creation (FFP-37)
- ✅ Super admin bootstrap prerequisite (one-time manual script)
- ✅ Super admin role expansion for /invite-user endpoint (dual role support)

**Super Admin Authentication Flow:**

1. Bootstrap super admin user (manual script, run once)
2. Super admin authenticates via `/auth/login`
3. Super admin can:
   - Create businesses via FFP-112 CLI (authenticated)
   - Invite users to ANY tenant/customer via `/auth/invite-user`
4. Customer owners can:
   - Invite users to THEIR OWN tenant/customer via `/auth/invite-user`

### Focus Areas

- ✅ Jira ticket standards (Epic, Story, Task, Sub-task, Bug) - Modular & token-optimised
- ✅ Created all 6 Epics in Jira with full descriptions and realistic timeline
- ✅ Created 10 User Stories for Sprint 1 (FFP-7 to FFP-16) with comprehensive details
- ✅ Created all Subtasks for Sprint 1 stories (93 subtasks across 9 stories)
- ✅ **FFP-7 COMPLETE** - Turborepo monorepo fully set up and documented! 🎉
- ✅ **FFP-8 COMPLETE** - SST Infrastructure Foundation deployed and verified! 🎉
- ✅ **FFP-106/107/108 COMPLETE** - Database layer refactored to monorepo package! 🎉
- ✅ **First code written!** - Turborepo monorepo initialised and functional
- ✅ **Infrastructure deployed** - Cognito, S3, CloudFront, API Gateway operational
- ✅ **Path aliases configured** - Clean imports with @ffp/\* and namespace aliases
- ✅ **ESLint & Prettier configured** - Shared configs, strict rules, import order
- ✅ **Comprehensive test suite** - 70+ tests covering all monorepo aspects
- ✅ **Production-ready documentation** - 1000+ lines across 4 README files
- ✅ **Database package structure** - @ffp/database ready for RLS utilities
- ✅ **Phase 3 RLS Implementation** - Multi-tenant isolation with Row-Level Security policies (FFP-49, FFP-50, FFP-52)
- ✅ **Database Layer COMPLETE & MERGED** - FFP-10 & FFP-11 fully implemented (46h, 16 subtasks)
- ✅ **Architecture Enhancements** - Domain-organised backend with Actor-based context (User/System actors)
- 🔄 **Executing Sprint 1** - FFP-9 Cognito Authentication (30-30.5h, 13 subtasks)
- ⏸️ Create User Stories for EPICs 2-6 (after EPIC 1 complete)

### Sprint Planning Approach

**Structured conversation flow:**

1. ✅ **Chat 1**: Define ticket standards (COMPLETE)
2. ✅ **Chat 2**: Create all 6 Epics in Jira (COMPLETE)
3. ✅ **Chat E1**: Create User Stories for Sprint 1 (COMPLETE)
4. ✅ **Chat S1-S9**: Create Subtasks for Sprint 1 stories (COMPLETE)
5. ✅ **Sprint 1 Execution!** - FFP-7, FFP-8, FFP-106/107/108, Phase 3 RLS COMPLETE (53.5/201h, 27%) 🎉
6. ⏸️ **Chat E2-E6**: Create User Stories for Sprints 2-6 (after Sprint 1)

---

## Phase Instructions

### Prototype Phase ✅ COMPLETE

- All core flows prototyped in Figma
- No code implementation required

### Planning Phase ✅ COMPLETE

- Architecture decisions finalised
- ERDs and schemas defined
- Patterns and standards established
- Tech stack confirmed (React, TypeScript, SST, PostgreSQL, Cognito, Drizzle, Turborepo)
- Testing strategy documented (hybrid approach: mocked DB + real RLS tests)

### Sprint Planning Phase ✅ COMPLETE

**What was done:**

- ✅ Defined Jira ticket structure and standards
- ✅ Created all 6 Epics in Jira
- ✅ Created 10 User Stories for Epic 1
- ✅ Created 93 Subtasks for 9 Epic 1 stories
- ✅ Generated comprehensive sprint planning documentation
- ✅ Established realistic timeline: 198 hours (~24.8 weeks at 8h/week)

### Implementation Phase 🔄 IN PROGRESS

**Sprint 1 Started: October 20, 2025**

**Completed Work (FFP-7):**

- ✅ FFP-17: Turborepo initialised with pnpm workspaces
- ✅ FFP-18: Package structure created (web, functions, core)
- ✅ FFP-19: Workspace dependencies configured (@ffp/core imports working)
- ✅ FFP-20: TypeScript paths and internal aliases configured
- ✅ FFP-21: ESLint and Prettier shared configs (strict rules, import order)
- ✅ FFP-22: Turborepo caching optimised (30-100x speed improvement)
- ✅ FFP-23: Comprehensive test suite (70+ tests, all passing)
- ✅ FFP-24: Production-ready documentation (1000+ lines)
- ✅ Root TypeScript configuration with strict mode
- ✅ Namespace-based path aliases (`@web/`, `@core/`, `@functions/`) for conflict-free imports
- ✅ Fixed missing project reference (web → core)
- ✅ Vite configuration updated with alias support
- ✅ Turborepo pipeline with intelligent caching and dependency tracking
- ✅ Structure aligned with architecture.md
- ✅ All tests passing (build, typecheck, lint, dev server)
- ✅ VS Code ESLint integration with auto-fix on save
- ✅ Dual TypeScript projects for web (app + build tools)
- ✅ Cache invalidation working correctly
- ✅ Remote caching prepared for team usage

**Next Up: FFP-9 Cognito Authentication** 🚀

**Architecture Enhancements (Pre-Implementation):**

- ✅ Domain-organised backend architecture documented (Handler → Service → Entity → Repository → Schema)
- ✅ Actor-based context architecture (User vs System actors)
- ✅ Enhanced TenantContext with actor, requestId, timestamp, settings, enabledModules
- ✅ Decision tree for layer requirements
- ✅ Implementation guide created (FFP-9-implementation-guide.md)
- ✅ Jira tickets updated with enhanced patterns (FFP-43, FFP-44, FFP-36)

**Execution Order (5 Phases):**

**Phase 1: Prerequisites (10h)** _(+0.5h for Cognito service wrapper)_

1. FFP-43 - Error Handling Classes + Cognito Service Wrapper (3.5h) ⚠️ _UPDATED: +0.5h_
2. FFP-44 - Structured Logging with Actor Support (2h) ⚠️ _UPDATED: Actor-aware logging_
3. FFP-36 - Enhanced Tenant Context Extraction (2h) ⚠️ _UPDATED: User/System actors_
4. FFP-32 - Secrets Manager - JWT Only (2.5h)

**Phase 2: Bootstrap + Core Auth (8.5h)** 5. Manual: Super User Setup - Bootstrap super admin (0.5h) ⚠️ **NEW** 6. FFP-112 - Admin CLI Script (1h) ⚠️ **NEEDS MANUAL JIRA CREATION** 7. FFP-35 - Zod Schemas (3h) ⚠️ **UPDATE: Add super_admin role support** 8. FFP-37 - Invite User Lambda (4h) ⚠️ **UPDATE: Allow super_admin role**

**Phase 3: Authentication Endpoints (7h)** 9. FFP-38 - Login Lambda (3h) 10. FFP-39 - Refresh Token Lambda (2h) 11. FFP-40 - API Gateway Routes (2h)

**Phase 4: Testing (12h - can defer FFP-42/45)** 12. FFP-41 - Unit Tests (4h) 13. FFP-42 - Integration Tests (5h) - deferrable 14. FFP-45 - Deployed Environment Tests (3h) - deferrable

**Phase 5: Documentation (2h)** 15. FFP-46 - API Documentation (2h)

**Critical Prerequisites Identified:**

- ⚠️ Super admin bootstrap script needed before FFP-112 can authenticate
- ⚠️ FFP-35 (Zod schemas) needs update for super_admin role in InviteUserSchema
- ⚠️ FFP-37 (Invite User) needs role expansion to allow super_admin
- ⚠️ FFP-112 needs manual creation in Jira (MCP tool failed)

**Time Estimate:** 30-30.5 hours (revised from 34h due to admin-only MVP + 0.5h for Cognito service wrapper)

---

## Initial Sprints: Application Setup Details

### Complete Breakdown

**Total**: 10 stories, 93 subtasks, 198 hours (~24.8 weeks at 8h/week, ~6.2 months)

| Story       | Title                           | Subtasks | Hours    | Status                |
| ----------- | ------------------------------- | -------- | -------- | --------------------- |
| FFP-7       | Turborepo Monorepo Setup        | 8        | 13h      | ✅ COMPLETE           |
| FFP-8       | SST Infrastructure Foundation   | 6        | 17h      | ✅ COMPLETE           |
| FFP-106     | Database Package Refactoring    | 2        | 3h       | ✅ COMPLETE           |
| ↳ FFP-107   | File Migration & Verification   | -        | 2h       | ✅ COMPLETE           |
| ↳ FFP-108   | Documentation & Cleanup         | -        | 1h       | ✅ COMPLETE           |
| FFP-10 + 11 | Database Layer (Interleaved)    | 16       | 46h      | ✅ COMPLETE & MERGED  |
| ↳ FFP-10    | PostgreSQL Schema with RLS      | 9        | 24h      | ✅ COMPLETE & MERGED  |
| ↳ FFP-11    | Drizzle ORM Setup               | 9        | 22h      | ✅ COMPLETE & MERGED  |
| FFP-9       | Cognito Authentication          | 13       | 30-30.5h | 🚀 IN PROGRESS (2/13) |
| FFP-12      | Testing Framework Configuration | 10       | 22h      | ⏸️ Not Started        |
| FFP-14      | CloudWatch Logging              | 7        | 14h      | ⏸️ Not Started        |
| FFP-15      | Error Handling Patterns         | 7        | 15h      | ⏸️ Not Started        |
| FFP-16      | Web Login/Logout Flow           | 11       | 27h      | ⏸️ Not Started        |
| **Total**   |                                 | **96**   | **197h** | **108.5/197h (55%)**  |

**Note**: FFP-13 (CI/CD Pipeline) was intentionally skipped for now - can be added later if needed.

### Implementation Sprints

**Sprint 1: Foundation (Weeks 1-5, ~40 hours)** ✅ COMPLETE

- ✅ FFP-17 through FFP-24: Turborepo setup (13h) - COMPLETE 🎉
- ✅ FFP-25 through FFP-34: SST infrastructure (17h effective) - COMPLETE 🎉
  - ✅ FFP-25 & FFP-26: SST & VPC setup (5h)
  - ✅ FFP-27: Cognito User Pool (2h)
  - ✅ FFP-29: S3 + CloudFront (3h)
  - ✅ FFP-30: API Gateway + JWT authoriser (3h)
  - ✅ FFP-34: Deploy and test infrastructure (4h)
  - ⏸️ FFP-28: RDS PostgreSQL - DEFERRED to FFP-102
  - ➡️ FFP-31, FFP-32, FFP-33: MOVED to appropriate future stories
- ✅ Checkpoint: Infrastructure deployed and tested (6/6 active subtasks complete)

**Sprint 1.5: Database Foundation (Weeks 6-7, ~14 hours)** ✅ COMPLETE

- ✅ Phase 1: Drizzle Foundation (FFP-56, FFP-57) - 6h COMPLETE
- ✅ Phase 2: Schema Definition (FFP-58+47, FFP-59+48, FFP-60) - 8h COMPLETE
- ✅ Major architectural refinement: Introduced customers table
- ✅ Checkpoint: Drizzle configured, schemas defined, migrations working

**Sprint 1.6: Database Package Refactoring (Week 8, ~3 hours)** 🎯 NEXT

- FFP-106/107/108: Database package refactoring (3h)
  - FFP-107: File migration and verification (2h)
  - FFP-108: Documentation updates and cleanup (1h)
- ✅ Checkpoint: Database layer in proper monorepo package structure

**Sprint 2: Database Layer Continued (Weeks 8-11, ~46 hours)** ⬅️ INTERLEAVED EXECUTION - ✅ **COMPLETE & MERGED!** 🎉

- ✅ FFP-10 + FFP-11: Database layer with interleaved subtasks (46h COMPLETE)
  - ✅ Phase 1: Drizzle foundation (FFP-56, FFP-57) - 6h COMPLETE
  - ✅ Phase 2: Schema definition (FFP-58+47, FFP-59+48, FFP-60) - 8h COMPLETE (+ customers table redesign)
  - ✅ Phase 2.5: Ticket refinement (FFP-51 marked Done, FFP-49/53/54/55 updated) - 0h (planning)
  - ✅ Phase 2.6: Database package refactoring (FFP-106/107/108) - 3h COMPLETE
  - ✅ Phase 3: RLS implementation (FFP-49, FFP-50, FFP-52) - 6.5h COMPLETE
  - ✅ Phase 4: Connection layer (FFP-61) - 3h COMPLETE
  - ✅ Phase 5: RLS Testing (FFP-53, FFP-54) - 7h COMPLETE
  - ✅ Phase 5: Drizzle Testing (FFP-62, FFP-63) - 4h COMPLETE
  - ✅ Phase 6: Documentation (FFP-55, FFP-64) - 7h COMPLETE
- ✅ Checkpoint: Type-safe queries with RLS working, cross-tenant isolation verified, documentation complete, **MERGED TO MAIN!**

**Sprint 3: Authentication (Weeks 12-13, ~29-30 hours)** 🚀 **IN PROGRESS**

- FFP-9: Cognito authentication (29-30h, revised from 34h) ← **STARTED**
  - 13 subtasks: FFP-35, 32, 43, 44, 36, 37, 112, 38, 39, 40, 41, 42, 45, 46
  - Admin-only business onboarding MVP (no self-registration)
  - Super admin bootstrap + role expansion for invite endpoint
  - Time remaining in Sprint 1: ~1 week
- ✅ Checkpoint: Users can authenticate and be invited (database layer complete ✅)

**Sprint 4: Testing & Infrastructure (Weeks 16-22, ~51 hours)**

- FFP-65 through FFP-75: Testing frameworks (22h)
- FFP-76 through FFP-82: CloudWatch logging (14h)
- FFP-83 through FFP-89: Error handling (15h)
- ✅ Checkpoint: Testing, logging, and error handling complete

**Sprint 5: Web Authentication (Weeks 23-25, ~27 hours)**

- FFP-93 through FFP-100: Web login/logout flow (27h)
- ✅ Checkpoint: Web authentication working end-to-end

### Critical Success Criteria

- 🔄 All 93 subtasks (currently 105/201h done - 52%) - **OVER HALF WAY!** 🎉
- ✅ RLS integration tests pass (cross-tenant isolation verified)
- ✅ JWT contains tenantId, role, customerId (Cognito configured with custom attributes)
- ⏸️ E2E authentication tests pass (FFP-99 - CRITICAL)
- ✅ All TypeScript strict mode, no errors
- 🔄 Test coverage tracking (68 database tests, monorepo tests complete)
- ✅ Infrastructure deployed to dev environment (Cognito, S3, CloudFront, API Gateway, smoke tests passing)
- ✅ Database schemas defined and **MERGED TO MAIN** (tenants, customers, users with Drizzle ORM)
- ✅ Migration system established with verification tooling
- ✅ Documentation updated (FFP-7, FFP-8, FFP-10, FFP-11 docs complete + progress tracking current)
- ✅ RLS policies and utilities fully documented
- ✅ Database layer production-ready (all phases complete, merged to main)

---

## Jira Project Details

### Current FFP Project

- **Site**: `https://ctregaskis.atlassian.net`
- **Project Key**: `FFP` ✅
- **Project Name**: `Fit For Purpose`
- **Project ID**: `10033`
- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`

### Issue Types Available

- Epic (10011)
- Story (10010)
- Task (10008)
- Subtask (10012)
- Bug (10009)

### Current Issues

**Epics (FFP-1 to FFP-6)**:

- FFP-1: Application Setup & Foundation ⬅️ Sprint 1-6 (IN PROGRESS)
- FFP-2: Assessment Engine Core
- FFP-3: Video Management & Streaming
- FFP-4: User Dashboards & Progress Tracking
- FFP-5: Business Portal
- FFP-6: Company Management Portal

**Sprint 1-6 Stories (FFP-7 to FFP-16)**:

- ✅ FFP-7: Turborepo Monorepo Setup (COMPLETE & MERGED - 8/8 subtasks, 13h) 🎉
- ✅ FFP-8: SST Infrastructure Foundation (COMPLETE & MERGED - 6/6 active subtasks, 17h) 🎉
- ✅ FFP-106/107/108: Database Package Refactoring (COMPLETE & MERGED - 2/2 subtasks, 3h) 🎉
- ✅ FFP-10: PostgreSQL Schema with RLS (COMPLETE & MERGED - 9/9 subtasks, 24h) 🎉
- ✅ FFP-11: Drizzle ORM Setup (COMPLETE & MERGED - 9/9 subtasks, 22h) 🎉
- **Interleaved Execution**: FFP-10 + FFP-11 = 16 unique subtasks, 46h total - **ALL PHASES COMPLETE & MERGED!** ✅
- 🎯 FFP-9: Cognito Authentication (NEXT - 12 subtasks, 34h)
- ⏸️ FFP-12, FFP-14, FFP-15, FFP-16: Not started
- **Total Progress**: 108.5/201 hours (54%) - **OVER HALFWAY!** 🎉
- **Current**: FFP-9 Cognito Authentication ← **IN PROGRESS** (2/13 subtasks complete: FFP-35 ✅, FFP-43 ✅)

---

## Key Decisions Made

### Documentation & Token Optimisation

1. **Modular Jira standards** - 65-88% token reduction per chat
2. **Custom instructions** - Embedded file ignore list in Project settings
3. **project-state.md always loaded** - Current phase context
4. **Domain docs on-demand** - Load only when query needs them
5. **Meta-docs excluded** - Workflow guides, prompts not in Claude Knowledge
6. **Progress log separated** - Detailed history in progress-log.md

### Sprint Planning

1. **Direct Jira integration** - Create issues via API, not markdown files
2. **Incremental detail** - High-level first, add details as needed
3. **Token-conscious** - Load only necessary standards per chat type
4. **Project migration** - Moved from SCRUM to FFP keys for consistency
5. **Realistic estimates** - 198 hours for Sprint 1 - 6 (not 50 story points = 50 hours)

### Epic 1 Specific (Sprint 1 - 6)

1. **Skipped FFP-13** (CI/CD) - Can add later, focus on core foundation first
2. **E2E tests critical** - FFP-99 must pass before Epic 1 complete
3. **RLS testing mandatory** - Cross-tenant isolation verified via integration tests
4. **Documentation as you go** - Update docs per subtask, not at end
5. **Interleaved database layer** - FFP-10 and FFP-11 executed together due to overlapping schema tasks
6. **Local PostgreSQL first** - RDS deployment deferred to FFP-102, use local DB for development

### Implementation Decisions

1. **Package naming**: `functions` not `api` per architecture.md
2. **No database package**: Schemas/migrations at root level (added in FFP-10)
3. **Workspace protocol**: Using `workspace:*` for internal dependencies
4. **Build order**: Core → Functions/Web (enforced by Turborepo)
5. **TypeScript strict mode**: Enabled across all packages from day 1
6. **Path aliases strategy**: TypeScript points to `dist`, Vite points to `src` for HMR
7. **Namespace aliases**: `@web/`, `@core/`, `@functions/` for intra-package imports, `@ffp/` for cross-package
8. **Comprehensive documentation**: 1000+ lines across 4 README files with troubleshooting

---

## Quick Context

- **MVP Goal**: Ship functional product as solo developer
- **Users**: Individual users + Business accounts (sub-users) + Company admin
- **Core Value**: Dynamic assessments → Personalised programmes → Video workouts
- **Critical**: Multi-tenant isolation, healthcare security, OWASP compliance
- **Timeline**: Sprint 1 - 6 = 24.8 weeks at 8 hours/week (~6.2 months)
- **Capacity**: 8 hours/week minimum (full-time job + family commitments)
- **Started**: October 20, 2025

---

## Progress Summary

**Recent Work** (Nov 3, 2025 - Session 31):

- 🎉 **FFP-43 COMPLETE!** Error Handling Classes and Middleware (3.5h)
- ✅ **Custom error hierarchy**: 7 error types with HTTP status codes (BaseError, UnauthorisedError, ForbiddenError, NotFoundError, ValidationError, ConflictError, InternalServerError)
- ✅ **Lambda middleware**: withErrorHandling() wrapper with automatic error-to-HTTP conversion
- ✅ **Cognito service wrapper**: CognitoService with inviteUser, createUser, login, refreshToken methods
- ✅ **Sensitive data sanitisation**: Passwords, tokens, auth headers redacted from logs
- ✅ **55 new tests passing**: Comprehensive error handling coverage (17 + 18 + 20)
- ✅ **Code quality**: Fixed 37 ESLint violations, no `any` types
- ✅ **British English**: UnauthorisedError (not UnauthorizedError)
- ✅ **System admin support**: PLATFORM_TENANT_ID constant and documentation
- 📝 **Review context created**: Comprehensive PR review documentation
- ⏱️ **FFP-9 Progress**: 2/13 subtasks (15%), 6.5/30 hours (22%)
- 🎯 **Next**: FFP-44 Structured Logging (2h)

**Previous Work** (Nov 3, 2025 - Session 30):

- 🎉 **FFP-35 COMPLETE!** Zod Validation Schemas for Auth (3h)
- ✅ **Domain-organised schemas**: Created users/ and auth/ domains
- ✅ **inviteUserSchema**: Super admin support with custom refinement
- ✅ **loginSchema & refreshTokenSchema**: Authentication validation
- ✅ **passwordValidation**: Cognito requirements helper
- ✅ **34 tests passing**: Comprehensive validation coverage
- ✅ **British English**: All error messages use correct spelling
- ✅ **Types exported**: InviteUserInput, LoginInput, RefreshTokenInput

**Previous Work** (Nov 2, 2025 - Session 29):

- ✅ **Backend Architecture Enhancements** - Domain-organised layers documented
- ✅ **Actor-Based Context Architecture** - UserActor and SystemActor interfaces designed
- ✅ **Enhanced TenantContext** - Actor, requestId, timestamp, settings support
- ✅ **FFP-9 Implementation Guide** - Comprehensive task breakdown with layer requirements
- ✅ **Jira Ticket Updates** - Enhanced FFP-43, FFP-44, FFP-36 with new patterns
- 📋 **Planning Session**: ~2 hours architecture design and documentation

**Previous Work** (Nov 1, 2025 - Session 28):

- 🎉 **FFP-10 & FFP-11 MERGED TO MAIN!** Database Layer Complete (46h total)
- ✅ **All 16 unique subtasks merged**: Schema, RLS, connection pooling, testing, documentation
- ✅ **68 comprehensive tests**: Unit, integration, and RLS validation all passing
- ✅ **Production-ready database layer**: @ffp/database package with full multi-tenant isolation
- ✅ **Connection pooling**: Lambda-optimised with singleton pattern (FFP-61 complete)
- ✅ **Architectural refinement**: Three-tier architecture (tenant → customer → users)

**Previous Work** (Oct 30, 2025 - Session 26):

- 🎉 **FFP-10 COMPLETE!** PostgreSQL Schema with RLS (9/9 subtasks, 24h) 🎉
- ✅ **Phase 5 & 6 COMPLETE**: Testing and documentation finished (14h)
- ✅ **FFP-53**: Cross-tenant isolation tests (already existed in rls.test.ts - 16 tests passing)
- ✅ **FFP-54**: RLS context application tests (already existed in rls.test.ts)
- ✅ **FFP-55**: RLS documentation complete across multiple files
- ✅ **FFP-64**: Drizzle usage guide complete in packages/database/README.md
- ✅ **Verified existing work**: Comprehensive RLS tests already implemented
- ✅ **Documentation audit**: All RLS patterns documented in project files and CLAUDE.md
- 🎯 **Next**: FFP-61 (Connection pooling - 4.5h remaining)

**Previous Work** (Oct 30, 2025 - Session 25):

- 🎉 **Phase 3: RLS Implementation COMPLETE!** (FFP-49, FFP-50, FFP-52 - 6.5h)
- ✅ **Row-Level Security policies**: Implemented for tenants, customers, users tables
- ✅ **Custom migration runner**: Orchestrates Drizzle migrations + RLS policy application
- ✅ **setRLSContext utility**: Type-safe RLS context management with validation
- ✅ **Comprehensive RLS tests**: 16 tests covering policy enforcement and tenant isolation
- ✅ **Terminal logger utility**: Professional colored output across all scripts (bash + TypeScript)
- ✅ **Documentation updates**: local-database-setup.md enhanced with permission requirements

**Previous Work** (Oct 27, 2025 - Session 22):

- 🎉 **Database Layer Phases 1 & 2 COMPLETE!** Foundation and schema definition finished (14/46h, 30%)
- ✅ **Drizzle ORM configured**: Local PostgreSQL setup, environment-specific SSL
- ✅ **Schema definitions complete**: tenants, customers (NEW!), users tables with Drizzle
- ✅ **Major architectural refinement**: Introduced customers table (tenant → customer → users)
- ✅ **Migration system established**: Generation, verification, clean migration strategy
- ✅ **All dependencies updated**: SST config, types, constants, seed data
- ✅ **Documentation updated**: architecture.md, database-schema.md, deployment.md, progress logs

**Database Layer Phase 1 & 2 Summary:**

- ✅ FFP-56: Drizzle packages installed (drizzle-orm, drizzle-kit, pg, drizzle-zod)
- ✅ FFP-57: drizzle.config.ts created with environment-specific configuration
- ✅ FFP-58 + FFP-47: Tenants table schema (Drizzle definition + migration)
- ✅ FFP-59 + FFP-48: Users table schema + customers table redesign
- ✅ FFP-60: Migration system finalized (verification script, workflow documented)
- ✅ Local PostgreSQL setup and tested
- ✅ Clean migration generated: tenants, customers, users with indexes and foreign keys
- ✅ Verification script working (checks tables, enums, indexes, FKs, RLS policies)

**What's Working:**

**Monorepo & Development:**

- ✅ Turborepo with pnpm workspaces
- ✅ 3 core packages (web, functions, core)
- ✅ Workspace dependencies (@ffp/core imports)
- ✅ Path aliases (TypeScript + Vite)
- ✅ Shared ESLint + Prettier configs
- ✅ Optimised caching (30-100x speed)
- ✅ Comprehensive test suite (70+ tests)
- ✅ Production-ready documentation (1000+ lines)
- ✅ VS Code integration
- ✅ Git hooks with Husky
- ✅ TypeScript strict mode

**AWS Infrastructure (Deployed to eu-west-2):**

- ✅ SST v3 Ion configured and working
- ✅ Cognito User Pool with multi-tenant custom attributes (tenantId, role, customerId)
- ✅ Cognito User Pool Client (OAuth2, email authentication)
- ✅ S3 Videos Bucket (AES256 encrypted, CORS enabled)
- ✅ S3 Assets Bucket (AES256 encrypted, CORS enabled)
- ✅ CloudFront CDN for video delivery (HTTPS, cost-optimised)
- ✅ API Gateway v2 (HTTP API) with Cognito JWT authorizer
- ✅ Health check endpoint (public, no authentication)

**Database Layer (Local PostgreSQL):** ✅ **COMPLETE & MERGED**

- ✅ Drizzle ORM configured (v0.44.7)
- ✅ PostgreSQL schemas defined: tenants, customers, users
- ✅ Type-safe schema definitions with Zod validation
- ✅ Migration system with verification tooling
- ✅ Environment-specific configuration (dev/staging/production)
- ✅ Three-tier architecture: tenant → customer → users
- ✅ Row-Level Security policies (all phases complete)
- ✅ RLS tests passing (68 total tests covering all functionality)
- ✅ Custom migration runner (Drizzle + RLS orchestration)
- ✅ Connection pooling optimised (Lambda-ready, singleton pattern)
- ✅ Comprehensive documentation (usage guide, security notes, troubleshooting)

**See `progress-log.md` for detailed session-by-session history.**

---

## Current Work

### Completed Stories: FFP-10 + FFP-11 - Database Layer ✅ **MERGED TO MAIN!**

**Objective:** Set up complete database layer with Drizzle ORM, PostgreSQL schema, and Row-Level Security policies for multi-tenant data isolation.

**Combined Approach:** FFP-10 (Schema + RLS) and FFP-11 (Drizzle ORM) had overlapping schema definition tasks. Executed them in an interleaved manner for efficiency and cohesion.

**Total:** 16 unique subtasks, 46 hours (24h FFP-10 + 22h FFP-11) - ✅ **ALL COMPLETE & MERGED**

**Status:**

- ✅ FFP-8 (SST Infrastructure) - COMPLETE (dependency satisfied)
- ✅ FFP-10 + FFP-11 (Database Layer) - COMPLETE & MERGED TO MAIN 🎉
- 🎯 FFP-9 (Cognito Authentication) - UNBLOCKED, ready to start

**Implementation Approach:**

_Local PostgreSQL Development:_

- Use local PostgreSQL instance for all development work
- RDS deployment deferred to FFP-102 (pre-staging)
- Schema will be production-ready, migration to RDS is trivial (15-30min)
- Cost saving: ~£13/month during development phase

_Key Requirements:_

- Type-safe database access via Drizzle ORM
- Multi-tenant isolation via Row-Level Security (RLS)
- All tables must have `tenant_id` column
- RLS policies enforce tenant context from `app.tenant_id` session variable
- Support for three user hierarchies: Individual → Business → Company
- Healthcare data security standards (encryption, audit logging)
- Lambda-optimised connection pooling (max 10 connections)

---

### ✅ Completed Execution Plan (6 Phases) - ALL PHASES MERGED! 🎉

#### **Phase 1: Drizzle Foundation** (6h - FFP-11) ✅ **COMPLETE**

**Goal:** Set up Drizzle ORM with local PostgreSQL connection

1. ✅ **FFP-56**: Install Drizzle packages (2h)
   - Install drizzle-orm and drizzle-kit
   - Add PostgreSQL driver (pg)
   - Update package.json with scripts

2. ✅ **FFP-57**: Create drizzle.config.ts (4h)
   - Configure local PostgreSQL connection
   - Set up schema paths and output directories
   - Test connection

#### **Phase 2: Schema Definition** (8h - Combined FFP-10 + FFP-11) ✅ **COMPLETE**

**Goal:** Create database schema using Drizzle (fulfils both stories)

3. ✅ **FFP-58 + FFP-47**: Define/Create tenants table (3h)
   - Drizzle schema definition for tenants table
   - Generate migration via drizzle-kit
   - Run migration on local PostgreSQL
   - **Note:** Single task fulfils both FFP-58 and FFP-47

4. ✅ **FFP-59 + FFP-48**: Define/Create users table (3h)
   - Drizzle schema definition for users table (references tenants)
   - Generate migration via drizzle-kit
   - Run migration on local PostgreSQL
   - Added customers table for three-tier architecture
   - **Note:** Single task fulfils both FFP-59 and FFP-48

5. ✅ **FFP-60**: Finalise migration system (2h)
   - Add migration scripts to package.json
   - Document migration workflow
   - Test rollback functionality

#### **Phase 3: RLS Implementation** (6.5h - FFP-10) ✅ **COMPLETE**

**Goal:** Add Row-Level Security policies for tenant isolation

6. ✅ **FFP-49**: Enable RLS on users table (2h)
   - Create SQL migration for RLS policies
   - Apply `tenant_isolation_users` policy
   - Test RLS enforcement

7. ✅ **FFP-50**: Create setRLSContext utility (2.5h)
   - Implement utility in @ffp/core
   - Handles setting `app.tenant_id` session variable
   - Error handling and validation

8. ✅ **FFP-51**: Create database indexes (0h - done in Phase 2)
   - Define indexes in Drizzle schema
   - Composite indexes for tenant_id queries
   - Generate and run migration

9. ✅ **FFP-52**: Unit tests for RLS utilities (2h)
   - Test setRLSContext functionality
   - Test policy enforcement
   - Test error handling

#### **Phase 4: Connection Layer** (3h - FFP-11) ✅ **COMPLETE**

**Goal:** Configure production-ready connection pooling

10. ✅ **FFP-61**: Configure connection pooling (3h)

- Lambda-optimised pool configuration
- Max 10 connections
- Connection reuse and timeout handling
- Environment-specific configuration
- Singleton pattern for connection reuse

#### **Phase 5: Testing** (13h - Combined) - ✅ **COMPLETE**

**Goal:** Comprehensive test coverage for ORM and RLS

11. ✅ **FFP-62**: Unit tests for Drizzle setup (2h - FFP-11)
    - ✅ Connection pool initialisation tests
    - ✅ Singleton pattern verification
    - ✅ Schema type tests (tenants, customers, users)
    - ✅ Migration structure validation
    - ✅ Implemented in `/packages/database/__tests__/drizzle.test.ts` (16 tests passing)
12. ✅ **FFP-53**: Integration test - Cross-tenant isolation (4h - FFP-10) ⚠️ **CRITICAL**
    - ✅ Verify Tenant A cannot access Tenant B's data
    - ✅ Test RLS enforcement at database level
    - ✅ Implemented in `/packages/database/src/lib/rls.test.ts` (16 tests passing)
13. ✅ **FFP-54**: Integration test - RLS context application (3h - FFP-10)
    - ✅ Verify RLS context is correctly set
    - ✅ Test queries return only tenant-scoped data
    - ✅ Implemented in `/packages/database/src/lib/rls.test.ts`
14. ✅ **FFP-63**: Integration tests for Drizzle queries (2h - FFP-11)
    - ✅ Basic CRUD operations (create, read, update, delete)
    - ✅ Connection pool reuse behaviour
    - ✅ Database constraints (foreign keys, unique constraints)
    - ✅ Transaction rollback and commit
    - ✅ RLS data isolation between tenants
    - ✅ Implemented in `/packages/database/__tests__/integration.test.ts` (15 tests passing)

#### **Phase 6: Documentation** (7h - Combined) - ✅ **COMPLETE**

**Goal:** Complete documentation for database layer

15. ✅ **FFP-55**: RLS documentation (3h - FFP-10)
    - ✅ RLS policy documentation in packages/database/README.md
    - ✅ Multi-tenant security guide in project-documentation/security.md
    - ✅ Usage examples in project-documentation/coding-standards.md
    - ✅ Updated project-documentation/database-schema.md

16. ✅ **FFP-64**: Drizzle usage guide (4h - FFP-11)
    - ✅ Schema definition patterns documented
    - ✅ Migration workflow documented
    - ✅ Query examples in packages/database/README.md
    - ✅ Troubleshooting section included

---

### 📊 Progress Tracking - ✅ **ALL COMPLETE & MERGED!** 🎉

**FFP-10 Progress:** 9/9 subtasks complete (100%) - ✅ **COMPLETE & MERGED!** 🎉
**FFP-11 Progress:** 9/9 subtasks complete (100%) - ✅ **COMPLETE & MERGED!** 🎉
**Combined Progress:** 16/16 unique subtasks (100%), 46/46 hours (100%) - ✅ **ALL PHASES MERGED TO MAIN!** 🎉

**All Subtasks Merged:**

- ✅ FFP-56: Install Drizzle packages (2h)
- ✅ FFP-57: Create drizzle.config.ts (4h)
- ✅ FFP-58 + FFP-47: Define/Create tenants table (3h)
- ✅ FFP-59 + FFP-48: Define/Create users table + customers table (3h)
- ✅ FFP-60: Finalise migration system (2h)
- ✅ FFP-51: Create database indexes (0h - auto-generated)
- ✅ FFP-49: Enable RLS on tables (2h)
- ✅ FFP-50: Create setRLSContext utility (2.5h)
- ✅ FFP-52: Unit tests for RLS utilities (2h)
- ✅ FFP-53: Integration test - Cross-tenant isolation (4h)
- ✅ FFP-54: Integration test - RLS context application (3h)
- ✅ FFP-55: RLS documentation (3h)
- ✅ FFP-61: Configure connection pooling (3h)
- ✅ FFP-62: Unit tests for Drizzle setup (2h)
- ✅ FFP-63: Integration tests for Drizzle queries (2h)
- ✅ FFP-64: Drizzle usage guide (4h)

**Additional Work (not in original plan):**

- ✅ Customers table schema and migration (Session 22)
- ✅ Architectural redesign (parentBusinessId → customerId) (Session 22)
- ✅ Ticket refinement and misalignment resolution (Session 23)
- ✅ Database package refactoring (FFP-106/107/108 - Session 24)
- ✅ Terminal logger utility and script refactoring (Session 25)

**Note:** 2 subtasks are duplicates (FFP-58+FFP-47, FFP-59+FFP-48), so 18 total subtasks = 16 unique tasks. FFP-51 completed automatically during Phase 2 (Drizzle generates indexes from schema).

**🎉 MAJOR MILESTONE: Database layer complete with all 6 phases merged to main branch! Ready for FFP-9 (Cognito Authentication)!**

### Development Workflow

1. Select next subtask from dependency chain
2. Move to "In Progress" in Jira (when available)
3. Work on subtask according to acceptance criteria
4. Test locally before marking complete
5. User reviews and handles Git Actions like commiting changes: `git commit -m "FFP-XX: [description]"`
6. User update Jira to "Done" with time spent (when available)
7. Update progress documents

---

**Sprint 1 Progress: 108.5/197 hours (55%) - OVER HALFWAY! 🎉 FFP-7, FFP-8, FFP-106/107/108, FFP-10, FFP-11 ALL COMPLETE & MERGED! FFP-9 IN PROGRESS (2/13 subtasks complete - FFP-35 ✅, FFP-43 ✅)!**
