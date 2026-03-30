# FFP - Project State

**Last Updated**: 30th March 2026
**Current EPIC**: FFP-4 Programme Execution & Progress
**Sprint Status**: Sprint 11 in progress. Picking up FFP-553.

---

## Current: FFP-553 — Assessment Page for Programme Users (3 SP)

**Branch**: `feature/sprint11`
**Status**: Complete — ready for review

### Summary

Create an assessment overview page accessible from the programme user sidebar. For MVP this page contains only the reassessment CTA (moved from ProgressPage). Post-MVP, scores and trends will be added (FFP-552, backlog).

### Acceptance Criteria

- AC1: New route `/assessment-overview` accessible to `programme_user` role
- AC2: Page shows a clear CTA to start a new assessment (reassessment flow)
- AC3: CTA navigates to existing AssessmentPage with `?reassess=true` and the user's `assessmentFlowId`
- AC4: Uses existing `useUserAssessmentStatusQuery` to get `assessmentFlowId`
- AC5: Uses `PageContainer` and `PageHeader` components
- AC6: Added to programme user sidebar navigation
- AC7: Remove the reassessment CTA from the existing ProgressPage

### Implementation Plan (Single Group, Single Branch)

No subtasks in Jira — all work done as one unit:

1. Add `ASSESSMENT_OVERVIEW` to `RouteKey` enum
2. Create `AssessmentOverviewPage.tsx` in `pages/protected/programme-user/`
   - Uses `PageContainer` (centred), `PageHeader`
   - Uses `SectionPanel` + `SectionHeader` with reassessment CTA (lifted from ProgressPage)
   - Uses `useUserAssessmentStatusQuery` for `assessmentFlowId`
   - Reuses exact `handleStartReassessment` pattern (sessionStorage flag + navigate)
3. Add route config in `routes/index.ts` — path `/assessment-overview`, `allowedRoles: [PROGRAMME_USER]`
4. Add nav item to `programmeUserNavItems` in `navigation.ts`
5. Remove reassessment CTA section from `ProgressPage.tsx`

### Reference Files

- CTA source: `packages/web/src/pages/protected/programme-user/ProgressPage.tsx` (lines 23-60)
- Hook: `packages/web/src/hooks/assessments/useUserAssessmentStatusQuery.ts`
- Routes: `packages/web/src/pages/routes/index.ts`
- Route keys: `packages/web/src/pages/routes/RouteKey.ts`
- Navigation: `packages/web/src/config/navigation.ts` (programmeUserNavItems, lines 72-106)
- Layout: `packages/web/src/components/layout/PageContainer.tsx`, `PageHeader.tsx`

---

## Completed: FFP-354 — User Sessions & Exercise Completions Schema (5 SP) ✅

**Branch**: `feature/sprint11`

Delivered: Drizzle schemas for `user_sessions` + `exercise_completions`, `session_status` enum, migration 0022, RLS policies (9 tables total), Zod validation schemas in `packages/core/src/schemas/session.schema.ts`. Key amendments: `tenant_id` → `organisation_id`, added `paused_at` column.

---

## FFP-4 Programme Execution & Progress — Sprints 11–12 (~56 SP)

**Status**: Sprint 11 in progress. FFP-354 done, picking up FFP-553.

**Discovery branch**: `discovery/programme-execution-ux` (prototype pages for reference, cleanup in FFP-550)

### Sprint 11: Backend + Assessment Page (~26 SP)

| Key     | Summary                                                             | SP  |
| ------- | ------------------------------------------------------------------- | --- |
| FFP-354 | Schema: user_sessions + exercise_completions (includes `paused_at`) | 5   |
| FFP-361 | Programme Detail API with Tiered Visibility                         | 5   |
| FFP-362 | Session Lifecycle & Exercise Completion APIs                        | 8   |
| FFP-363 | Progress Summary API (simplified)                                   | 5   |
| FFP-553 | Assessment page for programme users (MVP — reassessment CTA)        | 3   |

### Sprint 12: Frontend Pages + Polish (~30 SP)

| Key     | Summary                                                                | SP  |
| ------- | ---------------------------------------------------------------------- | --- |
| FFP-386 | Dashboard Page (hero session card, phase detail, programme progress)   | 8   |
| FFP-387 | Programme Overview (vertical timeline, scroll-driven reveal)           | 8   |
| FFP-388 | Session Workout (full-screen, exercise-first, rest timer, exit dialog) | 8   |
| FFP-416 | Progress Page (programme/phase progress only, reduced scope)           | 3   |
| FFP-417 | Integration verification and documentation                             | 3   |
| FFP-550 | Remove discovery prototype mock pages                                  | 1   |

### Key Decisions from Discovery

