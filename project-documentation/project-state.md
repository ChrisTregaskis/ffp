# FFP - Project State

**Last Updated**: November 6, 2025 - Session 35
**Current Phase**: Sprint 1 Execution - IN PROGRESS 🚀
**Branch**: `feature/ffp-9-cognito-auth`
**Sprint 1 Progress**: 128/197 hours (65%) - WELL OVER HALFWAY! 🎉

---

## Current Work: FFP-9 - Cognito Authentication

**Status**: 🚀 IN PROGRESS (4/13 subtasks, 10.5/29-30 hours, 35%)

### Phase 1: Prerequisites (8h) - ✅ COMPLETE

- ✅ FFP-43: Error Handling Classes (3.5h)
- ✅ FFP-36: Tenant Context Extraction (2h)
- ✅ FFP-44: Structured Logging (2h)
- ⏸️ FFP-32: Secrets Manager (2.5h) - **DEFERRED** (see decisions below)

### Phase 2: Bootstrap + Core Auth (8.5h)

- ⏸️ Manual: Super User Setup (0.5h)
- ⏸️ FFP-112: Admin CLI Script (1h) - ← **NEXT**
- ✅ FFP-35: Zod Schemas (3h)
- ⏸️ FFP-37: Invite User Lambda (4h)

### Phase 3: Authentication Endpoints (7h)

- ⏸️ FFP-38: Login Lambda (3h)
- ⏸️ FFP-39: Refresh Token Lambda (2h)
- ⏸️ FFP-40: API Gateway Routes (2h)

### Phase 4: Testing (12h - can defer FFP-42/45)

- ⏸️ FFP-41: Unit Tests (4h)
- ⏸️ FFP-42: Integration Tests (5h) - DEFERRABLE
- ⏸️ FFP-45: Deployed Environment Tests (3h) - DEFERRABLE

### Phase 5: Documentation (2h)

- ⏸️ FFP-46: API Documentation (2h)

---

## Completed Stories

| Story           | Title                         | Hours   | Status                   |
| --------------- | ----------------------------- | ------- | ------------------------ |
| FFP-7           | Turborepo Monorepo Setup      | 13h     | ✅ MERGED                |
| FFP-8           | SST Infrastructure Foundation | 17h     | ✅ MERGED                |
| FFP-106/107/108 | Database Package Refactoring  | 3h      | ✅ MERGED                |
| FFP-10          | PostgreSQL Schema with RLS    | 24h     | ✅ MERGED                |
| FFP-11          | Drizzle ORM Setup             | 22h     | ✅ MERGED                |
| FFP-15          | Error Handling Patterns       | 15h     | ✅ COMPLETE (via FFP-43) |
| **Total**       |                               | **94h** | **6 stories complete**   |

---

## Recent Work

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

## Sprint 1 Overview

**Total Stories**: 10 stories, 197 hours (~6.2 months at 8h/week)
**Completed**: 127.5/197 hours (65%)
**In Progress**: FFP-9 Cognito Authentication
**Remaining**: FFP-12 (Testing), FFP-14 (CloudWatch), FFP-16 (Web Login)

**Timeline**: Started Oct 20, 2025 | Target completion: ~April 2026

---

## What's Working

**Infrastructure (Deployed)**:

- ✅ SST v3 Ion, Cognito User Pool, S3 + CloudFront, API Gateway with JWT authorizer
- ✅ Local PostgreSQL with Drizzle ORM, RLS policies, connection pooling
- ✅ Error handling, tenant context, structured logging

**Monorepo**:

- ✅ Turborepo with 3 packages (web, functions, core, database)
- ✅ TypeScript strict mode, ESLint + Prettier, 125+ tests passing
- ✅ Build caching (30-100x faster), workspace dependencies

---

## Key Decisions

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
- Super admin bootstrap + CLI script for business creation
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

**Epic 1 Stories** (Sprint 1-6):

- FFP-7 through FFP-16: Application Setup & Foundation
- Current: FFP-9 (Cognito Authentication)
- Next after FFP-9: FFP-12 (Testing), FFP-14 (CloudWatch), FFP-16 (Web Login)

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
