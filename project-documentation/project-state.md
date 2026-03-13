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
| 2     | Main  | FFP-445 | Programme template admin list page         | 5   | In Progress |
| 3     | Main  | FFP-444 | Session exercise backend APIs              | 5   | To Do       |
| 4     | Main  | FFP-446 | Template detail & hierarchy editing UI     | 8   | To Do       |
| 5     | Main  | FFP-447 | Integration verification & documentation   | 3   | To Do       |

**Out of scope**: Drag-and-drop reordering (MVP uses move up/down), template duplication/cloning, template versioning, bulk import/export.

### Active Story: FFP-445 — Programme Template List Page (5 pts)

**Branch**: `feature/sprint9` (continuing on sprint branch)
**Goal**: Replace the Coming Soon placeholder at `/admin/templates` with a functional list page following the Video Library pattern (FFP-332). Reuses Table component (FFP-437), TableControls, and useApiTable hook.

**Sub-task execution order** (single branch, all sub-tasks together):

| Order | Key     | Summary                                       | Layer | Status |
| ----- | ------- | --------------------------------------------- | ----- | ------ |
| 1     | FFP-474 | API client methods for template endpoints     | Web   | Done   |
| 2     | FFP-475 | TanStack Query hooks for list and mutations   | Web   | Done   |
| 3     | FFP-476 | Column definitions for template list table    | Web   | To Do  |
| 4     | FFP-479 | Context-aware empty state component           | Web   | To Do  |
| 5     | FFP-477 | TemplateListPage with Table and TableControls | Web   | To Do  |
| 6     | FFP-478 | Route config and sidebar navigation update    | Web   | To Do  |

**Amended requirements**:

- **Route title correction**: Current route says "Session Templates" — should be "Programme Templates" to match the domain model.
- **AC5 View Detail/Edit actions**: Detail page is out of scope for this story (covered in FFP-446). Actions will navigate to `${adminBasePath}/templates/:id` which will initially 404 / show Coming Soon until FFP-446 is implemented. Alternatively, disable these actions for now.
- **Status column**: `isActive` is a boolean, not a multi-state enum like video status. Map to "Active"/"Inactive" using StatusCell with a simple two-value `statusMap`.
- **AC5 Deactivate/Activate**: Toggle `isActive` via existing `PUT /admin/programme-templates/:id` endpoint (update mutation with `{ isActive: true/false }`).
- **AC6 Create Template**: Button navigates to future creation route. Wire to `${adminBasePath}/templates/create` — will 404 until FFP-446.
- **FFP-474 API client**: Follow `admin-videos.ts` pattern. Base path `/admin/programme-templates`. Methods: `list`, `get`, `create`, `update`, `deactivate`. Response validation via `parseApiResponse` with existing Zod schemas from `@ffp/core` (`paginatedTemplateListResponseSchema`, `templateDetailResponseSchema`).
- **FFP-475 Query hooks**: Follow `useAdminVideosQuery` pattern. Query keys in `lib/query/keys/programme-templates.ts`. Hooks in `hooks/programme-templates/`.
- **FFP-476 Columns**: Use `createColumns<TemplateRow>()` factory. Columns: Name (text, sortable), Slug (text), Difficulty (text, sortable), Phases (number — `totalPhases`), Sessions/Phase (number — `sessionsPerPhase`), Status (status — `isActive` mapped), Created (date, sortable), Actions.
- **FFP-479 Empty state**: Follow `VideoLibraryEmptyState` pattern with `StatusResult`. Two states: no templates ("Create Template" CTA) vs no filter results ("Clear Filters" hint).
- **FFP-478 Route update**: Replace `ComingSoonPage` with `TemplateListPage`. Update title to "Programme Templates". Sidebar nav entry likely already exists — verify and update label/icon if needed.
- **Tests deferred** per sprint convention.

**New files to create**:

- `packages/web/src/lib/api/endpoints/admin-programme-templates.ts` — API client methods
- `packages/web/src/lib/query/keys/programme-templates.ts` — Query key factory
- `packages/web/src/hooks/programme-templates/useAdminTemplatesQuery.ts` — List query hook
- `packages/web/src/hooks/programme-templates/useTemplateMutations.ts` — Update/deactivate mutations
- `packages/web/src/hooks/programme-templates/index.ts` — Barrel export
- `packages/web/src/pages/protected/admin/programme-template-list/columns.tsx` — Column definitions
- `packages/web/src/pages/protected/admin/programme-template-list/constants.ts` — Status map, filter config
- `packages/web/src/pages/protected/admin/programme-template-list/TemplateListEmptyState.tsx` — Empty state
- `packages/web/src/pages/protected/admin/TemplateListPage.tsx` — Main page component

**Existing files to modify**:

- `packages/web/src/pages/routes/index.ts` — Replace ComingSoonPage with TemplateListPage, update title
- `packages/web/src/config/navigation.ts` — Verify/update Templates nav item label and icon

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
- ⏳ FFP-4: Programme Execution & Progress (Sprints 10-12)
- ⏳ FFP-109: Deployment Readiness (staging + production)
- ⏳ FFP-6: Customer & User Onboarding

---

**For implementation details**: domain-specific docs in `project-documentation/`