- Vertical timeline with scroll-driven animation for programme overview
- Exercise-first session layout with collapsible sidebar, full-screen mode
- Dashboard order: Session → Phase → Programme (immediate to broad)
- "Your Next Session" framing (not "Today's Session")
- User-initiated rest timer (replaces content inline, no auto-advance)
- Two-intent exit flow: pause vs done for today
- Dark blue (`ffp-dark-blue`) for active states, solid colour badges throughout
- Exercise detail is inline (not separate page) — FFP-415 deleted
- Reassessment CTA moved from Progress to new Assessment page (FFP-553)
- `paused_at` flag on sessions for MVP; full audit trail deferred (FFP-551)
- ProgressBar extracted from existing AssessmentProgress component
- Rest timer and scroll animations included in MVP
- Media container abstraction on session page (future CV integration)

**Full planning details**: `.claude/research/programme/ffp4-sprint-planning-brief.md`
**UX research & design decisions**: `.claude/research/programme/programme-execution-ux-research.md`

**Full details**: `.claude/research/programme/programme-execution-ux-research.md`

---

## Completed: Sprint 10 + 10.5 — Customer & User Management + Organisation/Location Refactor (~52 pts)

**Dates**: 19th March – 23rd March 2026
**Epic**: FFP-6 (MVP: Customer & User Onboarding)
**Merge strategy**: `feature/sprint10.5` → `feature/sprint10` → `main`

### Sprint 10 (~18 pts) — Customer & User Management

**Goal**: Admin CRUD for customers and programme users — backend APIs and admin UI for both, including Cognito user provisioning.

| Key     | Summary                           | Pts |
| ------- | --------------------------------- | --- |
| FFP-494 | Customer admin backend APIs       | 3   |
| FFP-495 | Customer admin UI                 | 5   |
| FFP-496 | Programme user admin backend APIs | 5   |
| FFP-497 | Programme user admin UI           | 5   |

### Sprint 10.5 (~34 pts) — Organisation/Location Refactor

**Goal**: Rename tenant/customer model to organisation/location — supporting multi-location businesses (one organisation, many locations). Full-stack refactor across database, backend, API, frontend, and documentation.

| Key     | Summary                                  | Layer    | Pts |
| ------- | ---------------------------------------- | -------- | --- |
| FFP-519 | DB migration — rename tables/columns/RLS | Database | 8   |
| FFP-520 | Backend service split + renames          | Backend  | 8   |
| FFP-521 | Lambda handlers + API routes             | Backend  | 5   |
| FFP-522 | Organisation list and create/edit pages  | Frontend | 5   |
| FFP-523 | Location pages + user page updates       | Frontend | 5   |
| FFP-524 | Documentation cleanup + E2E smoke test   | Docs     | 3   |

### Key Deliverables

- **Data model**: `tenants` → `organisations`, `customers` → `locations` (1:N relationship)
- **Database**: Migration 0021 — renames tables, columns, enums, indexes, FK constraints, RLS policies. New `organisation_status` enum and `status` column on organisations
- **RLS**: GUC variable `app.tenant_id` → `app.organisation_id`, all policies renamed, `SET LOCAL` for transaction-scoped context
- **Backend**: `createCustomer` split into `createOrganisation` + `createLocation`. `OrganisationContext` replaces `TenantContext`. ~40 files renamed across core/functions/seed
- **API**: New endpoints — `/admin/organisations` (CRUD), `/admin/organisations/{orgId}/locations` (create), `/admin/locations` (list/get/update). Old `/admin/customers` and `/admin/create-customer` removed
- **Frontend**: Organisation and location admin pages (list + create/edit). User pages updated — location dropdown replaces customer dropdown. `AuthUser.tenantId` → `organisationId`
- **Security**: Platform organisation excluded from admin CRUD queries. Cognito attributes unchanged (aliased via `COGNITO_CUSTOM_ATTRIBUTES`)
- **Documentation**: All 20+ markdown files updated. Git hooks re-enabled
- **Postman**: Organisation Management + Location Management folders (8 requests). Old Create Customer deleted

### Key Patterns & Decisions (Organisation/Location)

| Area                   | Decision                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Cognito Attributes** | Immutable — code aliases `ORGANISATION_ID: 'custom:tenantId'`, `LOCATION_ID: 'custom:customerId'` |
| **Platform Exclusion** | `ne(organisations.type, 'platform')` filter on all admin CRUD queries                             |
| **User Role Values**   | `customer_owner`, `customer_admin` unchanged — PostgreSQL enum values                             |
| **Location Create**    | Nested under org: `POST /admin/organisations/{orgId}/locations`                                   |
| **Location List**      | Top-level with filter: `GET /admin/locations?organisationId=`                                     |
| **User → Location**    | `organisationId` derived from location record, never from client input                            |
| **RLS SET LOCAL**      | Transaction-scoped to prevent GUC leaking across pooled connections                               |

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

### Key Patterns & Decisions (Programme Templates)

