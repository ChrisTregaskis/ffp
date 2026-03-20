# FFP - Project State

**Last Updated**: 19th March 2026
**Current EPIC**: FFP-6 Customer & User Onboarding
**Sprint Status**: Sprint 10 - Customer & User Management (in progress)

---

## Active: Sprint 10 — Customer & User Management (~18 pts)

**Dates**: 19th March – 9th April 2026
**Sprint Goal**: Admin CRUD for customers and programme users — backend APIs and admin UI for both, including Cognito user provisioning.
**Epic**: FFP-6 (MVP: Customer & User Onboarding)
**Branch**: `feature/sprint10`

**Execution plan**: `.claude/plans/sprint-10-execution-plan.md`

**Prerequisites** (all met):

- ✅ Customers and users database schema (existing)
- ✅ `POST /admin/create-customer` endpoint (existing)
- ✅ Table component + pagination pattern (FFP-437)
- ✅ Admin UI patterns (Video Library, Programme Template List)
- ✅ ComposableForm, PageContainer, PageHeader, StatusResult components
- ✅ Cognito user pool and admin SDK configuration

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

### Active Story: FFP-495 — Customer Management UI (5 pts)

**Branch**: `feature/sprint10`
**Goal**: Admin UI for customer management — list page with table, create/edit forms, routes, and navigation. Follows TemplateListPage and VideoEditPage patterns.

**Sub-task execution order** (single branch, all sub-tasks together):

| Order | Key     | Summary                                            | Status |
| ----- | ------- | -------------------------------------------------- | ------ |
| 1     | FFP-502 | API client methods for customer admin endpoints    | To Do  |
| 2     | FFP-503 | TanStack Query hooks for customer list/mutations   | To Do  |
| 3     | FFP-506 | Route config and sidebar navigation                | To Do  |
| 4     | FFP-504 | CustomerListPage with table, columns, empty state  | To Do  |
| 5     | FFP-505 | Customer create and edit pages with ComposableForm | To Do  |

**Amended requirements**:

- **FFP-502**: Backend returns data directly (not wrapped). Use `paginatedCustomerResponseSchema` and `customerDetailResponseSchema` from `@ffp/core`. Create endpoint uses existing `POST /admin/create-customer` path.
- **FFP-503**: Follow `useAdminTemplatesQuery` + `useTemplateMutations` patterns. Query key factory + list/detail/mutation hooks.
- **FFP-506**: Moved before pages — add `ADMIN_CUSTOMER_CREATE` and `ADMIN_CUSTOMER_EDIT` to `RouteKey`. Replace `ComingSoonPage` for customers.
- **FFP-504**: Follow `TemplateListPage` pattern. Status filter (active/suspended/inactive), search by name/account code. Row actions: Edit + status toggle.
- **FFP-505**: Single `CustomerEditPage` for create (no `:id`) and edit (with `:id`). Address fields: line1, line2, city, county, postcode, country. Status only in edit mode.
- **Tests deferred** per sprint convention.

**End-of-sprint note**: Before merging `feature/sprint10` to `main`, run manual E2E verification via Claude Code (same approach as Sprint 9 — FFP-447). Cover full CRUD flows for customers and users, cascade behaviours, and Postman collection updates.

---

## Completed: FFP-439 Admin Programme Template Management (Sprint 9, ~34 pts)

**Dates**: 12th March – 19th March 2026
**Sprint Goal**: Full CRUD for admin programme template hierarchy — templates, phases, sessions, exercises — with video default prescription fields and admin UI.

| Phase | Key     | Summary                                    | Pts |
| ----- | ------- | ------------------------------------------ | --- |
| 1     | FFP-441 | Video default exercise prescription fields | 3   |
| 1     | FFP-442 | Programme template backend APIs            | 5   |
| 2     | FFP-443 | Phase & session backend APIs               | 5   |
| 2     | FFP-445 | Programme template admin list page         | 5   |
| 3     | FFP-444 | Session exercise backend APIs              | 5   |
| 4     | FFP-446 | Template detail & hierarchy editing UI     | 8   |
| 5     | FFP-447 | Integration verification & documentation   | 3   |

### Key Deliverables

- **Template CRUD**: Full hierarchy management — templates, phases, sessions, exercises with move up/down reordering
- **Video prescription defaults**: Extended `videos` table with sets, reps, duration, rest, notes — pre-populates when adding to sessions
- **Admin UI**: Template list page with active filter + template detail page with collapsible hierarchy editing
- **Schema cleanup**: Dropped `sessions_per_phase`, auto-computed `total_phases` on phase create/delete
- **Postman**: Full test flows for template hierarchy CRUD

### Key Patterns & Decisions (Programme Templates)

| Area                     | Decision                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Hierarchy CRUD**       | Nested accordion UI — phases → sessions → exercises, each with inline create/edit/delete/reorder |
| **Reorder**              | Move up/down buttons (drag-and-drop deferred), `sort_order` column with swap logic               |
| **Video as Exercise**    | No separate exercise entity — videos table extended with default prescription fields             |
| **Prescription Pattern** | Defaults from video, overridable per session-exercise via `session_exercises` join table         |
| **Auto-compute**         | `total_phases` incremented/decremented on phase create/delete, not user-editable                 |

**Out of scope**: Drag-and-drop reordering, template duplication/cloning, template versioning, bulk import/export.

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
- ✅ FFP-439: Admin Programme Template Management (Sprint 9, ~34 pts)
- ⏳ FFP-6: Customer & User Onboarding (Sprint 10, ~18 pts)
- ⏳ FFP-4: Programme Execution & Progress (Sprints 11-13)
- ⏳ FFP-109: Deployment Readiness (staging + production)

---

**For implementation details**: domain-specific docs in `project-documentation/`
