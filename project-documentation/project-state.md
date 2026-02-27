# FFP - Project State

**Last Updated**: 26th February 2026
**Current EPIC**: FFP-3 Video Management
**Sprint Status**: Sprint 7 - Video Infrastructure & APIs (in progress)

---

## Current: Sprint 7 - Video Infrastructure & APIs (~28 pts)

**Dates**: 23rd February 2026 onwards
**Sprint Goal**: Video catalogue schema, CloudFront signed URLs, video APIs, programme-video relationships.
**Epic**: FFP-3 Video Management

**Key documents**:

- `.claude/research/video-management-research.md` - Video infrastructure research & confirmed decisions
- `.claude/research/ffp-3-epic-plan.md` - Final epic plan (stories, ACs, subtasks, sprint allocation)
- `.claude/research/programme-data-model-research.md` - Authoritative programme data model

### Completed Story: FFP-282 — Video Catalogue Database Schema (5 pts) ✅

**Branch**: `feature/ffp-282-video-cat-database-schema` (merged to main)
**All 5 sub-tasks complete**: Drizzle schema + enums + GIN indexes, index exports, migration (0017), Zod schemas, seed data (10 videos).

### Parallel Story: FFP-288 — CloudFront OAC & Signed URL Infrastructure (5 pts)

**Branch**: `feature/ffp-288` (in worktree at `.claude/worktrees/ffp-288/`)
**Status**: In Progress (parallel work)
**Touches**: `sst.config.ts`, `scripts/setup-cloudfront-signing-key.sh`, `project-state.md`

### Active Story: FFP-294 — Signed URL Generation Service (5 pts)

**Branch**: `feature/ffp-294-signed-url-generation-service`
**Status**: Planning
**Blocked by**: FFP-282 ✅ (Done), FFP-288 🏃 (In Progress — runtime dependency only, code can be written independently)
**Blocks**: FFP-300 (Video Catalogue APIs), FFP-320 (Admin Video Upload), FFP-337 (Video Player Component)

**Summary**: Create the service layer that generates time-limited CloudFront signed URLs for secure video playback. Retrieves the signing private key from Secrets Manager (cached at module level for Lambda warm instances), generates canned policy signed URLs with 15-minute TTL, and audit-logs all video access events.

**Sub-tasks (execution order)**:

| #   | Key     | Sub-task                                        | Status  | Notes                                             |
| --- | ------- | ----------------------------------------------- | ------- | ------------------------------------------------- |
| 1   | FFP-295 | Install AWS SDK dependencies                    | Pending | Amended: also install `client-secrets-manager`    |
| 2   | FFP-296 | Signing key retrieval with module-level caching | Pending | + video.repository.ts (`findVideoById`) per amend |
| 3   | FFP-297 | Signed URL generation service                   | Pending | Combined in `video-signing.service.ts`            |
| 4   | FFP-298 | GET /videos/{id}/signed-url Lambda handler      | Pending | Uses signing service + video repository           |
| 5   | FFP-299 | Audit logging for video access events           | Pending | Integrated into service/handler, not standalone   |

**Amended requirements** (ticket vs current codebase patterns):

1. **Additional dependency** — FFP-295 only mentions `@aws-sdk/cloudfront-signer`, but FFP-296 requires `@aws-sdk/client-secrets-manager` for key retrieval. Will install both in Pass 1.
2. **Video repository needed** — FFP-298 needs to look up a video by ID (verify exists, is active, get `s3_key`). Will create a minimal `video.repository.ts` with `findVideoById()`. Videos are system-managed (no RLS) — queries use `db` directly, not `withRLS()`. FFP-300 can extend the repository later with full CRUD.
3. **Audit logging is cross-cutting** — FFP-299 will be implemented as structured logging calls within the service/handler using the existing `createLogger(context)` pattern, not as a separate standalone utility.
4. **Environment variables** — Service needs 3 env vars from FFP-288: `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_SIGNING_KEY_SECRET_ARN`, and `CLOUDFRONT_DOMAIN`. Code reads from `process.env` at runtime — no compile-time dependency on FFP-288.
5. **No RLS for video lookup** — Videos are system-managed content (already in RLS exclusions list). Repository queries without RLS context. Authentication still required for audit logging (tenantId, userId from JWT).
6. **Barrel exports** — Need to create `packages/core/src/videos/index.ts` and update `packages/core/src/server.ts` to export the videos domain for handler consumption.

**Implementation grouping** (single branch, single PR):

- **Pass 1**: FFP-295 — Install `@aws-sdk/cloudfront-signer` + `@aws-sdk/client-secrets-manager` in `@ffp/core`
- **Pass 2**: FFP-296 + FFP-297 — Create `video-signing.service.ts` (key caching + URL generation) + `video.repository.ts` (`findVideoById`) + barrel exports
- **Pass 3**: FFP-298 + FFP-299 — Create `get-signed-url.ts` handler with integrated audit logging

**Parallel work note**: FFP-288 is in a separate worktree. FFP-294 touches entirely different files (`packages/core/src/videos/`, `packages/functions/src/videos/`). Only expected merge conflict is `project-state.md` (trivially resolvable).

---

### Active: FFP-288 — CloudFront OAC & Signed URL Infrastructure (5 pts)

**Branch**: `feature/ffp-288-cloudfront-oac-signed-url-infrastructure`
**Status**: In progress (worktree)

**Summary**: Configure CloudFront with Origin Access Control (replacing legacy OAI) and signing key infrastructure so videos can only be accessed via time-limited signed URLs. This is pure infrastructure — no application code, no database changes.

**Files touched**: `sst.config.ts`, `project-documentation/deployment.md`

#### Implementation Plan

