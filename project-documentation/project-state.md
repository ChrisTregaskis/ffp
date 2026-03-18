# FFP - Project State

**Last Updated**: 18th March 2026
**Current EPIC**: FFP-439 Admin Programme Template Management
**Sprint Status**: Sprint 9 - Programme Template (in progress)

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
| 3     | Main  | FFP-444 | Session exercise backend APIs              | 5   | Done        |
| 4     | Main  | FFP-446 | Template detail & hierarchy editing UI     | 8   | Done        |
| 5     | Main  | FFP-447 | Integration verification & documentation   | 3   | In Progress |

**Out of scope**: Drag-and-drop reordering (MVP uses move up/down), template duplication/cloning, template versioning, bulk import/export.

### Active Story: FFP-447 — Integration Verification & Documentation (3 pts)

**Branch**: `feature/ffp-447-admin-programme-template-verification`
**Goal**: Final verification story for the Admin Programme Template Management epic (FFP-439). Covers a schema cleanup (drop `sessions_per_phase`, auto-compute `total_phases`), manual E2E testing, Postman collection updates, and project documentation.

**Prerequisites** (all met):

- ✅ All backend APIs complete (FFP-441 through FFP-444)
- ✅ Template detail page complete (FFP-446) — full hierarchy CRUD, reorder, video selection
- ✅ Template list page (FFP-445) — with active filter, create flow
- ✅ Seed data — Gentle Mobility Programme (4 phases, 12 sessions, 40 exercises)

**Sub-task execution order** (single branch, all sub-tasks together):

| Order | Key     | Summary                                         | Type          | Status |
| ----- | ------- | ----------------------------------------------- | ------------- | ------ |
| 1     | FFP-516 | Drop sessionsPerPhase, auto-compute totalPhases | Code (DB/API) | Done   |
| 2     | FFP-490 | Full CRUD flow end-to-end manual testing        | Verification  | To Do  |
| 2     | FFP-491 | Cascade delete behaviour verification           | Verification  | To Do  |
| 3     | FFP-492 | Postman collection with template test flows     | Postman       | To Do  |
| 4     | FFP-493 | Project documentation update                    | Documentation | To Do  |

**Groupings**:

- **Group 1 (Schema Cleanup)**: FFP-516 — migration + schema + backend + frontend + seed data changes. Must be first as it changes the API contract.
- **Group 2 (Manual Verification)**: FFP-490 + FFP-491 — done together by the user against running dev environment. FFP-491 is a subset of FFP-490's checklist.
- **Group 3 (Postman)**: FFP-492 — update/verify Postman collection after schema changes are confirmed working.
- **Group 4 (Documentation)**: FFP-493 — final documentation pass, mark FFP-439 epic as complete.

**Amended requirements**:

- **FFP-516 scope**: `sessions_per_phase` column exists in DB schema, backend Zod schemas (create/update/response), list page columns, and seed data. `total_phases` exists in same places. Changes needed:
  - DB: Migration to drop `sessions_per_phase` column. Keep `total_phases` column but make it auto-computed.
  - Backend: Remove `sessionsPerPhase` from all Zod schemas. Remove `totalPhases` from create/update input schemas (auto-managed). Keep in response schemas.
  - Backend handlers: Increment `totalPhases` on phase create, decrement on phase delete.
  - Frontend: Remove "Sessions/Phase" column from list page. "Phases" column stays (reads `totalPhases`).
  - Seed data: Remove `sessionsPerPhase` values. Keep `totalPhases` (matches actual phase count).
  - Programme service: Remove `sessionsPerPhase` snapshot from `generateProgramme()`. Keep `totalPhases` snapshot.
- **FFP-491 amended**: Ticket says "Verify template totalPhases and sessionsPerPhase update correctly after deletes" — after FFP-516, `sessionsPerPhase` won't exist. Amend to: verify `totalPhases` decrements correctly when phases are deleted.
- **FFP-490 + FFP-491 overlap**: Cascade delete testing is part of the full CRUD checklist. Both sub-tasks will be verified in a single manual testing pass.
- **Tests deferred** per sprint convention.

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
