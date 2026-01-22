# FFP - Project State

**Last Updated**: 22nd January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 5 🚀 In Progress
**Previous**: Sprint 4 ✅ Complete

---

## In Progress: Sprint 5 - Results & Frontend Core (23 pts)

**Dates**: 26th January - 15th February 2026
**Branch**: `feature/sprint5` (story branches off main)
**Sprint Goal**: Assessment results API, programme generation, frontend components for assessment flow.
**Analysis**: See `sprint-planning/outputs/sprint-5-analysis-report.md`

### Sprint 5 Stories

| Key     | Story                                | Pts | Status      | Dependencies        |
| ------- | ------------------------------------ | --- | ----------- | ------------------- |
| FFP-138 | Assessment Progress Bar Component    | 2   | ✅ Complete | FFP-135 ✅          |
| FFP-131 | Get Assessment Results API           | 3   | 🚀 Active   | FFP-133 ✅          |
| FFP-134 | Programme Generation Service         | 5   | ⏳ Blocked  | FFP-131             |
| FFP-136 | TanStack Query Hooks for Assessments | 5   | ⏳ Blocked  | FFP-135 ✅, FFP-131 |
| FFP-139 | Question Renderer Components         | 8   | ⏳ Blocked  | FFP-135 ✅, FFP-136 |

### Current Progress: 2/23 pts (9%)

### Recommended Next Steps

1. ~~**FFP-138** (2 pts) - Independent, quick win~~ ✅ Complete
2. **FFP-131** (3 pts) - Unblocks FFP-134 and FFP-136, critical path ← **IN PROGRESS**
3. **FFP-136** (5 pts) - TanStack setup, unblocks FFP-139
4. **FFP-139** (8 pts) - Largest story, benefits from hooks
5. **FFP-134** (5 pts) - Can parallel with FFP-139

---

## FFP-131 Implementation Plan: Get Assessment Results API

**Branch**: `feature/ffp-131-get-results-api`
**PR Strategy**: Single PR for all sub-tasks (tightly coupled, ~100 lines total)

### Sub-task Execution Order

| #   | Key     | Task                                  | Est. Lines | Notes                                     |
| --- | ------- | ------------------------------------- | ---------- | ----------------------------------------- |
| 1   | FFP-174 | Zod schema for results response       | ~15        | ✅ Complete - simple nullable approach    |
| 2   | FFP-175 | `getAssessmentResults` service method | ~40        | Status check, return appropriate response |
| 3   | FFP-176 | `get-results.ts` Lambda handler       | ~25        | Standard pattern, extract context + ID    |
| -   | FFP-177 | Unit tests                            | DEFERRED   | Not essential for MVP                     |

### Adjustments from Jira Tickets

1. **Schema naming**: Use `userAssessmentScoresSchema` (not `assessmentScoreSchema`)
2. **British English**: Use `programmeId` (not `programId`)
3. **Repository naming**: Use `userAssessmentRepository` (not `assessmentRepository`)

### Implementation Details

**FFP-174 - Schema** (`packages/core/src/schemas/user-assessment.schema.ts`):

```typescript
// Simple nullable approach - works with any assessment status
assessmentResultsResponseSchema = z.object({
  status: userAssessmentStatusSchema,
  scores: userAssessmentScoresSchema.nullable(),
  programmeId: z.string().uuid().nullable(),
});
```

**FFP-175 - Service** (`packages/core/src/assessments/assessment.service.ts`):

- Check assessment status: `submitted` → processing, `scored`/`completed` → complete
- Return 404 for missing/other tenant (RLS enforced)
- Return 400 for not-yet-submitted assessments

**FFP-176 - Handler** (`packages/functions/src/assessments/get-results.ts`):

- `GET /assessments/:id/results`
- Standard pattern: `withErrorHandling`, `extractUserContext`

### Acceptance Criteria Mapping

| AC  | Description                      | Implementation                                                                           |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| AC1 | Returns null while processing    | Service returns `{ status: 'processing', scores: null }` when status='submitted'         |
| AC2 | Returns scores when complete     | Service returns `{ status: 'complete', scores: {...} }` when status='scored'/'completed' |
| AC3 | Returns programme recommendation | Include `programmeId` in response (nullable)                                             |
| AC4 | Tenant isolation enforced        | RLS via `userAssessmentRepository.findById()` returns null for other tenants             |

### Dependencies

- ✅ FFP-130 (Submit Assessment API) - Complete
- ✅ FFP-133 (Scoring Service) - Complete

### Verification

```bash
pnpm typecheck --filter=@ffp/core
pnpm typecheck --filter=@ffp/functions
pnpm build
```

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
