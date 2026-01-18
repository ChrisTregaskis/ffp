# FFP - Project State

**Last Updated**: 18th January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 4 in progress | FFP-133 Scoring Service ✅ Complete | FFP-126 next
**Previous**: Sprint 3 ✅ Complete | FFP-130 Submit API ✅ Complete

---

## Active: Sprint 4 - APIs & FE Foundation (23 pts)

**Dates**: 4th - 25th January 2026
**Branch**: `feature/sprint4`
**Sprint Goal**: Complete assessment lifecycle APIs, scoring logic implemented, frontend state ready.

### Sprint 4 Stories

| Order | Key     | Story                           | Pts | Status      | Notes                                |
| ----- | ------- | ------------------------------- | --- | ----------- | ------------------------------------ |
| -     | FFP-130 | Submit Assessment API           | 5   | ✅ Complete | Merged from Sprint 3 early work      |
| 1     | FFP-133 | Scoring Service Implementation  | 8   | ✅ Complete | Flow-level refactor + manual testing |
| 2     | FFP-126 | Assessment Template Admin API   | 5   | To Do       | CRUD for system admins               |
| 3     | FFP-135 | Assessment Context & State Mgmt | 5   | To Do       | Frontend foundation                  |

**Progress**: 13/23 pts complete (57%) - FFP-126 next

### Implementation Order Rationale

1. **FFP-133 (Scoring)** - Must complete first
   - Critical path: completes backend assessment lifecycle
   - Pure functions, highly testable
   - Job processor ready from Sprint 3
   - Required before FFP-131 (Results API) in Sprint 5

2. **FFP-126 (Template Admin)** - Backend completion
   - Independent of scoring
   - Builds on existing template repository
   - Enables admin management of templates

3. **FFP-135 (Assessment Context)** - Frontend foundation
   - Best after backend is solid
   - React Context + useReducer pattern
   - Prepares for Sprint 5 UI components

---

## ✅ Completed: FFP-133 - Scoring Service Implementation

**Story Points**: 8
**Status**: ✅ Complete
**Priority**: Critical Path
**Branch**: `refactor/flow-level-scoring` (merged)

### Acceptance Criteria - All Met ✅

1. ✅ Dimension scores calculated from answers (strength, balance)
2. ✅ Single-choice questions scored correctly
3. ✅ Multi-choice questions sum scores
4. ✅ Scale/numeric questions use value directly
5. ✅ Video-response questions scored via response config
6. ✅ Risk level calculated from lowest dimension (>=70% low, >=40% moderate, <40% high)
7. ✅ Programme recommendation selected based on condition evaluation
8. ✅ Scores stored on assessment, status transitioned to `scored`

### Sub-Tasks - All Complete

| Order | Key     | Summary                                              | Status      |
| ----- | ------- | ---------------------------------------------------- | ----------- |
| 1     | FFP-188 | Create `calculateScores()` orchestrator              | ✅ Complete |
| 2     | FFP-189 | Implement `calculateQuestionScore()` handler         | ✅ Complete |
| 3     | FFP-190 | Add `calculateRiskLevel()` + `findMatchingProgram()` | ✅ Complete |
| 4     | FFP-191 | Create `processScoreAssessment` job handler          | ✅ Complete |
| 5     | FFP-192 | Add minimal unit tests (critical paths only)         | ✅ Complete |

### Flow-Level Scoring Refactor (Major Enhancement)

**Discovered**: 8th January 2026 | **Resolved**: 18th January 2026 (10 sessions)

Multi-template assessment flows required architectural refactor:

- ✅ Schema migration: `scoringConfig` moved from templates to flows
- ✅ Normalised `flow_steps` table with branching rules
- ✅ Clinical questions: back pain history + red flag screening
- ✅ Branching evaluation service with `goto_step` and `show_warning` actions
- ✅ Warning system for clinical alerts with audit trail
- ✅ Submit validation now checks visited steps only (TF-002 fix)
- ✅ 629 tests passing, TypeScript/lint clean

### Manual Testing Complete (18th January 2026)

**Guide**: `project-documentation/refactoring/testing/manual-testing-guide-assessments.md`
**Results**: `project-documentation/refactoring/testing/handover-testing-complete.md`

| Test  | Description                  | Status |
| ----- | ---------------------------- | ------ |
| TC-01 | Start Assessment             | ✓ Pass |
| TC-02 | Pre-Assessment Questions     | ✓ Pass |
| TC-03 | Red Flag with `show_warning` | ✓ Pass |
| TC-04 | Resume Assessment            | ✓ Pass |
| TC-05 | Submit Assessment            | ✓ Pass |
| TC-06 | `goto_step` branching        | ✓ Pass |
| LF-\* | Linear flow (7 steps)        | ✓ Pass |

**Key Branching Tests**:

- `show_warning`: Warning triggered correctly for red flag answers
- `goto_step`: Conditional navigation skips steps based on answers

---

## Next Task: FFP-126 - Assessment Template Admin API

