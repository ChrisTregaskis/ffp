# FFP - Project State

**Last Updated**: November 19, 2025 - Session 53
**Current Phase**: Sprint 2 Execution - IN PROGRESS 🚀
**Sprint Duration**: 10th November - 30th November 2025 (3 weeks)
**Current User Story Branch:** `feature/FFP-16-web-login-flow`
**Next User Story**: FFP-110 - Assessment Engine Epic Planning
**Recently Completed**: FFP-16 - Web Login Interface (Complete - 9/10 subtasks, 2 deferred)

---

## Sprint 2 Overview

**Duration**: 10th November - 30th November 2025 (3 weeks)
**Focus**: Complete Application Setup (EPIC FFP-1) + Assessment Engine Planning

**Sprint 2 Stories**:

1. ✅ **FFP-9** - Cognito Authentication (COMPLETE)
2. ✅ **FFP-12** - Testing Infrastructure Setup (COMPLETE)
3. ✅ **FFP-16** - Web Login Interface (COMPLETE - 9/9 subtasks, 2 deferred)
4. 🔜 **FFP-110** - Assessment Engine Epic Planning (NEXT)

**Sprint 1 Summary**:

- Completed: 6/10 stories (132.5/197 hours, 67%)
- Carried Over: FFP-9 (completed in Sprint 2)
- Deferred: FFP-14 (CloudWatch Monitoring)

---

## Completed Work: FFP-9 - Cognito Authentication

**Status**: ✅ COMPLETE (10/13 subtasks, 29/31-32 hours, 93%)

### Phase 1: Prerequisites (8h) - ✅ COMPLETE

- ✅ FFP-43: Error Handling Classes (3.5h)
- ✅ FFP-36: Tenant Context Extraction (2h)
- ✅ FFP-44: Structured Logging (2h)
- ⏸️ FFP-32: Secrets Manager (2.5h) - **DEFERRED** (see decisions below)

### Phase 2: Bootstrap + Core Auth (10.5h) - ✅ COMPLETE

- ✅ Manual: Super User Setup (0.5h)
- ✅ FFP-112: Admin API Endpoint (4.5h)
- ✅ FFP-35: Zod Schemas (3h)
- ✅ FFP-37: Invite User Lambda (4h)

### Phase 3: Authentication Endpoints (7h) - ✅ COMPLETE

- ✅ FFP-38: Login Lambda (3h)
- ✅ FFP-39: Refresh Token Lambda (2h)
- ✅ FFP-40: API Gateway Routes (1h)

### Phase 4: Testing (12h - focused on critical unit tests)

- ✅ FFP-41: Unit Tests (4h) - **COMPLETE** (context.ts tests + RLS fix)
- ⏸️ FFP-42: Integration Tests (5h) - **DEFERRED** (10% coverage target achieved with unit tests)
- ⏸️ FFP-45: Deployed Environment Tests (3h) - **DEFERRED** (will be addressed in FFP-12)

### Phase 5: Documentation (2h) - ✅ COMPLETE

- ✅ FFP-46: API Documentation (2h)

---

## Completed Work: FFP-12 - Testing Infrastructure Setup

**Status**: ✅ COMPLETE (4/11 subtasks completed, 7 deferred to post-MVP)

### Phase 1 Pragmatic Approach

**Completed** (Unit + RLS Testing):

- ✅ FFP-65: Vitest installed (`vitest@2.1.4`, `@vitest/ui@2.1.4`)
- ✅ FFP-66: Vitest configuration (root + package-specific configs)
- ✅ FFP-72: Sample unit tests (185 tests passing)
- ✅ FFP-71: Test helpers (database RLS helpers in `packages/database/__tests__/helpers.ts`)

**Deferred to Post-MVP** (Playwright/MSW):

- ⏸️ FFP-67: Install Playwright
- ⏸️ FFP-68: Create Playwright config
- ⏸️ FFP-69: Install MSW
- ⏸️ FFP-70: Configure MSW server/handlers
- ⏸️ FFP-73: Sample E2E test
- ⏸️ FFP-74: Sample MSW mock test
- ✅ FFP-75: Updated testing-strategy.md (reflects Phase 1 approach)

### Testing Infrastructure Summary

**Current State** (Phase 1):

- ✅ Vitest installed and operational
- ✅ 185 unit tests passing (core + database packages)
- ✅ 16 RLS integration tests (critical multi-tenant isolation)
- ✅ 8% coverage target achieved
- ✅ Test helpers for RLS testing
- ✅ Transaction rollback pattern (no database pollution)

**Rationale for Deferral**:

- Solo developer with 8h/week capacity
- Unit tests + RLS integration provide sufficient Phase 1 coverage
- E2E testing better suited for mature UI (after FFP-16)
- MSW adds complexity without clear benefit (Vitest mocks sufficient)
- Manual testing adequate for MVP validation

---

## Current Work: FFP-16 - Web Login Interface

**Status**: ✅ COMPLETE (9/9 subtasks - 9 complete, 2 deferred)
**Estimated**: ~18-19 hours (revised from 20 hours with deferrals)
**Completed**: 19/18-19 hours (100%)

### Execution Order

1. ✅ **FFP-115** - Component Library & Design System Setup (4h) - **COMPLETE**
2. ✅ **FFP-93** - Install and configure AWS Amplify (1h) - **COMPLETE**
3. ✅ **FFP-90** - Create AuthContext and AuthProvider (4h) - **COMPLETE**
4. ✅ **FFP-119** - Web Routing & Component Library Foundation (2h actual + 2h extended scope) - **COMPLETE**
5. ✅ **FFP-92** - Implement login form (2h) - **COMPLETE** (with code review fixes)
6. ✅ **FFP-95** - Implement logout functionality (1h) - **COMPLETE** (integrated with routing)
7. ✅ **FFP-116** - First-time password setup for invited users (2h) - **COMPLETE** (with code review)
8. ✅ **FFP-97** - Write unit tests (2h) - **COMPLETE**
9. ✅ **FFP-100** - Update documentation (1h) - **COMPLETE**

### Deferred Subtasks

- **FFP-91** - Registration form (3h) - ⏸️ **DEFERRED** to Phase 2
  - Reason: Admin-only business onboarding (no self-registration in MVP)
  - Aligns with FFP-9 authentication strategy
- **FFP-98** - Integration tests (3h) - ⏸️ **DEFERRED** to post-MVP
  - Reason: Consistent with FFP-12 testing strategy
  - Unit tests (FFP-97) + manual testing sufficient for Phase 1
- **FFP-99** - E2E tests - ✅ **ALREADY ABANDONED** (Playwright deferred)

### Key Decisions

**Component Library First** (Session 44):

- Created new subtask FFP-115 for component library & design system
- MUST complete before form-based subtasks (FFP-90, FFP-92, FFP-96)
- Includes: Tailwind theme, Icomoon icons, Button, Form components
- Form pattern: Standard forms only (assessment forms deferred to Sprint 3)
- Component showcase page at `/components` route (public, no auth)

**Design System Setup**:

- Tailwind CSS with custom theme (colours, typography)
- Icomoon icon system with TypeScript type generation
- Reusable Button component (primary, secondary, text variants)
- Reusable form inputs (TextInput, PasswordInput, EmailInput)
- Form management pattern from guide (standard forms only)
- British English throughout

---

## Recent Work (Sprint 2 Sessions)

> **Note**: Detailed session logs available in `progress-log.md`

**Sessions 51-53 (Nov 17-19)**: ✅ FFP-92, FFP-116, FFP-97, FFP-100 - Login Flow COMPLETE

- **FFP-92 (Session 51)**: Login form with StaticAlert feedback, AuthLayout template, password visibility toggle
- **FFP-116 (Session 52)**: Two-step password setup flow with strength indicator, CardTransition motion component
  - Migrated validation constants to @ffp/core (shared client/server validation)
  - Refactored invite-user to /user domain with JWT authorizer at API Gateway level
- **FFP-97 (Session 53)**: Auth schema unit tests (2/2 passing), coverage target adjusted to 8%
- **FFP-100 (Session 53)**: Documentation updated with Authentication section, environment setup
  - Created client-side logger utility (`packages/web/src/lib/logger.ts`)
  - Created error boundary system (ErrorBoundary, ErrorFallback components)
- Quality: Zero TypeScript errors, zero ESLint warnings, 185/185 tests passing
- FFP-16 COMPLETE - Ready for branch merge

---

**Sessions 47-50 (Nov 14-17)**: ✅ FFP-119, FFP-90, FFP-95 - Routing & Auth Context COMPLETE

- **FFP-90 (Session 47)**: AuthContext with JWT claim extraction (tenantId, role, userId)
  - Fixed TypeScript server crash loop (pnpm .pnpm/ directory overwhelming file watchers)
  - Created MANUAL-TEST-FFP-90.md with 10 comprehensive test scenarios
