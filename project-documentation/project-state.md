# FFP - Project State

**Last Updated**: November 10, 2025 - Session 44
**Current Phase**: Sprint 2 Execution - IN PROGRESS 🚀
**Sprint Duration**: 10th November - 30th November 2025 (3 weeks)
**Next Subtask**: FFP-115 - Component Library & Design System Setup
**Recently Completed**: FFP-12 - Testing Infrastructure Setup

---

## Sprint 2 Overview

**Duration**: 10th November - 30th November 2025 (3 weeks)
**Focus**: Complete Application Setup (EPIC FFP-1) + Assessment Engine Planning

**Sprint 2 Stories**:

1. ✅ **FFP-9** - Cognito Authentication (COMPLETE)
2. ✅ **FFP-12** - Testing Infrastructure Setup (COMPLETE)
3. 🚀 **FFP-16** - Web Login Interface (IN PROGRESS - 7/10 subtasks active, 2 deferred)
4. **FFP-110** - Assessment Engine Epic Planning

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
- ✅ 10% coverage target achieved
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

**Status**: 🚀 IN PROGRESS (7/10 subtasks active, 2 deferred, 1 new)
**Estimated**: ~18-19 hours (revised from 20 hours with deferrals)

### Execution Order

1. **FFP-115** - Component Library & Design System Setup (3-4h) - 🔜 **NEXT**
2. **FFP-93** - Install and configure AWS Amplify (1h)
3. **FFP-90** - Create AuthContext and AuthProvider (4h)
4. **FFP-92** - Implement login form (2h)
5. **FFP-94** - Create ProtectedRoute component (2h)
6. **FFP-96** - Create pages and setup routing (2h)
7. **FFP-95** - Implement logout functionality (1h)
8. **FFP-97** - Write unit tests (2h)
9. **FFP-100** - Update documentation (1h)

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

**Reference Documents**:

- Form pattern: `project-documentation/sprint-planning/outputs/Form Management Pattern Guide.md`
- Icon system: `project-documentation/sprint-planning/outputs/Icon System Implementation Guide.md`
- Executable prompt: `project-documentation/sprint-planning/prompts/FFP-115-component-library-prompt.md`

---

## Recent Work (Sprint 2 Sessions)

**Session 44 (Nov 10)**: 🚀 FFP-16 - Planning & Ticket Updates (1h)

- Reviewed FFP-16 user story and all subtasks (FFP-90 to FFP-100)
- Identified need for component library setup before form implementation
- Created FFP-115 (Component Library & Design System Setup) - 3-4h estimate
- Deferred FFP-91 (registration form) to Phase 2 - admin-only onboarding
- Deferred FFP-98 (integration tests) to post-MVP - consistent with FFP-12
- Updated FFP-93 with detailed acceptance criteria for Amplify setup
- Created comprehensive executable prompt for FFP-115
- Established execution order (component library → Amplify → forms → routing → tests)
- User decisions: Tailwind theme (will provide colours), Icomoon icons, form pattern
- Ready to tackle FFP-115 (Component Library) in next session

**Session 43 (Nov 10)**: ✅ FFP-12 - Testing Infrastructure COMPLETE (0.5h)

- Reviewed FFP-12 against current state (4 subtasks already complete)
- Made strategic decision to defer Playwright/MSW to post-MVP
- Updated testing-strategy.md to reflect Phase 1 pragmatic approach
- Clarified Phase 1 focus: Unit tests (90%) + RLS integration tests (10%)
- No new infrastructure needed - Vitest fully operational with 185 tests
- Updated Jira tickets (4 complete, 7 deferred, 1 doc update done)
- FFP-12 story complete - ready for FFP-16 (Web Login Interface)

**Session 42 (Nov 10)**: ✅ FFP-41 - Unit Tests COMPLETE + RLS Fix (4h)

- Created comprehensive context.ts unit tests (60 tests, 926 lines)
- Achieved zero ESLint violations using proper TypeScript types (no `any` or disable directives)
- Created type-safe helper functions for error testing (Partial types, union types, `as never`)
- Investigated and fixed RLS test failures (13 tests in @ffp/database package)
- Root cause: `root_user` had BYPASSRLS privilege, completely bypassing RLS policies
- Solution: Removed BYPASSRLS with `ALTER ROLE root_user NOBYPASSRLS;`
- All 68 database tests now passing (including all 16 RLS tests)
- Total: 185/185 tests passing across core and database packages
- FFP-9 story now complete (10/13 subtasks, deferred FFP-42/45 for FFP-12)

**Session 41 (Nov 11)**: 🚀 FFP-41 - Unit Tests IN PROGRESS

- Analysed ticket: auth schema, error, and logger tests already exist (comprehensive)
- Missing: context.ts tests (extractUserContext, createSystemContext, extractJobContext)
- Created executable prompt for context.ts unit tests
- Scope: Write missing context tests only, verify 10% coverage target achieved
- Expected completion: ~2-3 hours (ticket estimated 4h, reduced scope)

