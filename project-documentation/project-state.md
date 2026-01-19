# FFP - Project State

**Last Updated**: 19th January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 4 in progress | FFP-133 ✅ | FFP-126 ✅ | FFP-135 Planned
**Previous**: Sprint 3 ✅ Complete

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
| 2     | FFP-126 | Assessment Template Admin API   | 5   | ✅ Complete | CRUD for system admins               |
| 3     | FFP-135 | Assessment Context & State Mgmt | 5   | To Do       | Frontend foundation                  |

**Progress**: 18/23 pts complete (78%) - FFP-135 remaining

---

## ✅ Completed: FFP-126 - Assessment Template Admin API

**Story Points**: 5
**Status**: ✅ Complete (19th January 2026)
**Branch**: `feature/ffp-126-assessment-template-admin-api`

### What Was Built

CRUD API endpoints for system admins to manage assessment templates:

| Method | Path                                        | Handler             | Role Required     |
| ------ | ------------------------------------------- | ------------------- | ----------------- |
| GET    | `/admin/assessment-templates`               | list-templates      | Any authenticated |
| GET    | `/admin/assessment-templates/:id`           | get-template        | Any authenticated |
| POST   | `/admin/assessment-templates`               | create-template     | system_admin      |
| PUT    | `/admin/assessment-templates/:id`           | update-template     | system_admin      |
| DELETE | `/admin/assessment-templates/:id`           | deactivate-template | system_admin      |
| POST   | `/admin/assessment-templates/:id/duplicate` | duplicate-template  | system_admin      |

### Key Files

- **Service**: `@ffp/core/src/assessments/template.service.ts`
- **Handlers**: `@ffp/functions/src/admin/templates/*.ts`
- **Manual Testing Guide**: `project-documentation/refactoring/testing/manual-testing-guide-template-admin-api.md`

### Implementation Notes

1. **Thin service layer** - Repository handles most logic; service adds createdBy resolution and input validation
2. **scoringConfig removed** - Deprecated field removed from templates (scoring now at flow level)
3. **User ID resolution** - Fixed bug where Cognito sub was used instead of database user ID for `createdBy`
4. **Question management deferred** - FFP-251 created for template-question association endpoints

### Manual Testing Complete (19th January 2026)

| Test  | Description              | Status |
| ----- | ------------------------ | ------ |
| TC-01 | List all templates       | ✓ Pass |
| TC-02 | List active only         | ✓ Pass |
| TC-03 | Get template w/questions | ✓ Pass |
| TC-04 | 404 for non-existent     | ✓ Pass |
| TC-05 | Create new template      | ✓ Pass |
| TC-06 | 403 for non-admin        | ✓ Pass |
| TC-07 | Update template          | ✓ Pass |
| TC-08 | Duplicate template       | ✓ Pass |
| TC-09 | Deactivate (soft delete) | ✓ Pass |

---

## ✅ Completed: FFP-133 - Scoring Service Implementation

**Story Points**: 8
**Status**: ✅ Complete (18th January 2026)
**Branch**: `refactor/flow-level-scoring` (merged)

### What Was Built

- Multi-dimensional scoring with weighted dimensions
- Flow-level `scoringConfig` (migrated from templates)
- Normalised `flow_steps` table with branching rules
- Branching evaluation (`goto_step`, `show_warning` actions)
- Clinical questions: back pain history + red flag screening
- Warning system for clinical alerts with audit trail

### Manual Testing Complete

| Test  | Description                  | Status |
| ----- | ---------------------------- | ------ |
| TC-01 | Start Assessment             | ✓ Pass |
| TC-02 | Pre-Assessment Questions     | ✓ Pass |
| TC-03 | Red Flag with `show_warning` | ✓ Pass |
| TC-04 | Resume Assessment            | ✓ Pass |
| TC-05 | Submit Assessment            | ✓ Pass |
| TC-06 | `goto_step` branching        | ✓ Pass |
| LF-\* | Linear flow (7 steps)        | ✓ Pass |

---

## Next: FFP-135 - Assessment Context & State Management

**Story Points**: 5
**Status**: To Do
**Priority**: Frontend foundation
**Branch**: `feature/ffp-135-assessment-context`

### Implementation Plan

**Single PR** - All sub-tasks target one file: `packages/web/src/contexts/AssessmentContext.tsx`

| Order | Key     | Summary                     | Status      | Notes                                |
| ----- | ------- | --------------------------- | ----------- | ------------------------------------ |
| 1     | FFP-193 | Define TypeScript types     | ✅ Complete | Foundation - types for state/actions |
| 2     | FFP-194 | Implement assessmentReducer | ✅ Complete | State transitions                    |
| 3     | FFP-195 | Create Context and Provider | ✅ Complete | React Context + useReducer           |
| 4     | FFP-196 | Create useAssessment hook   | To Do       | Consumer hook with error handling    |
| 5     | FFP-197 | Unit tests for reducer      | DEFERRED    | Per MVP testing policy               |

### Corrections from Jira (Outdated Requirements)

**Phase Type** - Jira specified outdated phase values. Use `FlowStepType` from `@ffp/core`:

```typescript
// CORRECT (from @ffp/core via @ffp/database constants)
type: 'intro' | 'questions' | 'transition' | 'video-assessment' | 'results' | 'programme-overview';

// OUTDATED (in Jira FFP-193)
phase: 'intro' | 'pre-assessment' | 'transition' | 'physical-assessment' | 'results' | 'programme';
```

**Score Type** - Use `UserAssessmentScores` from `@ffp/core` (not `AssessmentScore`).

**Steps Array** - Store `FlowStepSummary[]` from `StartAssessmentResponse` for navigation.

### Updated State Shape

```typescript
interface AssessmentState {
  flowId: string;
  assessmentId: string | null;
  currentStep: number;
  currentStepId: string | null; // Added: UUID-based navigation
  totalSteps: number;
  steps: FlowStepSummary[]; // Added: from StartAssessmentResponse
  phase: FlowStepType; // Corrected: use FlowStepType
  answers: Record<string, UserAnswer>; // Corrected: use UserAnswer type
  isDirty: boolean;
  scores: UserAssessmentScores | null; // Corrected: use UserAssessmentScores
  warnings: AssessmentWarning[]; // Added: for branching warnings
}
```

### Key Imports (from @ffp/core)

```typescript
import {
  FlowStepType,
  FlowStepSummary,
  UserAssessmentScores,
  UserAnswer,
  AssessmentWarning,
} from '@ffp/core';
```

### Dependency Note

`@ffp/web` imports from `@ffp/core` only (never `@ffp/database`).
Dependency flow: `@ffp/database` → `@ffp/core` → `@ffp/web` / `@ffp/functions`

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

## ✅ Completed: FFP-130 - Submit Assessment API

**Story Points**: 5
**Branch**: `feature/ffp-130-submit-assessment-api` (merged)

- `POST /assessments/:id/submit` endpoint
- Validates required questions, transitions to `submitted`
- Enqueues `score_assessment` job
- Includes questions table refactor (JSONB → dedicated tables)

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)

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