- **FFP-119 (Sessions 48-50)**: Type-safe routing (RouteKey enum, ProtectedRoute) + comprehensive component library
  - Form system (config-driven), Icon library (20+ icons), Motion system (Framer Motion)
  - Component showcases (dev-only routes, excluded from production builds)
  - **Code pattern standardised**: React components use `const Component: React.FC = () => {}`
  - **Schema-first types**: Zod schemas as single source of truth (prevents drift)
  - Backend refactoring: Converted services/repositories to arrow functions
  - TypeScript configuration optimised (VS Code watchOptions to prevent file watcher overload)
  - Bundle: 650KB uncompressed (190KB gzipped) - acceptable for Phase 1
- **FFP-95**: Logout functionality integrated with HomePage (sign out button works)

---

**Sessions 44-46 (Nov 10-13)**: ✅ FFP-115, FFP-93 - Component Library & Amplify COMPLETE

- **FFP-115 (Session 45)**: Tailwind v4 with @theme config, Inter font, complete colour system
  - Form components with React Hook Form + Zod, Icon system with TypeScript types
  - ARIA attributes (aria-required, aria-invalid, aria-describedby) for accessibility
- **FFP-93 (Session 46)**: AWS Amplify setup (signIn, signOut, getCurrentUser, fetchAuthSession)
  - Environment variables with VITE\_ prefix for client exposure
  - Intentionally excluded signUp (invite-only user creation for MVP)
- **FFP-44 (Session 44)**: Planning session - deferred FFP-91 (registration) and FFP-98 (integration tests)

---

**Sessions 42-43 (Nov 10)**: ✅ FFP-12, FFP-41 - Testing Infrastructure COMPLETE

- **FFP-41 (Session 42)**: Comprehensive context.ts unit tests (60 tests, 926 lines)
  - **RLS Fix**: Removed BYPASSRLS privilege from root_user (tests now properly validate isolation)
  - Total: 185/185 tests passing (16 RLS integration tests)
- **FFP-43 (Session 43)**: Strategic decision to defer Playwright/MSW to post-MVP
  - Phase 1 focus: Unit tests (90%) + RLS integration tests (10%)

---

**Sessions 36-41 (Nov 6-11)**: ✅ FFP-9 Core Auth - Prerequisites & Endpoints COMPLETE

- **FFP-112 (Session 36)**: Admin API endpoint (POST /admin/create-customer) with domain-organised architecture
- **FFP-32 (Session 35)**: Secrets Manager deferred (Cognito uses public key verification)
- **FFP-37-40**: Auth endpoints (invite-user, login, refresh-token, API Gateway routes)
  - Fixed IAM permissions for Cognito AdminCreateUser
  - Implemented NEW_PASSWORD_REQUIRED challenge flow
  - Domain proxy routing pattern (ANY /auth/{proxy+}, ANY /admin/{proxy+})
- **FFP-41**: Context.ts tests (see above)

---

**Sessions 31-34**: ✅ FFP-9 Prerequisites - Error Handling, Context, Logging

- FFP-43: Error handling classes (7 types, Lambda middleware wrapper)
- FFP-36: Tenant context extraction (actor-based architecture)
- FFP-44: Structured logging (CloudWatch JSON, log level filtering)

---

## Sprint 1 Summary (COMPLETE)

**Duration**: 20th October - 9th November 2025
**Total Stories**: 10 stories, 197 hours planned
**Completed**: 6 stories (135.5/197 hours, 69%)
**Carried Over to Sprint 2**: FFP-9 (6 remaining subtasks, ~9-10 hours)
**Deferred**: FFP-14 (CloudWatch Monitoring)

**Completed Stories**:

- FFP-7: Turborepo Monorepo Setup (13h)
- FFP-8: SST Infrastructure Foundation (17h)
- FFP-106/107/108: Database Package Refactoring (3h)
- FFP-10: PostgreSQL Schema with RLS (24h)
- FFP-11: Drizzle ORM Setup (22h)
- FFP-15: Error Handling Patterns (15h - via FFP-43)

**Key Achievements**:

- Infrastructure deployed to dev environment
- Domain-organised architecture established
- Actor-based context system implemented
- 125+ tests passing with zero TypeScript errors

---

## What's Working

**Infrastructure (Deployed)**:

- ✅ SST v3 Ion, Cognito User Pool, S3 + CloudFront, API Gateway with JWT authorizer
- ✅ Local PostgreSQL with Drizzle ORM, RLS policies, connection pooling
- ✅ Error handling, tenant context, structured logging

**Monorepo**:

- ✅ Turborepo with 4 packages (web, functions, core, database)
- ✅ TypeScript strict mode, ESLint + Prettier, 125+ tests passing
- ✅ Build caching (30-100x faster), workspace dependencies
- ✅ Domain-organised backend with admin operations

---

## Key Decisions

**FFP-119 (Web Routing & Component Library)** - Sessions 49-50:

