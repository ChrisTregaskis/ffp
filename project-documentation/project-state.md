# FFP - Project State

**Last Updated**: November 11, 2025 - Session 41
**Current Phase**: Sprint 2 Execution - IN PROGRESS 🚀
**Sprint Duration**: 10th November - 30th November 2025 (3 weeks)
**User Story Branch**: `feature/ffp-9-cognito-auth`
**Current Subtask**: FFP-41 - Unit Tests (context.ts only)

---

## Sprint 2 Overview

**Duration**: 10th November - 30th November 2025 (3 weeks)
**Focus**: Complete Application Setup (EPIC FFP-1) + Assessment Engine Planning

**Sprint 2 Stories**:

1. **FFP-9** - Cognito Authentication (CARRYOVER - remaining subtasks)
2. **FFP-12** - Testing Infrastructure Setup
3. **FFP-16** - Web Login Interface
4. **FFP-110** - Assessment Engine Epic Planning

**Sprint 1 Summary**:

- Completed: 6/10 stories (132.5/197 hours, 67%)
- Carried Over: FFP-9 (7 remaining subtasks, ~12-13 hours)
- Deferred: FFP-14 (CloudWatch Monitoring)

---

## Current Work: FFP-9 - Cognito Authentication (CARRYOVER)

**Status**: 🚀 IN PROGRESS (9/13 subtasks, 25/31-32 hours, 81%)

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

- ✅ FFP-38: Login Lambda (3h) - **Ready for Review**
- ✅ FFP-39: Refresh Token Lambda (2h) - **Ready for Review**
- ✅ FFP-40: API Gateway Routes (1h) - **Verification Complete** ← **NEXT: Phase 4 Testing**

### Phase 4: Testing (12h - can defer FFP-42/45)

- 🚀 FFP-41: Unit Tests (4h) - **IN PROGRESS** (context.ts tests only - auth/error/logger already complete)
- ⏸️ FFP-42: Integration Tests (5h) - **DEFERRED** (for build speed, sticking with 10% coverage and critical unit tests only)
- ⏸️ FFP-45: Deployed Environment Tests (3h) - **DEFERRED** (for build speed, sticking with 10% coverage and critical unit tests only)

### Phase 5: Documentation (2h) - ✅ COMPLETE

- ✅ FFP-46: API Documentation (2h)

---

## Recent Work (Sprint 2 Sessions)

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

- Completed: FFP-7, FFP-8, FFP-10, FFP-11, FFP-15
- In Progress: FFP-9 (Cognito Authentication - carryover)
- Sprint 2: FFP-12 (Testing), FFP-16 (Web Login)
- Deferred: FFP-14 (CloudWatch Monitoring)

**Sprint 2 Planning**:

- FFP-110: Assessment Engine Epic Planning (prepare for next epic)

**Critical Success Criteria**:

- ✅ All TypeScript strict mode, no errors
- ✅ RLS integration tests pass (cross-tenant isolation verified)
- ✅ JWT contains tenantId, role, customerId
- ✅ Infrastructure deployed to dev environment
- ✅ Database schemas defined and merged
- 🔄 E2E authentication tests pass (FFP-99 - CRITICAL)
- 🔄 Test coverage tracking (125 tests passing)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
