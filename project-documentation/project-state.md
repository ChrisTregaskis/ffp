# FFP - Project State

**Last Updated**: 21st February 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 6 - Frontend Completion (Early Start)
**Note**: Starting sprint 6 stories early; committed dates unchanged (16th Feb - 8th Mar)

---

## Completed: Sprint 5 - Results & Frontend Core (23 pts) ✅

**Dates**: 26th January - 15th February 2026 (completed 4th Feb, merged 6th Feb)
**Sprint Goal**: Assessment results API, programme generation, frontend components for assessment flow.

| Key     | Story                                | Pts | Summary                                                  |
| ------- | ------------------------------------ | --- | -------------------------------------------------------- |
| FFP-138 | Assessment Progress Bar Component    | 2   | Visual progress indicator for assessment flow            |
| FFP-131 | Get Assessment Results API           | 3   | `GET /assessments/:id/results` with nullable scores      |
| FFP-136 | TanStack Query Hooks for Assessments | 5   | API client infrastructure, assessment hooks              |
| FFP-134 | Programme Generation Service         | 5   | Job handler, `programmes` table, retake detection        |
| FFP-139 | Question Renderer Components         | 8   | 6 question types: SingleChoice, MultiChoice, Scale, etc. |

### Key Patterns Established

| Area                   | Decision                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| **Programme Gen**      | `score_assessment` → `generate_programme` job chain, retakes skip creation |
| **Question Renderers** | Factory pattern with `QuestionComponentProps`, dispatches `SET_ANSWER`     |
| **API Client**         | TanStack Query with typed hooks in `hooks/assessments/`                    |
| **Results API**        | Nullable `scores`/`programmeId` until scoring completes                    |

---

## Completed: FFP-253 British English Rename ✅

