# FFP - Project State

**Last Updated**: 3rd March 2026
**Current EPIC**: FFP-3 Video Management
**Sprint Status**: Sprint 8 - Video UI & Integration (next)

---

## In Progress: Sprint 8 - Video UI & Integration (~27 pts)

**Dates**: 4th March - 24th March 2026
**Sprint Goal**: Admin video upload/management UI, video player component, integration verification, documentation update.
**Epic**: FFP-3 Video Management

**Key documents**:

- `.claude/research/video-management-research.md` - Video infrastructure research & confirmed decisions
- `.claude/research/ffp-3-epic-plan.md` - Final epic plan (stories, ACs, subtasks, sprint allocation)
- `.claude/research/programme-data-model-research.md` - Authoritative programme data model

**Prerequisites from Sprint 7** (all met):

- Video catalogue schema + APIs (FFP-282, FFP-300)
- CloudFront OAC + signed URL infrastructure (FFP-288, FFP-294)
- Programme-video relationship schema + service evolution (FFP-307)

---

### FFP-337: Video Player Component (5 SP) — Implementation Plan

**Branch**: `feature/ffp-337-video-player-component` (worktree)
**Scope**: Frontend-only. Reusable VideoPlayer React component with HTML5 video, TanStack Query hooks for video data + signed URLs, loading/error/retry states, responsive styling.

**What already exists**:

- Core video domain: `video.service.ts`, `video.repository.ts`, `video-signing.service.ts`
- Zod schemas: `videoSchema`, `videoListResponseSchema`, `videoDetailResponseSchema`, `videoFilterSchema`
- APIs deployed: `GET /videos`, `GET /videos/:id`, `GET /videos/:id/signed-url`
- TanStack Query configured in web package with smart retry logic
- API client pattern established (`packages/web/src/lib/api/`)
- Placeholder `<video>` element in `VideoResponseQuestion.tsx` with TODO to integrate

**What needs building**:

- `videosApi` endpoint file in `packages/web/src/lib/api/videos.ts`
- Video query hooks in `packages/web/src/hooks/videos/`
- `VideoPlayer` component in `packages/web/src/components/video/`
- Integration with existing `VideoQuestionCard` / `VideoResponseQuestion`

**Amended requirements**:

- FFP-341 ticket references `useVideos()` and `useVideo()` but also requires a `videosApi` endpoint — prerequisite not called out in ticket
- FFP-338 lists `videoId` as a prop but the component should also accept an optional `src` prop for direct URL use (assessment context already has videoUrl)
- Tests deferred until MVP launch per sprint policy

#### Execution Order

All sub-tasks on single branch — tightly coupled, pure frontend:

| Order | Key     | Summary                                         | Notes                                                                                                                                                            |
| ----- | ------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FFP-341 | Create useVideos and useVideo query hooks       | Done — videosApi + query keys + hooks                                                                                                                            |
| 2     | FFP-339 | Create useVideoSignedUrl TanStack Query hook    | Done — Zod schema in core, getSignedUrl API method, 10-min staleTime hook                                                                                        |
| 3     | FFP-338 | Create VideoPlayer component with HTML5 video   | Consumes useVideoSignedUrl hook                                                                                                                                  |
| 4     | FFP-340 | Add loading, error, and retry states            | Enhances VideoPlayer from FFP-338                                                                                                                                |
| 5     | FFP-342 | Style VideoPlayer for responsive desktop/tablet | Final polish pass                                                                                                                                                |
| —     | —       | Manual verification & testing                   | After FFP-338: verify video playback, data loading, signed URLs. After FFP-342: check responsive layouts, error/retry states. Complete before PR review & merge. |

---

## Completed: Sprint 7 - Video Infrastructure & APIs (~28 pts)

**Dates**: 23rd February - 3rd March 2026
**Sprint Goal**: Video catalogue schema, CloudFront signed URLs, video APIs, programme-video relationships.
**Epic**: FFP-3 Video Management

