# FFP - Project State

**Last Updated**: 12th March 2026
**Current EPIC**: FFP-439 Admin Programme Template Management
**Sprint Status**: Sprint 9 - Programme Template (starting)

---

## Active: Sprint 9 - Programme Template (~34 pts)

**Dates**: 12th March – 2nd April 2026
**Sprint Goal**: Full CRUD for admin programme template hierarchy — templates, phases, sessions, exercises — with video default prescription fields and admin UI.
**Epic**: FFP-439 (Admin Programme Template Management)
**Branch**: `feature/sprint9`

**Execution plan**: `.claude/plans/sprint-9-execution-plan.md`

**Key documents**:

- `.claude/research/programme/programme-data-model-research.md` - Authoritative programme data model
- `.claude/plans/sprint-9-execution-plan.md` - Full dependency graph, worktree assessment, subtask breakdown

**Prerequisites** (all met):

- ✅ FFP-3 (Video Management) complete — video catalogue, CloudFront signed URLs, admin CRUD
- ✅ Programme template DB schema (Sprint 7) — `programme_templates`, `template_phases`, `template_sessions`, `session_exercises`
- ✅ Table component + pagination pattern (FFP-437)
- ✅ Seed data — Gentle Mobility Programme hierarchy (4 phases, 12 sessions, 40 exercises)

**Key design decision**: Extend `videos` table with default exercise prescription fields (sets, reps, duration, rest, notes) rather than introducing a separate exercise entity. Videos are exercise demonstrations — the video catalogue effectively is the exercise library. Prescription pre-populates from video defaults when adding to a session, overridable per-session.

### Execution Order

| Phase | Track | Key     | Summary                                    | Pts | Status      |
| ----- | ----- | ------- | ------------------------------------------ | --- | ----------- |
| 1     | Main  | FFP-441 | Video default exercise prescription fields | 3   | Done        |
| 1     | Main  | FFP-442 | Programme template backend APIs            | 5   | Done        |
| 2     | Main  | FFP-443 | Phase & session backend APIs               | 5   | Done        |
| 2     | Main  | FFP-445 | Programme template admin list page         | 5   | Done        |
| 3     | Main  | FFP-444 | Session exercise backend APIs              | 5   | In Progress |
| 4     | Main  | FFP-446 | Template detail & hierarchy editing UI     | 8   | To Do       |
| 5     | Main  | FFP-447 | Integration verification & documentation   | 3   | To Do       |

**Out of scope**: Drag-and-drop reordering (MVP uses move up/down), template duplication/cloning, template versioning, bulk import/export.

### Active Story: FFP-444 — Session Exercise Management APIs (5 pts)

**Branch**: `feature/sprint9` (continuing on sprint branch)
**Goal**: Backend CRUD + reorder APIs for session exercises — the leaf nodes of the template hierarchy. Each exercise links to a video with prescription data (sets, reps, duration, rest, notes). Prescription pre-populates from video defaults.

**Sub-task execution order** (single branch, all sub-tasks together):

| Order | Key     | Summary                                          | Layer   | Status |
| ----- | ------- | ------------------------------------------------ | ------- | ------ |
| 1     | FFP-472 | Zod request/response schemas for exercises       | Core    | Done   |
| 2     | FFP-468 | Session exercise repository (CRUD + reorder)     | Core    | Done   |
| 3     | FFP-469 | Session exercise service (video default pre-pop) | Core    | Done   |
| 4     | FFP-470 | Lambda handlers for exercise endpoints           | Funcs   | To Do  |
| 5     | FFP-471 | SST routes for exercise endpoints                | Infra   | To Do  |
| 6     | FFP-473 | Postman requests for exercise endpoints          | Postman | To Do  |

**Amended requirements**:

- **FFP-472 scope reduced**: Ticket title says "phase, session, and exercise" but phase and session schemas already exist in `programme.schema.ts` (lines 208-270). Only **exercise-specific** API request/response schemas are needed:
  - `createExerciseRequestSchema` — requires `videoId`, optional prescription fields (`sets`, `reps`, `durationSeconds`, `restSeconds`, `notes`). Note: `templateSessionId` comes from URL path param, `orderIndex` is auto-assigned — neither belongs in the request body.
  - `updateExerciseRequestSchema` — optional `videoId` + optional prescription fields (partial update).
  - `reorderExercisesRequestSchema` — `orderedIds: z.array(z.guid()).min(1)` (matches existing reorder pattern).
  - `exerciseResponseSchema` — exercise fields + joined video metadata for display.
  - Type exports for all schemas.
  - Note: `createSessionExerciseSchema` already exists in `programme-structure.schema.ts` (lines 93-106) for internal/seed use — the new API request schemas are separate (no `templateSessionId` or `orderIndex`).
