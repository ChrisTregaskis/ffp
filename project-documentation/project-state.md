# FFP - Project State

**Last Updated**: 11th March 2026
**Current EPIC**: FFP-3 Video Management
**Sprint Status**: Sprint 8 - Video UI & Integration (active — FFP-329 next)

---

## Active: Sprint 8 - Video UI & Integration (~27 pts)

**Dates**: 4th March - 24th March 2026
**Sprint Goal**: Admin video upload/management UI, video player component, integration verification, documentation update.
**Epic**: FFP-3 Video Management
**Branch**: `feature/sprint8`

**Key documents**:

- `.claude/research/video-management-research.md` - Video infrastructure research & confirmed decisions
- `.claude/research/ffp-3-epic-plan.md` - Final epic plan (stories, ACs, subtasks, sprint allocation)
- `.claude/research/programme-data-model-research.md` - Authoritative programme data model

**Prerequisites from Sprint 7** (all met):

- Video catalogue schema + APIs (FFP-282, FFP-300)
- CloudFront OAC + signed URL infrastructure (FFP-288, FFP-294)
- Programme-video relationship schema + service evolution (FFP-307)

---

### FFP-337: Video Player Component (5 SP) — COMPLETE

**Branch**: `feature/ffp-337-video-player-component` (merged)
**Deliverables**: VideoPlayer component (dual-mode: videoId/src), TanStack Query hooks (`useVideosQuery`, `useVideoQuery`, `useVideoSignedUrlQuery`), `videosApi` client, loading/error/retry states, responsive styling.

---

### FFP-437: Reusable Table Component & Backend Pagination Pattern (5 SP) — COMPLETE

**Branch**: `feature/ffp-437-table-component`
**Deliverables**: Backend pagination schemas (`paginationInputSchema`, `paginationMetaSchema`, `createPaginatedResponseSchema`, `buildPaginationMeta`) + `applyPagination` Drizzle helper. Frontend `Table` component (TanStack Table v8 wrapper with `manualPagination`/`manualSorting`), `createColumns<T>()` factory (7 cell components: TextCell, NumberCell, DateCell, StatusCell, TagsCell, DurationCell, ActionsCell), `useApiTable` hook (300ms debounce, page reset on sort change, memoised queryParams). Sub-components: TableHeader, SortIndicator, TableBody, TablePagination, PageSizeSelect, TableColumnVisibility, TableControls, TableLoading/TableEmpty/TableError states.

**DRY refactoring pass**: `useClickOutside` hook (shared by 4 components), headless `BaseSelect` (Select + FormSelect are thin wrappers), `ButtonProps` extended with native HTML attributes, `DropdownMenu` uses `Button` + `renderContent` prop, `TablePagination` uses `Button`, alignment utility functions for table columns. `Panel` primitive (lightweight surface for toolbars/control bars). `SearchInput` clear button uses `IconButton`. `formatDate` and `formatDuration` lifted to shared `utils/format.ts`.

**Key design decisions**: Filters external to table (page-level), server-side only, actions as column helper, `Intl.DateTimeFormat('en-GB')` for dates, pagination schemas browser-safe via `@ffp/core`, Drizzle helper server-only via `@ffp/core/server`.

---

### FFP-329: Admin Video Metadata Management (8 SP) — Implementation Plan

**Branch**: `feature/ffp-329-vid-metadata-management-implementation` (single branch — all sub-tasks tightly coupled)
**Scope**: Full-stack. Admin CRUD for video catalogue: list all videos (inc. draft/archived), edit metadata, manage status transitions, filter/search, video preview.
**Dependencies**: FFP-320 (Admin Video Upload) — DONE, FFP-437 (Reusable Table + Pagination) — DONE
**Blocks**: FFP-343 (Sprint 8 Integration & Verification)

**What already exists**:

- **DB schema**: `videos` table with status enum (`draft`/`active`/`archived`), difficulty, movement_type, body_parts, equipment, tags, GIN indexes
- **Table component** (FFP-437): `Table` (TanStack Table v8, manual pagination/sorting), `TableControls` (search + filter dropdowns + column visibility + clear all), `createColumns<T>()` factory (7 cell types: Text, Number, Date, Status, Tags, Duration, Actions), `useApiTable` hook (300ms debounce, page reset on sort/search/filter change, memoised `queryParams`)
- **Pagination pattern** (FFP-437): `paginationInputSchema`, `paginationMetaSchema`, `createPaginatedResponseSchema`, `buildPaginationMeta`, `applyPagination` Drizzle helper
- **Core services**: `video.service.ts` (create, listVideos, getVideo, listVideosByFilter), `video-signing.service.ts` (CloudFront signed URLs)
- **Core repository**: `video.repository.ts` (insertVideo, findVideoById, findAllActive, findByFilters)
- **Zod schemas**: `createVideoSchema`, `updateVideoSchema`, `videoListResponseSchema`, `videoFilterSchema`
- **Admin handlers**: `POST /admin/videos/upload-url`, `POST /admin/videos` (create record)
- **Public APIs**: `GET /videos` (active only), `GET /videos/:id`, `GET /videos/:id/signed-url`
- **Frontend pages**: `VideoLibraryPage.tsx` (placeholder — empty state), `VideoUploadPage.tsx` (complete)
- **Form components**: `VideoMetadataForm`, `VideoMetadataFormFields` (reusable for editing)
- **Video components**: `VideoPlayer` (HTML5, dual-mode), `VideoLoadingSkeleton`, `VideoErrorState`
- **Hooks**: `useVideosQuery` (active only), `useVideoQuery`, `useVideoSignedUrlQuery`, `useVideoUpload`
- **API client**: `adminVideosApi` (getUploadUrl, createVideo), `videosApi` (list, get, getSignedUrl)
- **Shared components**: `Modal`, `PageContainer`, `PageHeader`, `StatusResult`, `SearchInput`, `Select`, `Button`, `IconButton`, `Panel`