Renamed American English identifiers to British English across the codebase (merged via PR #74):

- `generate_program` → `generate_programme` (job type enum)
- `program_user` → `programme_user` (user role enum)
- `programTemplateId` → `programmeTemplateId` (types/JSONB)
- `programMapping(s)` → `programmeMapping(s)` (types/seed data)

---

## Current: Sprint 6 - Frontend Completion (~26 pts)

**Dates**: 16th February - 8th March 2026 (early start from 6th Feb, committed dates unchanged)
**Sprint Goal**: End-to-end assessment flow working, demo-ready MVP.

### Sprint 6 Stories

| Key     | Story                                        | Pts | Type  | Status                                   |
| ------- | -------------------------------------------- | --- | ----- | ---------------------------------------- |
| FFP-137 | Assessment Navigation Component              | 3   | Story | ✅ Done                                  |
| FFP-140 | Assessment Step Screens                      | 5   | Story | ✅ Done                                  |
| FFP-272 | E2E Assessment Flow Integration              | 5   | Story | ✅ Done                                  |
| FFP-273 | ToastAlert Notification Component            | 3   | Task  | ✅ Done                                  |
| FFP-229 | Assessment Engine Epic Clean Up              | 8   | Story | ✅ Done                                  |
| FFP-279 | Update deterministic seed UUIDs to RFC 4122  | -   | Task  | ✅ Done                                  |
| FFP-280 | Align Zod versions across monorepo (v3 → v4) | -   | Task  | ✅ Done                                  |
| FFP-233 | Backend Required Question Validation         | 3   | Story | ✅ Done (already implemented in FFP-130) |
| FFP-230 | Stale Job Detection                          | 2   | Story | 🚀 In Progress                           |
| FFP-254 | FFP-3 Epic Planning & Sprint Definition      | 5   | Story | To Do                                    |

### Recommended Execution Order (remaining)

1. **FFP-230** - Stale job detection (operational resilience)
2. **FFP-254** - FFP-3 Epic planning (documentation, prepares next phase)

**Note**: FFP-233 closed without new work — required question validation was already implemented during FFP-130 (Sprint 4) in `assessment.service.ts` (lines 436–551).

### Implementation Plan: FFP-230 — Stale Job Detection

**Branch**: `feature/sprint6` (current branch, single PR with other sprint 6 work)
**Story**: As a developer, I want jobs stuck in 'processing' status to be automatically marked as failed, so I can investigate and manually re-queue them.
**Points**: 2 | **Type**: Story | **No sub-tasks** (standalone)

**Codebase context** (already in place):

- `process_jobs` table has `message` column (text) — no schema changes needed
- `process_jobs` has no RLS — handler can query cross-tenant without BYPASSRLS
- Existing `sst.aws.Cron` pattern for job processor (staging/production only)
- `failJob()` in `job-processor.service.ts` handles retry logic + status transitions
- Job statuses: `queued`, `processing`, `completed`, `failed`, `cancelled`

**Implementation steps** (single branch, 3 files):

| #   | Step                                 | Package          | File(s)                                            | Notes                                                                                                                                                                                                               |
| --- | ------------------------------------ | ---------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Stale job detection service function | `@ffp/core`      | `packages/core/src/jobs/stale-job.service.ts`      | Query `process_jobs` WHERE status='processing' AND started_at < NOW() - threshold. Update each to status='failed', set message, set completedAt. Return count. Configurable threshold via parameter (default 300s). |
| 2   | Lambda handler                       | `@ffp/functions` | `packages/functions/src/jobs/detect-stale-jobs.ts` | Scheduled handler, reads `STALE_JOB_THRESHOLD_SECONDS` env var, calls service, logs summary.                                                                                                                        |
| 3   | SST cron configuration               | root             | `sst.config.ts`                                    | Add `StaleJobDetector` cron (rate 5 minutes), staging/production only. Same pattern as existing `JobProcessorCron`.                                                                                                 |

**Amended requirements vs ticket**:

- Ticket says "BYPASSRLS (system context)" — **not needed**. `process_jobs` is intentionally excluded from RLS policies, so the handler can query directly.
- Ticket references `FFP-180` as dependency — this was the original job processor ticket (completed in Sprint 3 as FFP-132). Dependency satisfied.
- No automatic re-queuing or alerting (explicitly out of scope per ticket).

**Tests**: Deferred to MVP launch.

---

### Completed: FFP-137 — Assessment Navigation Component ✅

**Branch**: `feature/FFP-137-assessment-navigation` | **Sub-tasks**: FFP-204, FFP-205, FFP-206 (done), FFP-207 (tests deferred)
**Summary**: Save-on-navigate component using `useAssessment()` + `useSaveProgress()`. Supports branching via `nextStepId`, loading states, custom callbacks.

---

### Completed: FFP-140 — Assessment Step Screens ✅

**Branch**: `feature/FFP-140-assessment-step-screens` | **Sub-tasks**: FFP-218, FFP-219, FFP-220, FFP-221, FFP-222 (all done) | **Merged**: PR #77
**Summary**: Built all assessment step components — `IntroScreen`, `ResultsScreen` (standalone screens), `QuestionCard`, `TransitionCard`, `VideoQuestionCard` (compose shared `StepCard` layout), and `AssessmentStepRenderer` orchestrator. Mid-story Screen-to-Card refactor after Figma review introduced `cards/` directory alongside `screens/`. Extracted shared components (`SectionHeader`, `FeatureColumnGrid`, `InstructionList`, `SectionPanel`). Added entrance animations with centralised `ASSESSMENT_MOTION` constants. Extended `Text` (`h1`–`h5`, `ffp-navy`), `IconBadge` (`solid`/`circle`), and `StaticAlert` (`solid` appearance).

**Key decisions**: `cards/` vs `screens/` split reflects genuine layout difference (card chrome vs full-page); presentational screen props with orchestrator owning state; questions passed as prop due to template query gap (tracked FFP-272).

---

### Completed: FFP-272 — E2E Assessment Flow Integration ✅

**Branch**: `feature/ffp-272-full-e2e-assessment-integration` | **Merged**: 17th Feb 2026

**Subtasks** (in execution order):

| Key     | Subtask                                                | Focus              | Status      |
| ------- | ------------------------------------------------------ | ------------------ | ----------- |
| FFP-274 | Fix template questions schema & API response parsing   | schema, API client | ✅ Complete |
| FFP-275 | Create assessment route and page shell                 | route, page        | ✅ Complete |
| FFP-276 | Wire assessment page orchestrator (start, step flow)   | orchestration      | ✅ Complete |
| FFP-277 | Wire submit assessment and results polling             | submit, polling    | ✅ Complete |
| FFP-278 | Programme user first-login redirect to assessment      | routing            | ✅ Complete |
| —       | E2E testing guide (seed data, scenarios, verification) | testing            | ✅ Complete |

**E2E testing status** (6 sessions, 12th–17th Feb):

| Scenario | Description                         | Status                    |
| -------- | ----------------------------------- | ------------------------- |
| 1        | Happy path (back pain, full 9-step) | ✅ Tested                 |
| 2        | Branching (non-back-pain skip)      | ✅ API-verified           |
| 3        | Red flag warnings UI                | ✅ Tested                 |
| 4        | Resume mid-assessment               | ✅ API-verified           |
| 5        | Resume after submission             | ✅ Tested (routing guard) |
| 6        | First login redirect                | ✅ Tested                 |
| —        | Programme overview page             | ✅ Tested                 |
| —        | Reassessment flow (replace/keep)    | ✅ Tested                 |

**Additional work delivered on this branch** (beyond original subtasks):

- Programme overview page (`GET /programmes/active` endpoint + frontend)
- Reassessment flow (start new assessment, replace/keep programme choice, programme archival)
- RLS policy tightening (split `tenant_read_isolation` / `tenant_write_isolation`)
- Multiple UX fixes from E2E testing (numeric clamping, progress counter, continue button, resume behaviour)

**FFP-274 summary**: Added `assessmentTemplateWithQuestionsSchema` with Zod transform mapping backend `QuestionWithConfig` to frontend `AssessmentQuestion` (`questionText` → `question`, nullable → optional, configOverrides applied, backend-only fields stripped). Updated API client and hook to use new schema/type.

**FFP-275 summary**: Added `RouteKey.ASSESSMENT` and route config at `/assessment` with `excludeLayout: true` (fullscreen, no app layout). Created `AssessmentPage` shell — reads `flowId` from search params, shows error if missing, wraps with `AssessmentProvider`, renders orchestrator.

**FFP-276 summary**: Created `AssessmentOrchestrator` component — starts/resumes assessment on mount via `useStartAssessment`, dispatches `START_ASSESSMENT` to populate context, fetches template questions reactively based on current step's `templateId`, passes questions to `AssessmentStepRenderer`. Loading spinner while starting, error states with retry button, resume flow handled through `START_ASSESSMENT` payload.

**FFP-277 summary**: User-initiated submit flow (no useEffect). Orchestrator computes `isLastSubmittableStep` from flow steps, passes `onSubmitAssessment` callback down through `AssessmentStepRenderer` to `QuestionStepContent`/`VideoStepContent`. On the last question of the last submittable step, "Continue" becomes "Complete Assessment" (green `success` button variant). Clicking it calls `submitMutate` with full answers; `onSuccess` dispatches `NEXT_STEP` to transition to results. `hasSubmittedRef` prevents re-submission on resume. Shows "Submitting..." loading and error+retry states. `handleViewProgramme` navigates to `/programme-overview`. `ResultsStepContent` dispatches `SET_SCORES` when polling returns scores. Added `continueVariant` prop to `AssessmentNavigation`.

**FFP-278 summary**: Added `GET /assessments/user-status` endpoint — checks if programme user has an active programme, returns default assessment flow ID for redirect. Flow lookup uses two-tier hierarchy: tenant `settings.defaultAssessmentFlowId` override → platform tenant `settings.defaultAssessmentFlowId` global default (throws `InternalServerError` if neither configured). Frontend `useUserAssessmentStatusQuery` hook called from `HomePage`, redirects programme users without a programme to `/assessment?flowId=<id>` with loading spinner during check.

**State management audit**: Audited `useReducer` + Context pattern (established FFP-135, Sprint 4) against Zustand, XState v5, Jotai, TanStack Query, useActionState, and React Hook Form. Decision: **keep current pattern** — still React-recommended in 2026, zero bundle overhead, 4 page-scoped consumers with no prop drilling issues. Removed 5 unused speculative actions (`SET_PHASE`, `GO_TO_STEP`, `ADD_WARNING`, `CLEAR_WARNINGS`, `RESET`) per YAGNI — reducer trimmed from 11 to 6 actions (~100 lines removed). Added lifecycle documentation to reducer. `questionIndex` stays as local state. Research documented in `.claude/docs/`.

---

### Completed: FFP-273 — ToastAlert Notification Component ✅

**Branch**: `feature/sprint6`
**Summary**: Built auto-dismissing toast notification system — `ToastAlert` component (4 variants, progress bar, entrance/exit animations), `ToastProvider` context + `useToast` hook, and dev showcase page with 5 demo tabs. Updated `StaticAlert` showcase to reference ToastAlert as implemented (no longer "future").

---

### Completed: FFP-229 — Assessment Engine Epic Clean Up ✅

**Summary**: Review of FFP-2 requirements, backlog scan, and epic hygiene.

---

### Completed: FFP-279 + FFP-280 — Seed UUIDs & Zod v4 Migration ✅

**Branch**: `feature/ffp-279-280-seed-uuids-zod-v4` | **Merged**: PR #80 (21st Feb 2026)
**Summary**: Combined tech debt task — migrated deterministic seed UUIDs to RFC 4122 format and aligned Zod across the monorepo from v3 to v4.

- Replaced `z.string().uuid()` with `z.guid()` across all Zod schemas to accept Cognito's non-RFC-4122 UUIDs
- Aligned UUID changes in user assessments schema
- Migrated email and ISO date validators from Zod v3 to v4 syntax
- Updated Zod validation error messages

---

### Claude Code Custom Commands (21st Feb)

Added `/pick-up` and `/work-on` slash commands to `.claude/commands/` for structured sprint workflows:

- **`/pick-up`** — User story planning: reads Jira ticket, analyses requirements, creates sub-tasks with implementation plans
- **`/work-on`** — Sub-task implementation: picks up a sub-task, reads the plan, implements the code changes

---

### Postman MCP Server Setup (17th Feb)

Migrated local Postman collection JSON files to cloud-managed via Postman MCP server. Collections are now maintained through the `/postman` skill rather than manual file imports.

- **API Collection**: `FFP - Fit For Purpose API` (ID: `c522ff50-4664-4d72-901d-fb5a0dd3612c`)
- **Test Flows**: `FFP - Manual Test & Demo Flows` (ID: `312a0fac-8906-43e3-abf9-745d64e9faa7`)
- **Environment**: `FFP-DEV-CHRIS` (read-only, user-managed)
- Skill created at `.claude/skills/postman/SKILL.md`
- Local JSON files gitignored (`postman/` directory)

---

### Deferred to Backlog

| Key     | Story                  | Reason                                                                           |
| ------- | ---------------------- | -------------------------------------------------------------------------------- |
| FFP-231 | Job Status Polling     | `GET /assessments/:id/results` already supports polling (scores null → complete) |
| FFP-252 | Scoring E2E Validation | Waiting on co-founder's question/scoring config spreadsheet (post-sprint 6)      |
| FFP-141 | Video Player Component | Defer to FFP-3 (Video Management) to avoid premature implementation              |

**Note on FFP-141**: Consider a simple placeholder component (`VideoPlayer.tsx` with "Video not available" message) to unblock FFP-140's video-assessment step type. Full implementation deferred to FFP-3 epic.

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

| Sprint | Focus                | Pts | Status                       |
| ------ | -------------------- | --- | ---------------------------- |
| 3      | Backend Foundation   | 24  | ✅ Complete                  |
| 4      | APIs & FE Foundation | 23  | ✅ Complete                  |
| 5      | Results & FE Core    | 23  | ✅ Complete                  |
| 6      | FE Completion        | 26  | 🚀 In Progress (Early Start) |

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
**Sprint**: 6 of 6 (Assessment Engine - Final, early start)
**Velocity**: ~25 pts/sprint
**Capacity**: 8 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- 🚀 FFP-2: Assessment Engine (Sprints 3-6)
- ⏳ FFP-3: Video Management
- ⏳ FFP-4: User Dashboards and Progress Tracking

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