- **FFP-468 orderIndex**: Exercises use 0-based `orderIndex` (unlike phases/sessions which use 1-based `phaseNumber`/`sessionNumber`). The reorder/renumber logic should follow the existing negative-value pattern to avoid unique constraint violations, but with 0-based indexing.
- **FFP-468 video join**: `findExercisesBySessionId` and `findExerciseById` should join video data (at minimum `id`, `title`, `thumbnailUrl`, `status`, default prescription fields) so the response includes video context.
- **FFP-469 video validation**: Service must validate video exists AND is active (`status = 'active'`). Reject with 400 for non-existent or inactive video. Use existing video repository's `findVideoById` or equivalent.
- **FFP-469 pre-population logic**: For each prescription field (`sets`, `reps`, `durationSeconds`, `restSeconds`, `notes`), use the explicit value if provided, otherwise fall back to the video's `defaultSets`, `defaultReps`, `defaultDurationSeconds`, `defaultRestSeconds`, `defaultNotes`.
- **FFP-469 session validation**: Validate session exists before creating exercise. 404 for non-existent session.
- **FFP-470 route paths** (aligned with existing patterns):
  - `POST /sessions/{id}/exercises` — create exercise under session
  - `PUT /exercises/{id}` — update exercise
  - `DELETE /exercises/{id}` — delete exercise
  - `PUT /sessions/{id}/exercises/reorder` — reorder exercises
  - Note: these are relative to the admin API base path (no `/admin` prefix in handler routes).
- **FFP-470 list endpoint**: The story description mentions `findExercisesBySessionId` in the repository but no explicit list handler. A `GET /sessions/{id}/exercises` handler is needed for the upcoming UI (FFP-446) to fetch exercises for a session. Add this as part of FFP-470.
- **FFP-470 response codes**: Create → 201, Update → 200, Delete → 204, Reorder → 200, List → 200.
- **FFP-471**: Routes added to `packages/functions/src/admin/index.ts` following existing pattern (grouped with other programme template routes).
- **Tests deferred** per sprint convention.

**New files to create**:

- `packages/core/src/programme-templates/session-exercise.repository.ts` — CRUD + reorder data access
- `packages/core/src/programme-templates/session-exercise.service.ts` — Business logic + video pre-population
- `packages/functions/src/admin/programme-templates/list-exercises.ts` — GET handler
- `packages/functions/src/admin/programme-templates/create-exercise.ts` — POST handler
- `packages/functions/src/admin/programme-templates/update-exercise.ts` — PUT handler
- `packages/functions/src/admin/programme-templates/delete-exercise.ts` — DELETE handler
- `packages/functions/src/admin/programme-templates/reorder-exercises.ts` — PUT reorder handler

**Existing files to modify**:

- `packages/core/src/schemas/programme.schema.ts` — Add exercise request/response schemas + type exports
- `packages/core/src/programme-templates/index.ts` — Export new repository and service
- `packages/core/src/index.ts` — Export new schemas if not already barrel-exported
- `packages/functions/src/admin/index.ts` — Add 5 exercise routes to SST config

---

## Up Next: Sprint 10 — Customer & User Onboarding (~18 pts)

**Epic**: FFP-6 (MVP: Customer & User Onboarding)
**Sprint Goal**: Admin CRUD for customers and programme users — backend APIs and admin UI for both, including Cognito user provisioning.

**Prerequisites**:

- ✅ Customers and users database schema (existing)
- ✅ POST /admin/create-customer endpoint (existing)
- ✅ Table component + pagination pattern (FFP-437)
- ✅ Admin UI patterns (Video Library, Programme Template List)

### Execution Order

| Phase | Key     | Summary                           | Layer    | Pts | Status |
| ----- | ------- | --------------------------------- | -------- | --- | ------ |
| 1     | FFP-494 | Customer admin backend APIs       | Backend  | 3   | To Do  |
| 2     | FFP-495 | Customer admin UI                 | Frontend | 5   | To Do  |
| 3     | FFP-496 | Programme user admin backend APIs | Backend  | 5   | To Do  |
| 4     | FFP-497 | Programme user admin UI           | Frontend | 5   | To Do  |

**Key design decisions**:

