# FFP - Project State

**Last Updated**: 3rd March 2026
**Current EPIC**: FFP-3 Video Management
**Sprint Status**: Sprint 8 - Video UI & Integration (active — FFP-320 in progress)

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

### FFP-320: Admin Video Upload (8 pts) — Implementation Plan

**Summary**: Admin user (physiotherapist) uploads exercise videos via browser directly to S3 using presigned PUT URLs, then submits metadata to create a video record with status `draft`.

**What already exists**:

- Video DB schema (videos table with all fields incl. s3_key, thumbnail_key, status)
- Zod schemas: `createVideoSchema`, `updateVideoSchema`, `videoFilterSchema` in `packages/core/src/schemas/video.schema.ts`
- Video service + repository (read-only: list, get, filter) in `packages/core/src/videos/`
- Admin router at `packages/functions/src/admin/index.ts` (route registry pattern)
- Frontend route `ADMIN_VIDEOS` at `/admin/videos` (currently `ComingSoonPage` placeholder)
- S3 VideosBucket + AssetsBucket deployed (CORS: GET/HEAD only — **needs PUT**)
- CloudFront video-signing service (for GET/streaming, not uploads)

**Infrastructure prerequisite** (not in Jira — include with FFP-321):

- Update VideosBucket and AssetsBucket CORS to allow PUT method for presigned upload support

#### Phase 1 — Backend APIs (FFP-321 + FFP-327) ✅ COMPLETE

**FFP-321**: Presigned upload URL endpoint (`POST /admin/videos/upload-url`)

- New file: `packages/functions/src/admin/videos/get-upload-url.ts`
- New service: `packages/core/src/videos/video-upload.service.ts` using `@aws-sdk/s3-request-presigner`
- S3 key format: `library/{uuid}.mp4`, 15-min TTL
- Returns: `{ videoUploadUrl, videoS3Key, thumbnailUploadUrl, thumbnailKey, expiresIn }`
- Admin role check enforced, route registered in admin router
- Thumbnail presigned PUT URL for AssetsBucket (`thumbnails/{uuid}.{ext}`) included in same response
- Infrastructure: VideosBucket + AssetsBucket CORS updated to allow PUT; admin Lambda has S3 env vars + `s3:PutObject` permissions

**FFP-327**: Video creation endpoint (`POST /admin/videos`)

- New file: `packages/functions/src/admin/videos/create.ts`
- Added `insertVideo()` to repository, `createVideo()` to service
- Validates with existing `createVideoSchema`, creates record with status `draft`
- Admin role check enforced, route registered in admin router

#### Phase 2 — Upload UI (FFP-322 + FFP-324 + FFP-323) ✅ COMPLETE

**Refactor note**: After initial implementation, the page was restructured per the prototype MVP spec (`.claude/research/video-library-ui-mvp-spec.md`). The upload flow moved from a standalone page into a modal dialog. A reusable `Modal` component was built using existing `Backdrop` + `ScaleFade` motion wrappers.

**FFP-322**: Video Library Management page with upload modal

- New file: `packages/web/src/pages/protected/admin/VideoLibraryPage.tsx` — page shell with header + empty state
- New file: `packages/web/src/pages/protected/admin/UploadVideoModal.tsx` — upload flow in modal
- New file: `packages/web/src/components/modal/Modal.tsx` — reusable modal component (Backdrop + ScaleFade, Escape/scroll lock/focus management)
- Replaced `ComingSoonPage` placeholder in route config
- Drag-and-drop zone + click-to-select file picker inside modal

**FFP-324**: Client-side file validation (built into upload modal)

- MP4 only (`video/mp4`), max 500 MB
- Inline validation errors via StaticAlert inside modal
- Upload button disabled when validation fails

**FFP-323**: Browser-to-S3 upload with progress

- Fetches presigned URL from `POST /admin/videos/upload-url` via `adminVideosApi`
- XHR PUT to presigned URL with `Content-Type: video/mp4`
- Progress bar showing upload percentage with aria attributes
- Error handling with user-friendly messages via StaticAlert
- Modal close disabled during upload to prevent data loss
- On success, shows completion state (metadata form wiring in Phase 3)
- Supporting files: `useVideoUpload` hook, `admin-videos.ts` API client

#### Phase 3 — Metadata, Thumbnails & Integration (FFP-326 + FFP-325 + FFP-328)

All Phase 3 work renders inside the Upload Video modal on the Video Library Management page.

**FFP-326**: Video metadata form component (inside upload modal)

- Form appears below upload zone after successful file upload
- Fields map to DB schema (not prototype spec): title, description (textarea), movementType (select), difficulty (select), bodyParts (multi-value), equipment (multi-value), tags (multi-value), durationSeconds
- Layout: Row 1 (2-col: title + movementType), Row 2 (full: description), Row 3 (3-col: difficulty + bodyParts + equipment), Row 4 (full: tags)
- **Prerequisite**: Extend `FieldDataType` enum and `Form` component to handle `TEXTAREA`, `SELECT`, and multi-value field types
- Client-side Zod validation using existing `createVideoSchema`
- Footer buttons: Cancel (closes modal) + Submit (creates record)

**FFP-325**: Thumbnail upload flow (inside upload modal)

- Optional image file picker (JPEG/PNG, max 5MB) inside the modal
- Upload to AssetsBucket via presigned URL (from Phase 1 endpoint)
- Thumbnail preview after selection inside the modal
- Upload can proceed without thumbnail

**FFP-328**: End-to-end wiring (modal-based flow)

- Full modal flow: click "Upload Video" → modal opens → select file → validate → upload to S3 with progress → show metadata form → optional thumbnail → submit → create video record → success state → upload another or close
- Modal close/cancel handling: confirm if upload in progress, reset form state on close
- Escape key and backdrop click close the modal (with confirmation if upload active)
- "Upload Another" resets modal to initial state
- Error handling at each step via StaticAlert, success via ToastAlert

#### Execution Notes

- **Single branch**: All sub-tasks on `feature/ffp-320-admin-video-upload`
- **Tests**: Deferred to MVP launch
- **Videos table is RLS-excluded** (system-managed, cross-tenant) — no tenant context needed for video CRUD
- **Postman**: Update collection with new admin video endpoints after Phase 1
- **Prototype spec discovered**: `.claude/research/video-library-ui-mvp-spec.md` — describes full Video Library page with search/filters/cards grid. Only the upload modal and page shell are in Sprint 8 scope. Video list UI deferred.
- **Jira tickets updated**: Sprint 8 sub-task descriptions updated to reflect modal-based flow, data shape reconciliation, and form infrastructure prerequisites. FFP-322, FFP-324, FFP-323 transitioned to Done.
- **Form infrastructure gaps for Phase 3**: `FieldDataType` enum needs `TEXTAREA`; `Form` component only renders text/password inputs — needs `SELECT`, `TEXTAREA`, and multi-value handling for metadata form
- **Future scope identified from prototype spec** (not in Sprint 8 — do NOT create tickets):
  - **Video Library list view**: search/filters card + responsive video cards grid (likely FFP-4 or later sprint)
  - **Video Card component**: thumbnail, category/difficulty badges, duration, tags, activate/deactivate toggle
  - **Reusable Modal component**: available at `packages/web/src/components/modal/` for future use across the app

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