**Session 40 (Nov 11)**: ✅ FFP-40 - API Gateway Routes Verification COMPLETE (1h)

- Verified SST configuration (routes, CORS, environment variables, JWT authoriser)
- Confirmed domain proxy routing pattern (ANY /auth/{proxy+}, ANY /admin/{proxy+})
- Verified all routes in domain routers (auth: 4 routes, admin: 1 route)
- Updated Jira FFP-40 description to match actual implementation
- Documented domain proxy routing approach and benefits
- All acceptance criteria verified and marked complete
- Routes: POST /admin/create-customer, POST /auth/invite-user, POST /auth/login, POST /auth/complete-new-password, POST /auth/refresh-token, GET /health
- CORS configured globally with stage-aware origins
- Health check kept simple (no three-tier context, appropriate for monitoring)
- All Phase 3 subtasks now complete and ready for review

**Session 39 (Nov 11)**: ✅ FFP-39 - Refresh Token Lambda COMPLETE (2h)

- Implemented refresh-token endpoint (POST /auth/refresh-token) for automatic token renewal
- Created `packages/core/src/auth/refresh-token.service.ts` - Calls CognitoService.refreshToken()
- Created `packages/functions/src/auth/refresh-token.ts` - Public Lambda handler
- Added refreshTokenSchema validation to auth schemas
- Returns new access/ID tokens (1-hour validity) with original refresh token (30-day validity)
- No refresh token rotation (Cognito default behaviour - simplifies client implementation)
- Comprehensive error handling (invalid/expired tokens return 401 Unauthorised)
- No non-null assertions used (proper validation throughout)
- Updated route registry to include POST /auth/refresh-token
- Created comprehensive manual testing guide in FFP-39-manual-testing.md
- All TypeScript checks pass, ESLint clean, ready for code review

**Session 38 (Nov 11)**: ✅ FFP-38 - Login Lambda COMPLETE (3h)

- Implemented login endpoint (POST /auth/login) with NEW_PASSWORD_REQUIRED challenge flow
- Implemented complete-new-password endpoint (POST /auth/complete-new-password)
- Added completeNewPassword() method to CognitoService (RespondToAuthChallengeCommand)
- Created login and complete-new-password services with proper validation
- Fixed 401 Unauthorised error by making /auth/\* routes public at API Gateway level
- Updated Postman collection with Login and Complete New Password requests
- Updated authentication.md with concise testing guide and implementation descriptions
- All TypeScript checks pass, ESLint clean, ready for code review

**Session 37 (Nov 9)**: ✅ FFP-37 - Invite User Lambda COMPLETE (4h)

- Fixed invite-user endpoint IAM permissions (Cognito AdminCreateUser access)
- Added Cognito IAM permissions to SST auth route Lambda
- Fixed test suite to use API Gateway V2 event structures
- Updated Postman collection with tenantId/customerId placeholders for system admin mode
- All 125 tests passing in @ffp/core
- Zero TypeScript errors and ESLint warnings
- Ready for deployment and end-to-end testing

**Session 36 (Nov 8)**: ✅ FFP-112 - Admin API Endpoint COMPLETE (4.5h)

- Admin domain created (repository, service, schemas)
- POST /admin/create-customer Lambda handler with JWT + role validation
- Request context utilities (unified db + tenant context)
- Cryptographically secure random generation (crypto.randomInt)
- Stage-aware SSL detection for database connections
- Domain-organised architecture pattern established
- Security review fixes applied (error handling, British spelling)

**Session 35 (Nov 6)**: ⏸️ FFP-32 - Secrets Manager DEFERRED (0.5h)

- Decision to defer until actual secret requirements arise
- Cognito JWTs use public key verification (no signing secret needed)
- Will revisit during staging readiness / RDS setup

**Session 34 (Nov 6)**: ✅ FFP-44 - Structured Logging (2h)

- Logger class with CloudWatch JSON output and actor awareness
- Log level filtering (DEBUG/INFO/WARN/ERROR)
- Lambda wrapper integration with automatic request logging
- 27 new tests (125 total)

**Session 33 (Nov 5)**: ✅ FFP-36 - Tenant Context Extraction (2h)

- Actor-based architecture (UserActor, SystemActor)
- Enhanced TenantContext with actor, requestId, timestamp
- Runtime validation for JWT claims
- Helper functions for actor display names

**Session 31 (Nov 3)**: ✅ FFP-43 - Error Handling Classes (3.5h)

- Custom error hierarchy (7 error types)
- Lambda middleware wrapper with error-to-HTTP conversion
- CognitoService wrapper
- 55 comprehensive tests

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
- ✅ Unit test coverage for critical paths (185 tests passing, 10% target achieved)
- ✅ Test infrastructure configured (Vitest operational)
- ⏸️ E2E authentication tests (deferred to post-MVP)
- ⏸️ Advanced test coverage reporting (deferred to post-MVP)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