- Customers first, then users (users require customer association)
- User creation provisions Cognito user with custom attributes (tenantId, customerId, role)
- tenantId derived from customer record, never from client input
- Email and customer read-only after user creation
- No user deletion — future story

---

## Completed: FFP-3 Video Management (Sprints 7-8, ~55 pts)

**Dates**: 23rd February – 24th March 2026
**Sprint Goal**: Video catalogue, CloudFront signed URLs, admin upload/management UI, video player, programme-video relationships.

| Sprint | Focus                  | Pts | Key Stories                                                                       |
| ------ | ---------------------- | --- | --------------------------------------------------------------------------------- |
| 7      | Infrastructure & APIs  | 28  | Video schema, CloudFront OAC, signed URLs, catalogue APIs, programme-video schema |
| 8      | Admin UI & Integration | 27  | Video player, table component, admin CRUD, upload, verification                   |

### Key Deliverables

- **Video catalogue**: Drizzle schema with GIN indexes, 10 seed videos, list/filter/get APIs
- **CloudFront signed URLs**: RSA key pair, SST OAC + Key Group, `video-signing.service.ts` with key caching
- **Programme structure**: 4 DB tables (`template_phases`, `template_sessions`, `session_exercises`, `programme_phases`), Gentle Mobility seed hierarchy
- **Programme lifecycle**: `generateProgramme()` eagerly creates phases, `archiveProgramme()` with lifecycle columns
- **Admin video management**: Full CRUD — upload (presigned S3 PUT), metadata editing, status transitions (`draft→active→archived`, restore), inline preview
- **VideoPlayer component**: Dual-mode (videoId/src), TanStack Query hooks, loading/error/retry states

### Key Patterns & Decisions (Video Management + Admin UI)

| Area                   | Decision                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Table Component**    | TanStack Table v8, `createColumns<T>()` factory (7 cell types), `useApiTable` hook, server-side pagination/sorting |
| **Pagination**         | Backend schemas (`paginationInputSchema`, `buildPaginationMeta`) + `applyPagination` Drizzle helper                |
| **Admin CRUD Pattern** | List page (Table + TableControls + filters) → Edit page (ComposableForm + inline preview)                          |
| **Upload Pattern**     | Presigned S3 PUT URLs, `useVideoUpload` hook with `useReducer` phases (`idle→uploading→creating→success→error`)    |
| **Video Status**       | `draft→active→archived` with restore; status transitions via `PUT /admin/videos/{id}`                              |
| **Reusable Layout**    | `PageContainer`, `PageHeader`, `StatusResult`, `ContentPanel`, `ComposableForm`, `Panel`                           |
| **DRY Components**     | `BaseSelect` (headless), `useClickOutside` hook, `formatDate`/`formatDuration` in shared utils                     |
| **Context Nav**        | `contextNavItems` on routes for pages that override sidebar navigation                                             |
| **Date Formatting**    | `Intl.DateTimeFormat('en-GB')` throughout                                                                          |
| **RLS Exclusions**     | System-managed tables (videos, templates, phases, sessions, exercises) — cross-tenant by design                    |

### Programme Data Model Decisions (from Sprint 6 planning)

- Programme → Phases → Sessions → Exercises (status-driven, not calendar-based)
- "Phases" replace "weeks" as the structural unit (co-founder decision, 1st March 2026)
- Hybrid instantiation: phases created eagerly at assignment, sessions/completions lazily
- Normalised `exercise_completions` table (not JSONB)
- `programme_phases` (user-layer, RLS) created in FFP-3; `user_sessions` and `exercise_completions` deferred to FFP-4

### Backlog Items

- `programmes` table RLS policy gap — table has `tenant_id` but not in `apply-rls.ts` (tracked for FFP-4)
- Bump `tsconfig.base.json` target/lib from ES2022 → ES2024 — Lambda runtime is nodejs24.x, enables `Object.groupBy`, `Map.groupBy` etc.

---

## Completed: FFP-2 Assessment Engine (Sprints 3-6, ~96 pts)

**Dates**: Sprints 3-6. E2E assessment flow working and tested.

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
- ✅ FFP-3: Video Management (Sprints 7-8)
- 🏃 FFP-439: Admin Programme Template Management (Sprint 9, ~34 pts)
- ⏳ FFP-6: Customer & User Onboarding (Sprint 10, ~18 pts)
- ⏳ FFP-4: Programme Execution & Progress (Sprints 11-13)
- ⏳ FFP-109: Deployment Readiness (staging + production)

---

**For implementation details**: domain-specific docs in `project-documentation/`
