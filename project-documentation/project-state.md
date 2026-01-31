# FFP - Project State

**Last Updated**: 30th January 2026
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

| Key     | Story                                | Pts | Status      | Dependencies           |
| ------- | ------------------------------------ | --- | ----------- | ---------------------- |
| FFP-138 | Assessment Progress Bar Component    | 2   | ✅ Complete | FFP-135 ✅             |
| FFP-131 | Get Assessment Results API           | 3   | ✅ Complete | FFP-133 ✅             |
| FFP-136 | TanStack Query Hooks for Assessments | 5   | ✅ Complete | FFP-135 ✅, FFP-131 ✅ |
| FFP-134 | Programme Generation Service         | 5   | 📋 Ready    | FFP-131 ✅             |
| FFP-139 | Question Renderer Components         | 8   | ✅ Complete | FFP-135 ✅, FFP-136 ✅ |

### Current Progress: 18/23 pts (78%) - FFP-134 in progress

### Recommended Next Steps

1. ~~**FFP-138** (2 pts) - Independent, quick win~~ ✅ Complete
2. ~~**FFP-131** (3 pts) - Unblocks FFP-134 and FFP-136, critical path~~ ✅ Complete
3. ~~**FFP-136** (5 pts) - TanStack setup, unblocks FFP-139~~ ✅ Complete
4. ~~**FFP-139** (8 pts) - Question renderers~~ ✅ Complete
5. **FFP-134** (5 pts) - Programme Generation Service 🚀 **IN PROGRESS**

---

## FFP-134 Implementation Plan: Programme Generation Service

**Branch**: `feature/ffp-134-programme-generation`
**PR Strategy**: Single branch, single PR for all sub-tasks
**Tests**: Deferred to MVP launch

### Overview

Create the programme generation service that runs after assessment scoring. When a `score_assessment` job completes, it enqueues a `generate_program` job. The programme service selects a template based on scored dimensions, creates a `programmes` record, links it to the user assessment, and transitions status to `completed`.

**MVP Scope**: Template-based selection only. No exercise catalogue integration, no programme customisation. First assessment generates a programme; retake assessments skip generation (scoring only).

### Existing Infrastructure (~60% complete)

| Component                              | Status    | Location                                                          |
| -------------------------------------- | --------- | ----------------------------------------------------------------- |
| `generate_program` job type enum       | ✅ Exists | `@ffp/database` process_jobs schema                               |
| `GenerateProgramPayload` schema        | ✅ Exists | `@ffp/core/src/schemas/job.schema.ts:98`                          |
| `GenerateProgramResult` schema         | ✅ Exists | `@ffp/core/src/schemas/job.schema.ts:133`                         |
| `findMatchingProgramme()` helper       | ✅ Exists | `@ffp/core/src/assessments/scoring/helpers/programme-matching.ts` |
| `user_assessments.programmeId` column  | ✅ Exists | Nullable UUID, FK placeholder (no constraint yet)                 |
| `JobPayloadMap` mapping                | ✅ Exists | `job-queue.service.ts` maps `generate_program`                    |
| Job processor concurrency config       | ✅ Exists | `generate_program: 3` max concurrent                              |
| Score assessment handler               | ✅ Exists | Sets `status: 'scored'`, does NOT enqueue generate_program        |
| `ScoringResult.recommendedProgrammeId` | ✅ Exists | `@ffp/core/src/types/scoring.types.ts:35`                         |

### What Needs Creating

| Component                                                      | Location                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| `programmes` table schema                                      | `@ffp/database/src/schema/programmes.ts`                  |
| Programme status enum                                          | `@ffp/database/src/schema/programmes.ts`                  |
| FK constraint `user_assessments.programmeId` → `programmes.id` | Migration                                                 |
| Programme Zod schemas                                          | `@ffp/core/src/schemas/programme.schema.ts`               |
| Programme repository (RLS)                                     | `@ffp/core/src/programmes/programme.repository.ts`        |
| Programme service                                              | `@ffp/core/src/programmes/programme.service.ts`           |
| `processGenerateProgram` handler                               | `@ffp/core/src/jobs/handlers/generate-program.handler.ts` |
| Enqueue `generate_program` after scoring                       | Modify `score-assessment.handler.ts`                      |

### Sub-task Execution Order

| #   | Session | Key     | Task                                                         | Status                         |
| --- | ------- | ------- | ------------------------------------------------------------ | ------------------------------ |
| 1   | 1       | FFP-183 | Programmes table schema, enum, migration, Zod schemas        | ✅ Complete                    |
| 2   | 1       | FFP-184 | Programme repository with RLS (`withRLS()` pattern)          | 📋 Ready                       |
| 3   | 2       | FFP-185 | Programme generation service logic                           | 📋 Ready                       |
| 4   | 2       | FFP-186 | Job handler + scoring integration + assessment status update | 📋 Ready                       |
| 5   | 3       | -       | Leg pain seed data + programme mapping for manual testing    | 📋 Ready                       |
| -   | -       | FFP-187 | Unit tests                                                   | 🚫 Abandoned (deferred to MVP) |

### Session Breakdown

**Session 1: Data Layer** (FFP-183 + FFP-184)