**Story Points**: 5
**Status**: To Do
**Priority**: Backend completion

### Scope

CRUD operations for system admins to manage assessment templates:

- Create, read, update, delete assessment templates
- Template validation (scoring config, question mappings)
- Admin-only access (system_admin role)

---

## Completed: Sprint 3 - Backend Foundation (24 pts + 3 early) ✅

**Status**: ✅ Complete (merged)
**Branch**: `feature/sprint3`

| Key     | Story                                      | Pts |
| ------- | ------------------------------------------ | --- |
| FFP-124 | Assessment Template Schema & Repository    | 5   |
| FFP-132 | Process Jobs Schema & Queue Infrastructure | 8   |
| FFP-125 | Assessment Flow Schema & Configuration     | 3   |
| FFP-127 | User Assessment Schema & State Machine     | 5   |
| FFP-128 | Start Assessment API                       | 3   |
| FFP-129 | Save Assessment Progress API (early)       | 3   |

**Sprint Goal**: All database schemas migrated, job queue ready, users can start assessments. ✅ ACHIEVED

### Key Patterns Established

| Area               | Decision                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| **State Machine**  | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`)            |
| **Job Queue**      | Database-driven polling with `FOR UPDATE SKIP LOCKED`, exponential backoff              |
| **Flow Steps**     | `intro`, `questions`, `transition`, `video-assessment`, `results`, `programme-overview` |
| **RLS Pattern**    | Tenant isolation via `app.tenant_id` session variable                                   |
| **User Ownership** | Service-layer `userId` check (RLS enforces tenant, not user isolation)                  |
| **Router**         | Regex-based pattern matching with parameter extraction for dynamic routes               |

### Key File Locations

- **Schemas**: `@ffp/database/src/schema/` (assessment-templates, assessment-flows, user-assessments, process-jobs, questions, template-questions, user-assessment-answers)
- **Repositories**: `@ffp/core/src/assessments/` and `@ffp/core/src/questions/`
- **Services**: `@ffp/core/src/assessments/assessment.service.ts`
- **Job Queue**: `@ffp/core/src/jobs/` (job-queue.service.ts, job-processor.service.ts)
- **Handlers**: `@ffp/functions/src/assessments/`

---

## Completed: FFP-130 - Submit Assessment API ✅

**Branch**: `feature/ffp-130-submit-assessment-api` (merged to feature/sprint3)
**Story Points**: 5

### What Was Built

- `POST /assessments/:id/submit` endpoint
- Validates required questions answered
- Merges final answers, transitions to `submitted`
- Enqueues `score_assessment` job
- Returns `{ jobId, message }` for polling

### Questions Table Refactor (Part of FFP-130)

Refactored questions from embedded JSONB into dedicated tables:

- `questions` table with proper schema
- `template_questions` join table
- `user_assessment_answers` table with RLS
- All repositories and services updated
- 466 tests passing

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)
**Full Sprint Plan**: `project-documentation/sprint-planning/outputs/assessment-engine-sprint-plan.md`

### Critical Path

```
FFP-124 → FFP-125 → FFP-127 → FFP-128 → FFP-129 → FFP-130 → FFP-133 → FFP-131
(Template)  (Flow)   (User)   (Start)   (Save)   (Submit)  (Score)  (Results)
   ✅         ✅        ✅        ✅        ✅        ✅        ✅
```

### Sprint Overview

| Sprint | Focus                | Pts | Status      |
| ------ | -------------------- | --- | ----------- |
| 3      | Backend Foundation   | 24  | ✅ Complete |
| 4      | APIs & FE Foundation | 23  | In Progress |
| 5      | Results & FE Core    | 23  | Future      |
| 6      | FE Completion        | 14  | Future      |

### Sprint 5 Preview: Results + Frontend Core (23 pts)

| Key     | Story                                | Pts |
| ------- | ------------------------------------ | --- |
| FFP-131 | Get Assessment Results API           | 3   |
| FFP-134 | Programme Generation Service         | 5   |
| FFP-136 | TanStack Query Hooks for Assessments | 5   |
| FFP-139 | Question Renderer Components         | 8   |
| FFP-138 | Assessment Progress Bar Component    | 2   |

---

## Key Architectural Decisions

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Entity → Repository → Schema`

**Request Context Pattern**:

```typescript
interface RequestContext {
  db: DrizzleClient;
  tenantId: string;
  customerId: string;
  userId: string;
  role: UserRole;
}
```

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

- React 18 with arrow function components (`const Component: React.FC = () => {}`)
- Zod schemas as single source of truth
- TanStack Query for server state
- React Context + useReducer for form state

---

## Working Infrastructure

**Deployed**: SST v3 Ion, Cognito, S3 + CloudFront, API Gateway, PostgreSQL (local) with RLS

**Packages**: `@ffp/web`, `@ffp/functions`, `@ffp/core`, `@ffp/database`

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 466 tests, 8% coverage

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Sprint**: 4 of 6 (Assessment Engine)
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
