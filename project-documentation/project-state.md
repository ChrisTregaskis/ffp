# FFP - Project State

**Last Updated**: 15th March 2026
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
| 4     | Main  | FFP-446 | Template detail & hierarchy editing UI     | 8   | In Progress |
| 5     | Main  | FFP-447 | Integration verification & documentation   | 3   | To Do       |

**Out of scope**: Drag-and-drop reordering (MVP uses move up/down), template duplication/cloning, template versioning, bulk import/export.

### Active Story: FFP-446 — Programme Template Detail Page (8 pts)

**Branch**: `feature/ffp-446-programme-template-detail-page` (dedicated branch)
**Goal**: Full detail page at `/admin/programme-templates/:id` showing template hierarchy (phases > sessions > exercises) with CRUD, reorder, and video selection at every level. Largest frontend story in the sprint.

**Prerequisites** (all met):

- ✅ All backend APIs complete (FFP-441 through FFP-444) — template, phase, session, exercise CRUD + reorder
- ✅ Template list page (FFP-445) — navigates to detail via `${path}/${row.id}`
- ✅ `templateDetailResponseSchema` exists — nested phases > sessions > exercises with embedded video summary
- ✅ `adminProgrammeTemplatesApi` exists — `list`, `get`, `create`, `update`, `deactivate`
- ✅ `useAdminTemplatesQuery` + `useTemplateMutations` exist — list query + create/update/deactivate mutations
- ✅ Seed data — Gentle Mobility Programme (4 phases, 12 sessions, 40 exercises)

**Sub-task execution order** (single branch, all sub-tasks together):

| Group | Order | Key     | Summary                                            | Layer   | Status |
| ----- | ----- | ------- | -------------------------------------------------- | ------- | ------ |
| 1     | 1     | FFP-489 | Route configuration for template detail page       | Routes  | Done   |
| 1     | 2     | FFP-480 | API client methods for phases, sessions, exercises | API     | Done   |
| 1     | 3     | FFP-482 | useTemplateDetailQuery hook                        | Hooks   | Done   |
| 1     | 4     | FFP-481 | Mutation hooks for phases, sessions, exercises     | Hooks   | Done   |
| 2     | 5     | FFP-483 | TemplateDetailPage with metadata editing           | Page    | Done   |
| 3     | 6     | FFP-484 | PhaseCard and PhaseForm components                 | UI      | Done   |
| 3     | 7     | FFP-485 | SessionCard and SessionForm components             | UI      | Done   |
| 4     | 8     | FFP-487 | VideoSelector component                            | UI      | Done   |
| 4     | 9     | FFP-486 | ExerciseRow and ExerciseForm components            | UI      | Done   |
| 5     | 10    | FFP-488 | Template creation flow from list page              | UI/Flow | To Do  |

**Groupings**:

- **Group 1 (Foundation)**: Route + API client + query/mutation hooks — data layer plumbing
- **Group 2 (Page Shell)**: Detail page with metadata display/edit, loading/error states, breadcrumb
- **Group 3 (Hierarchy Cards)**: Phase and session collapsible cards with CRUD + reorder
- **Group 4 (Exercise Layer)**: Video selector + exercise row/form with prescription pre-population
- **Group 5 (Creation Flow)**: Create template from list page → navigate to detail

**Amended requirements**:

- **FFP-489 path**: Ticket says `/admin/templates/:id` but existing convention uses `/admin/programme-templates`. Use `/admin/programme-templates/:id` to match list page path. Add `contextNavItems` with "Back to Programme Templates" (follows video upload pattern).
- **FFP-480 scope**: Template CRUD methods already exist in `adminProgrammeTemplatesApi`. Only **phase, session, and exercise** methods are needed. Backend route paths to target:
  - Phases: `POST /programme-templates/{id}/phases`, `PUT /phases/{id}`, `DELETE /phases/{id}`, `PUT /programme-templates/{id}/phases/reorder`
  - Sessions: `POST /phases/{id}/sessions`, `PUT /sessions/{id}`, `DELETE /sessions/{id}`, `PUT /phases/{id}/sessions/reorder`
  - Exercises: `POST /sessions/{id}/exercises`, `GET /sessions/{id}/exercises`, `PUT /exercises/{id}`, `DELETE /exercises/{id}`, `PUT /sessions/{id}/exercises/reorder`
- **FFP-482**: Uses existing `adminProgrammeTemplatesApi.get()`. Query key: `programmeTemplateKeys.detail(templateId)`. Enabled only when `templateId` is defined.
- **FFP-481**: Three hook files (`usePhaseMutations`, `useSessionMutations`, `useExerciseMutations`). All mutations invalidate `programmeTemplateKeys.detail(templateId)` on success for hierarchy refresh.
- **FFP-483 path**: Use `/admin/programme-templates/:id` (not `/admin/templates/:id`). Follow `PageContainer` + `PageHeader` layout pattern. Metadata editing via inline form (not modal).
- **FFP-484**: PhaseCard is collapsible — collapsed shows name + session count, expanded shows child SessionCards. Move up/down disabled at boundary positions.
- **FFP-485**: SessionCard nested inside PhaseCard — collapsed shows name + exercise count, expanded shows child ExerciseRows. Same reorder pattern.
- **FFP-487**: VideoSelector uses `adminVideosApi.list()` with search filter (debounced). Display title + difficulty + movement type. On select, callback provides video data including default prescription fields for pre-population.
- **FFP-486**: ExerciseForm includes VideoSelector for new exercises + prescription fields. On video selection, pre-populate prescription from video defaults (`defaultSets`, `defaultReps`, `defaultDurationSeconds`, `defaultRestSeconds`, `defaultNotes`). Existing exercises show video name + prescription summary.
- **FFP-488**: "Create Template" button on list page → modal/inline form for metadata (name, slug auto-generated from name, description, difficulty) → on save, navigate to detail page. Handle 409 for duplicate slug.
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