| Area                     | Decision                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Hierarchy CRUD**       | Nested accordion UI — phases → sessions → exercises, each with inline create/edit/delete/reorder |
| **Reorder**              | Move up/down buttons (drag-and-drop deferred), `sort_order` column with swap logic               |
| **Video as Exercise**    | No separate exercise entity — videos table extended with default prescription fields             |
| **Prescription Pattern** | Defaults from video, overridable per session-exercise via `session_exercises` join table         |
| **Auto-compute**         | `total_phases` incremented/decremented on phase create/delete, not user-editable                 |

---

## Completed: FFP-3 Video Management (Sprints 7-8, ~55 pts)

**Dates**: 23rd February – 24th March 2026
**Sprint Goal**: Video catalogue, CloudFront signed URLs, admin upload/management UI, video player, programme-video relationships.

| Sprint | Focus                  | Pts | Key Stories                                                                       |
| ------ | ---------------------- | --- | --------------------------------------------------------------------------------- |
| 7      | Infrastructure & APIs  | 28  | Video schema, CloudFront OAC, signed URLs, catalogue APIs, programme-video schema |
| 8      | Admin UI & Integration | 27  | Video player, table component, admin CRUD, upload, verification                   |

### Key Patterns & Decisions (Video Management + Admin UI)

| Area                   | Decision                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Table Component**    | TanStack Table v8, `createColumns<T>()` factory (7 cell types), `useApiTable` hook, server-side pagination/sorting |
| **Pagination**         | Backend schemas (`paginationInputSchema`, `buildPaginationMeta`) + `applyPagination` Drizzle helper                |
| **Admin CRUD Pattern** | List page (Table + TableControls + filters) → Edit page (ComposableForm + inline preview)                          |
| **Upload Pattern**     | Presigned S3 PUT URLs, `useVideoUpload` hook with `useReducer` phases (`idle→uploading→creating→success→error`)    |
| **Video Status**       | `draft→active→archived` with restore; status transitions via `PUT /admin/videos/{id}`                              |
| **Reusable Layout**    | `PageContainer`, `PageHeader`, `StatusResult`, `ContentPanel`, `ComposableForm`, `Panel`                           |
| **Context Nav**        | `contextNavItems` on routes for pages that override sidebar navigation                                             |
| **Date Formatting**    | `Intl.DateTimeFormat('en-GB')` throughout                                                                          |
| **RLS Exclusions**     | System-managed tables (videos, templates, phases, sessions, exercises) — cross-organisation by design              |

### Programme Data Model Decisions (from Sprint 6 planning)

- Programme → Phases → Sessions → Exercises (status-driven, not calendar-based)
- "Phases" replace "weeks" as the structural unit (co-founder decision, 1st March 2026)
- Hybrid instantiation: phases created eagerly at assignment, sessions/completions lazily
- Normalised `exercise_completions` table (not JSONB)
- `programme_phases` (user-layer, RLS) created in FFP-3; `user_sessions` and `exercise_completions` deferred to FFP-4

### Backlog Items

- Icon enum refactor — convert string icon names in navigation.ts to use Icons const enum
- Assessment resume should return to exact question, not section start — on re-login, user resumes at section 2/9 step 1/6 instead of section 4/9 step 1/6 where they left off. Answers are preserved but navigation position resets to current section start. Discovered during FFP-281 E2E testing.

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

| Area                | Decision                                                                      |
| ------------------- | ----------------------------------------------------------------------------- |
| **State Machine**   | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`)  |
| **Job Queue**       | DB-driven polling, `FOR UPDATE SKIP LOCKED`, exponential backoff, 2 job types |
| **Scoring**         | Multi-dimensional with weighted dimensions, flow-level config                 |
| **Branching**       | `goto_step`, `show_warning` actions with condition evaluators                 |
| **Programme Gen**   | `score_assessment` → `generate_programme` job chain, retakes skip creation    |
| **Frontend State**  | React Context + useReducer (audited 2026, kept over Zustand/XState/Jotai)     |
| **API Client**      | TanStack Query with typed hooks in `hooks/assessments/`                       |
| **Results Polling** | `useAssessmentResultsQuery` polls every 2s, stops on scores                   |
| **First Login**     | Redirect programme users without programme to assessment via user-status API  |

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
  await setRLSContext(tx, context.organisationId);
  return await tx.query.users.findMany();
});
```

**JWT Claims**: `custom:tenantId` (maps to organisationId), `custom:customerId` (maps to locationId), `custom:role`

**RLS exclusions**: `process_jobs`, `assessment_templates`, `assessment_flows`, `questions`, `template_questions`, `programme_templates`, `template_phases`, `template_sessions`, `session_exercises`, `videos` (system-managed, cross-organisation by design)

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
- ✅ FFP-6: Customer & User Onboarding (Sprints 10-10.5, ~52 pts)
- ⏳ FFP-4: Programme Execution & Progress (Sprints 11-12)
- ⏳ FFP-109: Deployment Readiness (staging + production)

---

**For implementation details**: domain-specific docs in `project-documentation/`