- Create `programmes` table in `@ffp/database` with: `id`, `tenant_id`, `user_id`, `programme_template_id`, `name`, `description`, `status`, `metadata` (JSONB), timestamps
- Create `programme_status` enum: `active`, `paused`, `completed`, `archived`
- Add FK constraint from `user_assessments.programmeId` → `programmes.id`
- Generate and review migration
- Create Zod schemas in `@ffp/core/src/schemas/programme.schema.ts`
- Create programme repository in `@ffp/core/src/programmes/programme.repository.ts`
- Methods: `create()`, `findByUserId()`, `findById()`
- All queries use `withRLS()` pattern (not raw `setRLSContext`)
- Export barrel files, verify typecheck + build

**Session 2: Logic Layer** (FFP-185 + FFP-186)

- Create `generateProgramme()` in `@ffp/core/src/programmes/programme.service.ts`
- MVP logic: check for existing active programme → if exists, return existing ID (retake path) → if not, create new programme from `recommendedProgrammeId`
- Create `processGenerateProgram` handler following `processScoreAssessment` pattern
- Modify `score-assessment.handler.ts` to enqueue `generate_program` job after scoring completes
- Handler updates `user_assessments`: set `programmeId`, `status: 'completed'`, `completedAt`
- Register handler in job processor dispatch
- Verify full flow: submit → score → generate_program → completed

**Session 3: Leg Pain Seed Data** (manual testing support)

Add a second assessment path so different scores produce different programme recommendations.

- Add `leg` option to `pain-area` question (currently only `back` and `other`)
- Create ~5 leg pain questions (Thigh/Shin/Calf) using `scoreDimension: 'mobility'` (existing enum, currently unused)
  - `leg-pain-location` (single-choice): Primary leg pain area
  - `leg-pain-duration` (single-choice): Duration of leg pain
  - `leg-pain-intensity` (scale): 0-10 intensity
  - `leg-walking-difficulty` (single-choice): Impact on walking/movement
  - `leg-range-of-motion` (single-choice): Flexibility/range assessment
- Create `LEG_PAIN_GENERAL` assessment template + template-question join records
- Create leg pain flow step (order 3, same tier as back pain)
- Update branching rules: `pain-area = 'leg'` → leg pain step, `pain-area = 'back'` → back pain step (existing), `pain-area = 'other'` → red flags (existing)
- Add `mobility` dimension to flow scoring config with leg question IDs, weight, maxScore, riskThresholds
- Add `leg-rehabilitation-programme` to programme mappings (triggered by mobility scores)
- Re-run `pnpm seed:db` to apply

**Testing outcome**: Back pain path → `pain` dimension scores → back-related programme. Leg pain path → `mobility` dimension scores → `leg-rehabilitation-programme`. Different assessment paths produce different programme recommendations.

### Key Amendments from Jira Tickets

The Jira sub-tasks were created Dec 2025. These amendments reflect the actual codebase state:

1. **Repository pattern**: Tickets show `db.transaction()` + `setRLSContext()`. Actual pattern is `getDb()` + `withRLS(db, tenantId, userId?, callback)`. Follow current pattern.
2. **No template repository**: FFP-185 references `templateRepository` which doesn't exist. For MVP, `recommendedProgrammeId` from scoring is the template reference. No separate template CRUD needed.
3. **Scoring field name**: Tickets reference `scores.programRecommendation`. Actual field is `ScoringResult.recommendedProgrammeId`.
4. **Job chaining missing**: Score assessment handler does NOT enqueue `generate_program`. FFP-186 must add this (modify `score-assessment.handler.ts` or job completion flow).
5. **GenerateProgramResult simplification**: Existing schema expects `exercises[]`, `sessionsPerWeek`, `durationWeeks`. For MVP, populate with defaults or simplify. Exercise catalogue integration is out of scope.
6. **Directory naming**: Tickets say `programs/`. Use `programmes/` (British English) for `@ffp/core` domain directory.

### Acceptance Criteria (from parent FFP-134)

| AC  | Requirement                                            | Covered By       |
| --- | ------------------------------------------------------ | ---------------- |
| AC1 | Programme created from template based on scores        | FFP-185, FFP-186 |
| AC2 | `user_assessment.programmeId` references new programme | FFP-186          |
| AC3 | Assessment `status=completed` and `completedAt` set    | FFP-186          |
| AC4 | Retake assessment skips programme generation           | FFP-185          |
| AC5 | Tenant isolation (RLS enforced)                        | FFP-183, FFP-184 |

### Dependencies

- ✅ FFP-133 (Scoring Service) - provides `ScoringResult` with `recommendedProgrammeId`
- ✅ FFP-131 (Results API) - returns `programmeId` to client
- ✅ FFP-132 (Job Queue) - provides job infrastructure

### Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
# Manual: Submit assessment → verify score_assessment → generate_program → completed
```

---

## Completed This Sprint

### FFP-139: Question Renderer Components ✅

**Branch**: `feature/ffp-139-question-renderers` (merged)
**Key deliverables**: QuestionRenderer factory, SingleChoice, MultiChoice, Numeric, Scale, Text, VideoResponse components
**Pattern**: Common `QuestionComponentProps` interface, dispatches `SET_ANSWER` to AssessmentContext

### FFP-136: TanStack Query Hooks ✅

**Branch**: `feature/ffp-136-tanstack-hooks` (merged)
**Key deliverables**: API client infrastructure, assessment hooks
**Files**: `lib/api/client/`, `lib/api/endpoints/`, `hooks/assessments/`

### FFP-131: Get Assessment Results API ✅

**Endpoint**: `GET /assessments/:id/results`
**Pattern**: Simple nullable approach - `scores` and `programmeId` null until scoring completes

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