| Key     | Story                                                   | Pts | Status |
| ------- | ------------------------------------------------------- | --- | ------ |
| FFP-282 | Video Catalogue Database Schema                         | 5   | Done   |
| FFP-288 | CloudFront OAC & Signed URL Infrastructure              | 5   | Done   |
| FFP-294 | Signed URL Generation Service                           | 5   | Done   |
| FFP-300 | Video Catalogue APIs                                    | 5   | Done   |
| FFP-307 | Programme-Video Relationship Schema & Service Evolution | 8   | Done   |

### Key Deliverables (Sprint 7)

- **Video catalogue**: Drizzle schema with GIN indexes, 10 seed videos, list/filter/get APIs, Postman collection
- **CloudFront signed URLs**: RSA key pair, SST OAC + Key Group, `video-signing.service.ts` with key caching
- **Programme structure**: 4 new DB tables (`template_phases`, `template_sessions`, `session_exercises`, `programme_phases`), migration 0018, RLS on `programme_phases`
- **Template metadata**: `programme_templates` extended with `total_phases`, `sessions_per_phase`, `difficulty`; `programmes` extended with 7 lifecycle columns
- **Service evolution**: `generateProgramme()` eagerly creates phase rows, snapshots template metadata, `archiveProgramme()` sets lifecycle columns (`archivedAt`, `archivedReason`, `replacedByProgrammeId`)
- **Seed data**: Complete Gentle Mobility Programme template hierarchy (4 phases, 12 sessions, 40 exercises)
- **Zod schemas**: `programme-structure.schema.ts` (template hierarchy), updated `programme.schema.ts` (phase status, lifecycle fields)

### Backlog Items Created (Sprint 7)

- `programmes` table RLS policy gap — table has `tenant_id` but not in `apply-rls.ts` (pre-existing, tracked for FFP-4)

---

## Completed: Sprint 6 - Frontend Completion (~26 pts)

**Dates**: 16th February - 22nd February 2026
**Sprint Goal**: End-to-end assessment flow working, demo-ready MVP.

| Key     | Story                                        | Pts | Type  | Status |
| ------- | -------------------------------------------- | --- | ----- | ------ |
| FFP-137 | Assessment Navigation Component              | 3   | Story | Done   |
| FFP-140 | Assessment Step Screens                      | 5   | Story | Done   |
| FFP-272 | E2E Assessment Flow Integration              | 5   | Story | Done   |
| FFP-273 | ToastAlert Notification Component            | 3   | Task  | Done   |
| FFP-229 | Assessment Engine Epic Clean Up              | 8   | Story | Done   |
| FFP-279 | Update deterministic seed UUIDs to RFC 4122  | -   | Task  | Done   |
| FFP-280 | Align Zod versions across monorepo (v3 → v4) | -   | Task  | Done   |
| FFP-233 | Backend Required Question Validation         | 3   | Story | Done   |
| FFP-230 | Stale Job Detection                          | 2   | Story | Done   |
| FFP-254 | FFP-3 Epic Planning & Sprint Definition      | 5   | Story | Done   |

### FFP-3 Planning Outcomes (from Sprint 6)

**FFP-3 scope**: 2 sprints, ~55 pts (Sprint 7: 28 pts, Sprint 8: 27 pts)

- Sprint 7: Video catalogue schema, CloudFront OAC + signed URLs, video catalogue APIs, programme-video relationship schema
- Sprint 8: Admin video upload/management UI, video player component, integration verification, docs update

**Programme data model research complete** (`.claude/research/programme-data-model-research.md`):

- Confirmed: Programme → Phases → Sessions → Exercises (status-driven, not calendar-based)
- "Phases" replace "weeks" as the structural unit (co-founder decision, 1st March 2026) — avoids implying weekly cadence
- Hybrid instantiation: phases created eagerly at assignment, sessions/completions lazily
- Normalised `exercise_completions` table (not JSONB)
- `programme_phases` (user-layer, RLS) created in FFP-3; `user_sessions` and `exercise_completions` deferred to FFP-4

**FFP-4 epic updated** in Jira with confirmed data model, prerequisites from FFP-3, and design decisions.

---

## Completed: FFP-2 Assessment Engine (Sprints 3-6, 96 pts)

**86 story points** across 4 sprints. E2E assessment flow working and tested.

