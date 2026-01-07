# FFP - Project State

**Last Updated**: 7th January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 4 in progress | FFP-133 Scoring Service 🚧 (3/5 sub-tasks complete)
**Previous**: Sprint 3 ✅ Complete | FFP-130 Submit API ✅ Complete

---

## Active: Sprint 4 - APIs & FE Foundation (23 pts)

**Dates**: 4th - 25th January 2026
**Branch**: `feature/sprint4`
**Sprint Goal**: Complete assessment lifecycle APIs, scoring logic implemented, frontend state ready.

### Sprint 4 Stories

| Order | Key     | Story                           | Pts | Status         | Notes                               |
| ----- | ------- | ------------------------------- | --- | -------------- | ----------------------------------- |
| -     | FFP-130 | Submit Assessment API           | 5   | ✅ Complete    | Merged from Sprint 3 early work     |
| 1     | FFP-133 | Scoring Service Implementation  | 8   | 🚧 In Progress | Critical path - enables results API |
| 2     | FFP-126 | Assessment Template Admin API   | 5   | To Do          | CRUD for system admins              |
| 3     | FFP-135 | Assessment Context & State Mgmt | 5   | To Do          | Frontend foundation                 |

**Progress**: 5/23 pts complete (22%) - FFP-133 in progress

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

## Current Task: FFP-133 - Scoring Service Implementation

**Story Points**: 8
**Status**: In Progress
**Priority**: Critical Path
**Branch**: `feature/ffp-133-scoring-service`

### Acceptance Criteria

1. Dimension scores calculated from answers (strength, balance)
2. Single-choice questions scored correctly
3. Multi-choice questions sum scores
4. Scale/numeric questions use value directly
5. Video-response questions scored via response config
6. Risk level calculated from lowest dimension (>=70% low, >=40% moderate, <40% high)
7. Programme recommendation selected based on condition evaluation
8. Scores stored on assessment, status transitioned to `scored`

### Implementation Plan

**Branch Strategy**: Single branch (`feature/ffp-133-scoring-service`) with incremental commits per sub-task.

**Sub-Tasks Execution Order**:

| Order | Key     | Summary                                              | Status      | Commit Scope                   |
| ----- | ------- | ---------------------------------------------------- | ----------- | ------------------------------ |
| 1     | FFP-188 | Create `calculateScores()` orchestrator              | ✅ Complete | `scoring/` module + types      |
| 2     | FFP-189 | Implement `calculateQuestionScore()` handler         | ✅ Complete | `helpers/question-scoring.ts`  |
| 3     | FFP-190 | Add `calculateRiskLevel()` + `findMatchingProgram()` | ✅ Complete | `helpers/risk-level.ts` + more |
| 4     | FFP-191 | Create `processScoreAssessment` job handler          | 🚧 Next     | `jobs/handlers/` + integration |
| 5     | FFP-192 | Add minimal unit tests (critical paths only)         | To Do       | `scoring.service.test.ts`      |

**Schema Alignment** (adapting to existing):

- Use existing `scoreAssessmentResultSchema` from `job.schema.ts`
- Use existing `dimensionalScoreSchema` structure
- Use existing `scoreAssessmentPayloadSchema` (responses array format)

**Key Adaptations from Jira Tickets**:

1. Questions fetched via `findByTemplateId()` (not embedded in template)
2. Job payload uses `responses[]` array (not `Record<string, unknown>`)
3. Result uses `dimensionalScoreSchema` structure
4. Handler in `@ffp/core/src/jobs/handlers/score-assessment.handler.ts` (new directory)

### Technical Approach

**Location**: `@ffp/core/src/assessments/scoring/`

```
scoring/
├── index.ts                  # Barrel export
├── scoring.service.ts        # Main orchestrator
└── helpers/
    ├── index.ts              # Barrel export
    ├── question-scoring.ts   # calculateQuestionScore
    ├── risk-level.ts         # calculateRiskLevel, getCategoryFromScore
    ├── programme-matching.ts # findMatchingProgramme
    └── dimension-scoring.ts  # calculateDimensionScore, calculateOverallScore
```

**Key Functions** (all implemented ✅):

- `calculateScores(responses, questions, scoringConfig)` → ScoringResult
- `calculateQuestionScore(question, answerValue)` → number
- `calculateRiskLevel(dimensionScores)` → RiskLevel (throws if empty)
- `findMatchingProgramme(scores, programMappings)` → programTemplateId | null

**Supporting Infrastructure**:

- Types: `@ffp/core/src/types/scoring.types.ts` (RiskLevel, ScoringResult)
- Constants: `@ffp/core/src/constants/scoring.constants.ts` (thresholds, operators)

**Testing Strategy** (MVP minimal):

| Test Category          | Include | Reason                         |
| ---------------------- | ------- | ------------------------------ |
| Question type scoring  | ✅      | Core calculation correctness   |
| Risk level thresholds  | ✅      | Critical safety/business logic |
| Programme matching     | ✅      | User-facing recommendation     |
| Edge cases             | ❌      | Post-MVP enhancement           |
| Full integration tests | ❌      | Job processor already tested   |

**Estimated**: ~10-15 focused tests

### Verification Workflow

After all sub-tasks complete:

1. **Seed Data**: Update assessment seed data with scoring config
2. **Postman Collection**: Add/update requests for scoring flow
3. **Manual Testing**: End-to-end via Postman (submit → poll → verify scores)
4. **Code Review**: Claude review before PR
5. **PR**: To `feature/sprint4` with Copilot review

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
   ✅         ✅        ✅        ✅        ✅        ✅        🚧
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