**What needs building**:

Backend:

- `findAllVideos(db, paginationInput, filters)` — admin repository fn (all statuses, paginated, filterable)
- `updateVideo(db, id, data)` — repository fn
- `listAdminVideos(ctx, paginationInput, filters)` — service fn
- `updateVideo(ctx, id, data)` — service fn with status transition validation
- `GET /admin/videos` handler — paginated, with query params: page, pageSize, sortBy, sortDirection, search, status, difficulty
- `PUT /admin/videos/{id}` handler — partial metadata update including status changes
- Admin video filter schema (extends `videoFilterSchema` with search + status params)

Frontend:

- `adminVideosApi.list(params)` + `adminVideosApi.updateVideo(id, data)` API client methods
- `useAdminVideosQuery(params)` hook + `useUpdateVideoMutation()` hook
- `VideoLibraryPage.tsx` — replace placeholder with `Table` + `TableControls` + column definitions
- `/admin/videos/:id` edit page — reuse `VideoMetadataFormFields`, status dropdown, `useUpdateVideoMutation`
- Status quick-actions in list `ActionsCell` (Publish, Archive) + confirmation dialog for archiving
- Inline video preview on edit page — `VideoPlayer` + `useVideoSignedUrlQuery` above form

**Amended requirements**:

- **FFP-332**: Ticket says `VideosPage.tsx` — use existing `VideoLibraryPage.tsx` (already in routes). Uses `Table` component from FFP-437 with `useApiTable` hook — not a custom table/grid.
- **FFP-333**: Dedicated edit page at `/admin/videos/:id` (not modal) — consistent with upload being a dedicated page. No `/edit` suffix: admin context implies editing, no read-only detail view planned.
- **FFP-334**: Merges into FFP-333 (status field in edit form) and FFP-332 (quick-action buttons in `ActionsCell`). Not a separate UI concern — status is just a field on the update API.
- **FFP-335**: Merges into FFP-330 (backend filter params) and FFP-332 (frontend `TableControls`). Server-side filtering via query params on `GET /admin/videos`. Filter UI uses `TableControls` from FFP-437 (search input with debounce, filter dropdowns) — page-level, external to Table. Building filters alongside the table from the start is more natural than retrofitting.
- **FFP-336**: `VideoPlayer` and `useVideoSignedUrlQuery` already exist — render inline on edit page above the form (not a modal, no list page preview action).
- Tests deferred until MVP launch per sprint policy.

#### Execution Order

| Order | Sub-tasks         | Summary                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----- | ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FFP-330 + FFP-331 | Backend APIs (list + update)         | ✅ DONE. FFP-330: `GET /admin/videos` (paginated, filtered). FFP-331: `PUT /admin/videos/{id}` (partial update, status transitions: draft→active, active→archived, archived→draft/active). Postman requests added for both.                                                                                                                                                                                                       |
| 2     | FFP-332 + FFP-335 | Video list page with Table + filters | ✅ DONE. `adminVideosApi.list()`, `useAdminVideosQuery`, `useApiTable`, `Table` with 9 columns + `TableControls` (search + status/difficulty filters). Default visibility hides movementType/updatedAt/tags. Context-aware empty state.                                                                                                                                                                                           |
| 3     | FFP-333 + FFP-334 | Edit page + status management        | ✅ DONE. `/admin/videos/:id` edit page with `VideoEditFormFields` (reuses `VideoMetadataFormFields` + status dropdown via `additionalFields` slot), `useUpdateVideoMutation`, `ArchiveVideoModal` (shared). List quick-actions: Edit, Publish, Archive (confirm), Restore. Edit page loads all statuses via `?include_inactive=true`. `PageState` component for loading/error states. Sticky table header, dropdown overflow fix. |
| 4     | FFP-336           | Inline video preview on edit page    | `VideoPlayer` + `useVideoSignedUrlQuery` rendered above form on edit page. No list page preview action — users navigate to edit page to preview.                                                                                                                                                                                                                                                                                  |
| —     | —                 | Manual verification                  | E2E: upload → list → filter → edit → status change → preview. Verify all statuses visible in admin list.                                                                                                                                                                                                                                                                                                                          |

---

### FFP-320: Admin Video Upload (8 pts) — ✅ COMPLETE

**Summary**: Browser-to-S3 video upload with presigned PUT URLs, metadata form, optional thumbnail, and video record creation.

**Key deliverables**:

- **Backend**: `POST /admin/videos/upload-url` (presigned S3 PUT), `POST /admin/videos` (create record), `DELETE /admin/videos/:id` (hard delete + S3 cleanup)
- **Upload page**: Dedicated `/admin/videos/upload` page with drag-and-drop, XHR progress bar, metadata form (title, description, movement type, difficulty, body parts, equipment, tags, duration), optional thumbnail
- **State management**: `useVideoUpload` hook with `useReducer` — phases: `idle` | `uploading` | `creating` | `success` | `error`
- **Form infrastructure**: `FormTextarea`, `FormSelect`, `FormTagInput` components; `TEXTAREA`, `SELECT`, `TAG_INPUT` field types
- **Reusable components**: `Modal`, `PageContainer`, `PageHeader`, `StatusResult`, context-aware sidebar navigation
- **Infrastructure**: VideosBucket + AssetsBucket CORS updated for PUT; admin Lambda has `s3:PutObject` + `s3:DeleteObject` permissions

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

**For implementation details**: domain-specific docs in `project-documentation/`