| Sprint | Focus                | Pts | Key Deliverables                                                      |
| ------ | -------------------- | --- | --------------------------------------------------------------------- |
| 3      | Backend Foundation   | 24  | Schemas, job queue, state machine, Start/Save APIs                    |
| 4      | APIs & FE Foundation | 23  | Submit API, scoring service, admin API, React Context state           |
| 5      | Results & FE Core    | 23  | Results API, programme generation, TanStack Query, question renderers |
| 6      | FE Completion        | 26  | Navigation, step screens, E2E integration, stale job detection        |

### Key Patterns & Decisions (Assessment Engine)

| Area                    | Decision                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| **State Machine**       | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`)   |
| **Job Queue**           | DB-driven polling, `FOR UPDATE SKIP LOCKED`, exponential backoff, 2 job types  |
| **Stale Job Detection** | Per-type configurable thresholds, EventBridge cron (5 min), staging/prod only  |
| **Scoring**             | Multi-dimensional with weighted dimensions, flow-level config                  |
| **Branching**           | `goto_step`, `show_warning` actions with condition evaluators                  |
| **Flow Steps**          | `intro`, `questions`, `transition`, `video-assessment`, `results`              |
| **Programme Gen**       | `score_assessment` → `generate_programme` job chain, retakes skip creation     |
| **Question Renderers**  | Factory pattern with `QuestionComponentProps`, dispatches `SET_ANSWER`         |
| **Frontend State**      | React Context + useReducer (audited 2026, kept over Zustand/XState/Jotai)      |
| **API Client**          | TanStack Query with typed hooks in `hooks/assessments/`                        |
| **Zod Transforms**      | Backend → frontend shape mapping at parse time (configOverrides applied)       |
| **Assessment Route**    | `/assessment` fullscreen (excludeLayout), orchestrator pattern                 |
| **Submit Flow**         | User-initiated (no useEffect), "Complete Assessment" on final submittable step |
| **Results Polling**     | `useAssessmentResultsQuery` polls every 2s, stops on scores                    |
| **First Login**         | Redirect programme users without programme to assessment via user-status API   |
| **Admin API**           | Thin service layer, repository handles logic                                   |

### Deferred to Backlog

| Key     | Story                  | Reason                                                                           |
| ------- | ---------------------- | -------------------------------------------------------------------------------- |
| FFP-231 | Job Status Polling     | `GET /assessments/:id/results` already supports polling (scores null → complete) |
| FFP-252 | Scoring E2E Validation | Waiting on co-founder's question/scoring config spreadsheet (post-sprint 6)      |

---

## Key Architectural Decisions

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Entity (optional) → Repository → Schema`

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});
```

**JWT Claims**: `custom:tenantId`, `custom:customerId`, `custom:role`

**RLS exclusions**: `process_jobs`, `assessment_templates`, `assessment_flows`, `questions`, `template_questions`, `programme_templates`, `template_phases`, `template_sessions`, `session_exercises`, `videos` (system-managed, cross-tenant by design)

### Frontend Architecture

- React 18 with arrow function components
- Zod schemas as single source of truth
- TanStack Query for server state
- React Context + useReducer for page-scoped form state
- Component library: `cards/` vs `screens/` split, shared `StepCard` layout
- ToastAlert notification system (4 variants, auto-dismiss)

### Import Rules

- `@ffp/web` imports from `@ffp/core` only (never `@ffp/database`)
- Cross-package: `workspace:*` protocol, resolve to `dist/`
- Intra-package: namespace aliases (`@core/`, `@web/`)

---

## Working Infrastructure

**Deployed**: SST v3 Ion, Cognito, S3 + CloudFront, API Gateway, PostgreSQL (local) with RLS

**Packages**: `@ffp/web`, `@ffp/functions`, `@ffp/core`, `@ffp/database`

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 698 tests passing

**Postman**: API collection + test flows managed via MCP server (`/postman` skill)

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Velocity**: ~25-30 pts/sprint
**Capacity**: 8-12 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- ✅ FFP-2: Assessment Engine (Sprints 3-6)
- 🏃 FFP-3: Video Management (Sprint 7-8) — Sprint 7 complete, Sprint 8 next
- ⏳ FFP-4: Programme Execution & Progress
- ⏳ FFP-109: Deployment Readiness (staging + production)
- ⏳ FFP-6: Customer & User Onboarding

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