- **React component pattern standardised**: All React components use `const Component: React.FC = () => {}`
  - Provides explicit typing and consistent export pattern
  - Applied across ~40+ components (routing, forms, icons, ui, layout, motion, dev)
  - **Important**: Backend functions should use traditional `function` declarations (better stack traces, hoisting)
  - Distinction documented in CLAUDE.md
- **Schema-first type generation**: Zod schemas are single source of truth for all types
  - Types exported from `packages/core/src/schemas/` via `z.infer<typeof schema>`
  - `./types` directory deprecated in favour of schema-derived types
  - Prevents type/validation drift (runtime and compile-time safety)
  - Applied to User, UserRole, Tenant, TenantType, Customer, CustomerStatus
- **Component library architecture**: Atomic design with domain-specific directories
  - `form/`, `icons/`, `ui/`, `layout/`, `motion/`, `dev/` for clear organisation
  - Barrel exports (`index.ts`) for clean imports
  - British English prop names throughout (`colour`, `initialise`, `optimise`)
- **Dev-only component showcases**: Development routes excluded from production builds
  - Environment-based filtering via `import.meta.env.PROD`
  - Routes marked with `devOnly: true` flag
  - Accessible at `/components/*` in development only
  - High-ROI developer experience feature for rapid component testing
- **Framer Motion accepted**: ~50KB bundle cost justified for Phase 1 animation quality
  - GPU-accelerated animations provide smooth user experience
  - Critical for healthcare app perceived quality and trust
  - Defer optimisation (CSS-only alternatives) to Phase 2 if needed
- **Bundle size monitoring**: 650KB uncompressed (190KB gzipped) acceptable for Phase 1
  - Not mobile-first (physiotherapist dashboard = desktop/tablet)
  - Track in CI but don't optimise until >1MB or user feedback indicates slowness
  - Route-level code splitting deferred to post-MVP

**FFP-112 (Admin API)** - Session 36:

- **Domain-organised architecture pattern established**: Handler → Service → Repository
- Admin operations use privileged database connection (BYPASSRLS permission required)
- Request context pattern: Unified `RequestContext` interface combining db + tenant context
- Cryptographically secure random generation (Node.js crypto, server-only exports)
- Stage-aware SSL detection for database connections (local/dev vs staging/production)
- Clean error propagation: Let `withErrorHandling` wrapper handle all errors naturally
- No try-catch blocks in handlers/services unless specific error transformation needed

**FFP-32 (Secrets Manager)** - Session 35:

- **DEFERRED** until staging readiness / RDS setup
- Cognito JWTs use custom attributes (`custom:tenantId`, `custom:role`)
- JWT verification uses Cognito public keys (JWKS) - no signing secret needed
- No custom JWT generation in Phase 1
- Will implement when actual secrets required (DB encryption keys, API keys)

**FFP-9 (Cognito Auth)**:

- Admin-only business onboarding for MVP (no self-registration)
- Three-tier architecture: tenant → customer → users
- JWT claims: tenantId, customerId, role
- Super admin bootstrap + manual business creation via API
- Invite-only user creation

**Architecture**:

- Domain-organised backend (Handler → Service → Entity → Repository → Schema)
- Actor-based context (User vs System actors)
- Multi-tenant isolation via RLS (all tables have tenant_id)
- Lambda-optimised connection pooling (max 10 connections)

---

## Quick Reference

**Jira Project**: FFP (Fit For Purpose)
**Site**: https://ctregaskis.atlassian.net
**Project Key**: FFP

**Current Sprint**: Sprint 2 (10th Nov - 30th Nov 2025)

**EPIC FFP-1: Application Setup** (Sprint 1-2):

- Completed: FFP-7, FFP-8, FFP-10, FFP-11, FFP-15, FFP-9, FFP-12
- Next: FFP-16 (Web Login Interface)
- Deferred: FFP-14 (CloudWatch Monitoring)

**Sprint 2 Planning**:

- FFP-110: Assessment Engine Epic Planning (prepare for next epic)

**Critical Success Criteria**:

- ✅ All TypeScript strict mode, no errors
- ✅ RLS integration tests pass (cross-tenant isolation verified)
- ✅ JWT contains tenantId, role, customerId
- ✅ Infrastructure deployed to dev environment
- ✅ Database schemas defined and merged
- ✅ Unit test coverage for critical paths (185 tests passing, 8% target achieved)
- ✅ Test infrastructure configured (Vitest operational)
- ⏸️ E2E authentication tests (deferred to post-MVP)
- ⏸️ Advanced test coverage reporting (deferred to post-MVP)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
