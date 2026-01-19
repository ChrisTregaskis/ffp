# FFP - Project State

**Last Updated**: 19th January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 4 ✅ Complete | Sprint 5 Ready
**Previous**: Sprint 3 ✅ Complete

---

## Ready: Sprint 5 - Results & Frontend Core (23 pts)

**Dates**: 26th January - 15th February 2026
**Branch**: `feature/sprint5`
**Sprint Goal**: Assessment results API, programme generation, frontend components for assessment flow.
**Analysis**: See `sprint-planning/outputs/sprint-5-analysis-report.md`

### Sprint 5 Stories

| Key     | Story                                | Pts | Dependencies        |
| ------- | ------------------------------------ | --- | ------------------- |
| FFP-131 | Get Assessment Results API           | 3   | FFP-133 ✅          |
| FFP-134 | Programme Generation Service         | 5   | FFP-131             |
| FFP-136 | TanStack Query Hooks for Assessments | 5   | FFP-135 ✅, FFP-131 |
| FFP-139 | Question Renderer Components         | 8   | FFP-135 ✅, FFP-136 |
| FFP-138 | Assessment Progress Bar Component    | 2   | FFP-135 ✅          |

### Recommended Implementation Order

1. **FFP-138** (2 pts) - Independent, quick win
2. **FFP-131** (3 pts) - Unblocks FFP-134, critical path
3. **FFP-136** (5 pts) - TanStack setup, unblocks FFP-139
4. **FFP-139** (8 pts) - Largest story, benefits from hooks
5. **FFP-134** (5 pts) - Can parallel with FFP-139

### Pre-requisites

- [ ] **API Client Design** - Base + FFP client pattern (see `sprint-planning/outputs/api-client-design-prompt.md`)
- [ ] Install TanStack Query before FFP-136

---

## Completed: Sprint 4 - APIs & FE Foundation (23 pts) ✅

**Status**: ✅ Complete (merged)

| Key     | Story                           | Pts | Summary                                       |
| ------- | ------------------------------- | --- | --------------------------------------------- |
| FFP-130 | Submit Assessment API           | 5   | POST /assessments/:id/submit, job enqueue     |
| FFP-133 | Scoring Service Implementation  | 8   | Multi-dimensional scoring, flow-level config  |
| FFP-126 | Assessment Template Admin API   | 5   | CRUD endpoints for system admins              |
| FFP-135 | Assessment Context & State Mgmt | 5   | React Context + useReducer, branching support |

### Key Patterns Established

| Area               | Decision                                                         |
| ------------------ | ---------------------------------------------------------------- |
| **Scoring**        | Multi-dimensional with weighted dimensions, flow-level config    |
| **Branching**      | `goto_step`, `show_warning` actions with condition evaluators    |
| **Frontend State** | React Context + useReducer pattern, typed actions                |
| **Admin API**      | Thin service layer, repository handles logic                     |
| **Type Imports**   | `@ffp/web` imports from `@ffp/core` only (never `@ffp/database`) |

---

## Completed: Sprint 3 - Backend Foundation (24 pts) ✅

**Status**: ✅ Complete (merged)

| Key     | Story                                      | Pts |
| ------- | ------------------------------------------ | --- |
| FFP-124 | Assessment Template Schema & Repository    | 5   |
| FFP-132 | Process Jobs Schema & Queue Infrastructure | 8   |
| FFP-125 | Assessment Flow Schema & Configuration     | 3   |
| FFP-127 | User Assessment Schema & State Machine     | 5   |
| FFP-128 | Start Assessment API                       | 3   |
| FFP-129 | Save Assessment Progress API               | 3   |

### Key Patterns Established

| Area               | Decision                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| **State Machine**  | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`) |
| **Job Queue**      | Database-driven polling with `FOR UPDATE SKIP LOCKED`, exponential backoff   |
| **Flow Steps**     | `intro`, `questions`, `transition`, `video-assessment`, `results`            |
| **RLS Pattern**    | Tenant isolation via `app.tenant_id` session variable                        |
| **User Ownership** | Service-layer `userId` check (RLS enforces tenant, not user isolation)       |

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)

### Critical Path

```
FFP-124 → FFP-125 → FFP-127 → FFP-128 → FFP-129 → FFP-130 → FFP-133 → FFP-131
(Template)  (Flow)   (User)   (Start)   (Save)   (Submit)  (Score)  (Results)
   ✅         ✅        ✅        ✅        ✅        ✅        ✅      (next)
```

### Sprint Overview

| Sprint | Focus                | Pts | Status      |
| ------ | -------------------- | --- | ----------- |
| 3      | Backend Foundation   | 24  | ✅ Complete |
| 4      | APIs & FE Foundation | 23  | ✅ Complete |
| 5      | Results & FE Core    | 23  | 📋 Ready    |
| 6      | FE Completion        | 14  | Future      |

---

## Key Architectural Decisions

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Repository → Schema`

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});
```

**JWT Claims**: `custom:tenantId`, `custom:customerId`, `custom:role`

### Frontend Architecture

- React 18 with arrow function components
- Zod schemas as single source of truth
- TanStack Query for server state
- React Context + useReducer for form state

---

## Working Infrastructure

**Deployed**: SST v3 Ion, Cognito, S3 + CloudFront, API Gateway, PostgreSQL (local) with RLS

**Packages**: `@ffp/web`, `@ffp/functions`, `@ffp/core`, `@ffp/database`

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 504 tests passing

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Sprint**: 5 of 6 (Assessment Engine)
**Velocity**: ~25 pts/sprint
**Capacity**: 8 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- 🚀 FFP-2: Assessment Engine (Sprints 3-6)
- ⏳ FFP-3: Programme Generation
- ⏳ FFP-4: Video Management

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