**Execution order** (entire story on one branch):

| Order | Sub-task          | Summary                                                                                                                                     | Type            | Status  |
| ----- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------- |
| 1     | FFP-289           | Generate RSA 2048 key pair, create setup script (`scripts/setup-cloudfront-signing-key.sh`), store private key via `sst secret set`         | Script + Manual | ✅ Done |
| 2     | FFP-290 + FFP-291 | Update SST config: OAC on VideoCdn, CloudFront Key Group, S3 bucket policy, `sst.Secret("CloudFrontSigningKey")` linked to Lambda functions | Code (SST)      | ✅ Done |
| 3     | FFP-292           | Verify deployment: direct S3 URL → 403, unsigned CloudFront URL → 403                                                                       | Manual (curl)   | ✅ Done |
| 4     | FFP-293           | Document setup script usage as deployment prerequisite                                                                                      | Documentation   | ✅ Done |

#### Grouping Notes

- **FFP-290 + FFP-291 grouped**: Both modify `sst.config.ts` and are tightly coupled — OAC setup, Key Group creation, and `sst.Secret` linking are all part of the same deployment unit. FFP-291 scope reduced to `link: [secret]` on functions (no env vars or IAM needed).
- **FFP-289 includes a setup script**: `scripts/setup-cloudfront-signing-key.sh` generates the key pair and runs `sst secret set`. Repeatable for staging/production.
- **FFP-292 requires deployment**: Verification can only happen after `sst deploy` completes with the OAC + Key Group changes.

#### Key Technical Context

- **Current SST state**: VideoCdn exists with basic S3 origin (no OAC, no Key Group). See `sst.config.ts` lines ~200-230.
- **OAC replaces OAI**: Origin Access Control uses SigV4, supports all regions, has confused-deputy protection.
- **Signing key is per-environment**: One-time setup per stage (dev/staging/prod) via setup script + `sst secret set`. Key is NOT regenerated on each deploy.
- **SST Secret approach**: Using `sst.Secret("CloudFrontSigningKey")` and `sst.Secret("CloudFrontSigningPublicKey")` instead of raw Secrets Manager. Lambda accesses private key via `Resource.CloudFrontSigningKey.value` (auto-decrypted at cold start). Public key feeds the CloudFront Public Key resource at deploy time. No env vars, no IAM permissions needed — SST handles it.
- **Key pair ID**: Exposed via `sst.Linkable("CloudFrontKeyPairId")` — derived from CloudFront Public Key resource output, accessible in Lambda via `Resource.CloudFrontKeyPairId.value`.
- **Skill**: `/infrastructure` for all sub-tasks

---

## Completed: Sprint 6 - Frontend Completion (~26 pts)

**Dates**: 16th February - 22nd February 2026
**Sprint Goal**: End-to-end assessment flow working, demo-ready MVP.

| Key     | Story                                        | Pts | Type  | Status  |
| ------- | -------------------------------------------- | --- | ----- | ------- |
| FFP-137 | Assessment Navigation Component              | 3   | Story | ✅ Done |
| FFP-140 | Assessment Step Screens                      | 5   | Story | ✅ Done |
| FFP-272 | E2E Assessment Flow Integration              | 5   | Story | ✅ Done |
| FFP-273 | ToastAlert Notification Component            | 3   | Task  | ✅ Done |
| FFP-229 | Assessment Engine Epic Clean Up              | 8   | Story | ✅ Done |
| FFP-279 | Update deterministic seed UUIDs to RFC 4122  | -   | Task  | ✅ Done |
| FFP-280 | Align Zod versions across monorepo (v3 → v4) | -   | Task  | ✅ Done |
| FFP-233 | Backend Required Question Validation         | 3   | Story | ✅ Done |
| FFP-230 | Stale Job Detection                          | 2   | Story | ✅ Done |
| FFP-254 | FFP-3 Epic Planning & Sprint Definition      | 5   | Story | ✅ Done |

### FFP-3 Planning Outcomes (from Sprint 6)

**FFP-3 scope**: 2 sprints, ~55 pts (Sprint 7: 28 pts, Sprint 8: 27 pts)

- Sprint 7: Video catalogue schema, CloudFront OAC + signed URLs, video catalogue APIs, programme-video relationship schema
- Sprint 8: Admin video upload/management UI, video player component, integration verification, docs update

**Programme data model research complete** (`.claude/research/programme-data-model-research.md`):

- Confirmed: Programme → Weeks → Sessions → Exercises (flexible days, not prescriptive)
- Phases as metadata on weeks (`phase_label`/`phase_number`), not a separate entity
- Hybrid instantiation: weeks created eagerly at assignment, sessions/completions lazily
- Normalised `exercise_completions` table (not JSONB)
- `programme_weeks` (user-layer, RLS) created in FFP-3; `user_sessions` and `exercise_completions` deferred to FFP-4

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
| FFP-141 | Video Player Component | Defer to FFP-3 (Video Management) to avoid premature implementation              |

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

**RLS exclusions**: `process_jobs`, `assessment_templates`, `assessment_flows`, `questions`, `template_questions`, `programme_templates`, `videos` (system-managed, cross-tenant by design)

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

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 504 tests passing

**Postman**: API collection + test flows managed via MCP server (`/postman` skill)

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Velocity**: ~25-30 pts/sprint
**Capacity**: 8-12 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- ✅ FFP-2: Assessment Engine (Sprints 3-6)
- 🏃 FFP-3: Video Management (Sprint 7-8) — in progress
- ⏳ FFP-4: Programme Execution & Progress
- ⏳ FFP-109: Deployment Readiness (staging + production)
- ⏳ FFP-6: Customer & User Onboarding

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
