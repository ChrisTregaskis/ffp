# FFP - Project State

**Last Updated**: 6th February 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 6 - Frontend Completion (Early Start)
**Note**: Starting sprint 6 stories early; committed dates unchanged (16th Feb - 8th Mar)

---

## Completed: Sprint 5 - Results & Frontend Core (23 pts) ✅

**Dates**: 26th January - 15th February 2026 (completed 4th Feb, merged 6th Feb)
**Sprint Goal**: Assessment results API, programme generation, frontend components for assessment flow.

| Key     | Story                                | Pts | Summary                                                  |
| ------- | ------------------------------------ | --- | -------------------------------------------------------- |
| FFP-138 | Assessment Progress Bar Component    | 2   | Visual progress indicator for assessment flow            |
| FFP-131 | Get Assessment Results API           | 3   | `GET /assessments/:id/results` with nullable scores      |
| FFP-136 | TanStack Query Hooks for Assessments | 5   | API client infrastructure, assessment hooks              |
| FFP-134 | Programme Generation Service         | 5   | Job handler, `programmes` table, retake detection        |
| FFP-139 | Question Renderer Components         | 8   | 6 question types: SingleChoice, MultiChoice, Scale, etc. |

### Key Patterns Established

| Area                   | Decision                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| **Programme Gen**      | `score_assessment` → `generate_programme` job chain, retakes skip creation |
| **Question Renderers** | Factory pattern with `QuestionComponentProps`, dispatches `SET_ANSWER`     |
| **API Client**         | TanStack Query with typed hooks in `hooks/assessments/`                    |
| **Results API**        | Nullable `scores`/`programmeId` until scoring completes                    |

---

## Completed: FFP-253 British English Rename ✅

Renamed American English identifiers to British English across the codebase (merged via PR #74):

- `generate_program` → `generate_programme` (job type enum)
- `program_user` → `programme_user` (user role enum)
- `programTemplateId` → `programmeTemplateId` (types/JSONB)
- `programMapping(s)` → `programmeMapping(s)` (types/seed data)

---

## Current: Sprint 6 - Frontend Completion (~26 pts)

**Dates**: 16th February - 8th March 2026 (early start from 6th Feb, committed dates unchanged)
**Sprint Goal**: End-to-end assessment flow working, demo-ready MVP.

### Sprint 6 Stories

| Key     | Story                            | Pts | Dependencies           | Notes                                     |
| ------- | -------------------------------- | --- | ---------------------- | ----------------------------------------- |
| FFP-137 | Assessment Navigation Component  | 3   | FFP-135 ✅, FFP-136 ✅ | ✅ Complete                               |
| FFP-140 | Assessment Step Screens          | 5   | FFP-135 ✅, FFP-131 ✅ | All sub-tasks done — pending final review |
| FFP-230 | Stale Job Detection              | 2   | FFP-180 ✅             | EventBridge scheduled Lambda              |
| FFP-233 | Backend Required Question Valid. | 3   | FFP-130 ✅             | Defence-in-depth server-side validation   |
| FFP-254 | FFP-3 Epic Planning & Sprints    | 5   | -                      | Architecture, user stories, sprint defs   |
| FFP-229 | Assessment Engine Epic Clean Up  | 8   | -                      | Review FFP-2 requirements, backlog scan   |

### Recommended Execution Order

1. **FFP-137** - Assessment Navigation (frontend, all deps complete)
2. **FFP-140** - Assessment Step Screens (frontend, core UX)
3. **FFP-233** - Backend required question validation (backend, defence-in-depth)
4. **FFP-230** - Stale job detection (backend, operational resilience)
5. **FFP-229** - Epic cleanup (review FFP-2, polish)
6. **FFP-254** - FFP-3 Epic planning (documentation, prepares next phase)

### Completed: FFP-137 — Assessment Navigation Component ✅

**Branch**: `feature/FFP-137-assessment-navigation` | **Sub-tasks**: FFP-204, FFP-205, FFP-206 (done), FFP-207 (tests deferred)
**Summary**: Save-on-navigate component using `useAssessment()` + `useSaveProgress()`. Supports branching via `nextStepId`, loading states, custom callbacks.

---

### Implementation Plan: FFP-140 — Assessment Step Screens

**Branch**: `feature/FFP-140-assessment-step-screens` (single branch, single PR)
**Estimated effort**: Medium — 4 new screen components + 2 placeholders + 1 orchestrator, all infrastructure already built.

#### Sub-tasks (all on one branch)

| Order | Key     | Summary                               | Status | Notes                                                               |
| ----- | ------- | ------------------------------------- | ------ | ------------------------------------------------------------------- |
| -     | FFP-223 | AssessmentProgress with phase         | Skip   | Already done via FFP-138 (Sprint 5) — component exists              |
| 1     | FFP-218 | IntroScreen component                 | Done   | Welcome screen with checklist and start button                      |
| 2     | FFP-220 | TransitionScreen component            | Done   | Refactored to TransitionCard (composes StepCard)                    |
| 3     | FFP-219 | QuestionScreen wrapper                | Done   | Refactored to QuestionCard (composes StepCard)                      |
| -     | -       | Screen-to-Card refactor               | Done   | StepCard layout, cards/ directory, VideoQuestionCard                |
| -     | -       | Shared component extraction           | Done   | FeatureColumnGrid, InstructionList, SectionHeader                   |
| 4     | FFP-221 | ResultsScreen component               | Done   | Scores, risk level, recommended programme, SectionPanel             |
| 5     | FFP-222 | AssessmentStepRenderer (orchestrator) | Done   | Routes step type → card/screen, question iteration, results polling |

**Rationale for single branch**: All components form one cohesive feature. The StepRenderer (FFP-222) depends on all screen/card components. Splitting would create unnecessary merge dependencies.

#### Screen-to-Card Refactor (in progress)

After reviewing Figma screenshots against the built components, a structural mismatch was identified: the question, transition, and video step types all share a common card layout (progress bar + card container with title/content/CTAs inside), but each "Screen" component was implementing its own standalone layout with title/description floating above the card.

**Decision**: Introduce a shared `StepCard` layout component and rename the card-based step components:

- `QuestionScreen` → `QuestionCard` (composes `StepCard`)
- `TransitionScreen` → `TransitionCard` (composes `StepCard`)
- New `VideoQuestionCard` scaffold (composes `StepCard`)
- `IntroScreen` unchanged (standalone screen, not a card)

**New directory**: `components/assessment/cards/` alongside existing `screens/`

**Full plan**: `.claude/plans/ffp-140-screen-to-card-refactor.md`

#### Session Grouping (updated)

| Session | Sub-tasks                   | Scope                                                               |
| ------- | --------------------------- | ------------------------------------------------------------------- |
| 1       | FFP-218, FFP-220            | IntroScreen + TransitionScreen (similar patterns) — Done            |
| 2       | FFP-219                     | QuestionScreen wrapper — Done                                       |
| 3       | Screen-to-Card refactor     | StepCard + QuestionCard + TransitionCard + VideoQuestionCard — Done |
| 4       | Shared component extraction | FeatureColumnGrid, InstructionList, SectionHeader — Done            |
| 5       | FFP-221                     | ResultsScreen (standalone, data-driven)                             |
| 6       | FFP-222                     | StepRenderer orchestrator + placeholder screens + exports           |

#### Amendments from Jira

- **FFP-223 — skip**: Already built as FFP-138 (Sprint 5). Existing `AssessmentProgress` has phase label, step counter, animated bar.
- **FFP-219 — reduced scope**: QuestionRenderer + 6 types already built (FFP-139). Only need a thin screen wrapper with question number indicator.
- **FFP-219/FFP-220 — refactored**: Now being migrated from Screen to Card pattern with shared `StepCard` layout. Title/description move inside the card. Navigation CTAs become the card footer via `AssessmentNavigation`.
- **FFP-221 scores**: Jira says "Strength Score (X/10)" — actual schema uses `dimensions[]` with `normalisedScore` (0-100). Use real `UserAssessmentScores` schema.
- **FFP-221 programme**: No programme details API yet (`programmeId` only). Simple card — full details deferred to FFP-3.
- **FFP-222 props**: Jira passes `template` as prop — actually fetched via `useAssessmentTemplateQuery` hook internally.
- **FFP-222 step types**: Video step now gets `VideoQuestionCard` scaffold (not just a placeholder). Programme-overview gets placeholder (FFP-3 deferred).
- **File location**: `components/assessment/cards/` for card-based steps, `components/assessment/screens/` for standalone screens (IntroScreen).

#### Dependencies (all satisfied)

- ✅ `useAssessment()` — state (currentStep, answers, phase, scores) and dispatch
- ✅ `useSaveProgress()` — mutation for save-on-navigate
- ✅ `useSubmitAssessment()` — mutation for final submission
- ✅ `useAssessmentResultsQuery(assessmentId)` — polling hook (2s interval, auto-stops)
- ✅ `useAssessmentFlowQuery(flowId)` — fetch flow config (step configs, descriptions)
- ✅ `useAssessmentTemplateQuery(templateId)` — fetch questions for question steps
- ✅ `QuestionRenderer` — factory component for 6 question types
- ✅ `AssessmentNavigation` — Continue/Back with save-on-navigate
- ✅ `AssessmentProgress` — progress bar with phase label
- ✅ Flow step types: `intro`, `questions`, `transition`, `video-assessment`, `results`, `programme-overview`

#### Key Types for Implementation

```typescript
// Step config from flow (FlowStepConfig)
{ title, description?, instructions?, safetyNotes?, estimatedMinutes? }

// Scores from results (UserAssessmentScores)
{ dimensions: DimensionalScore[], overallScore?, riskLevel?, scoredAt }

// DimensionalScore
{ dimensionId, dimensionName, rawScore, normalisedScore, category? }

// Results API response (AssessmentResultsResponse)
{ status, scores: UserAssessmentScores | null, programmeId: string | null }
```

#### Component Overview

**Standalone Screens** (full-page layouts, no shared card chrome):

- **IntroScreen** (FFP-218): Welcome heading, "What to Expect" section, "Before You Begin" checklist, "Start Assessment" button.
- **ResultsScreen** (FFP-221): Score cards, risk level, polling loading state, "View Programme" button.
- **ProgrammeOverviewScreen** (placeholder): Simple "Programme details coming soon" message. Full implementation via FFP-3.

**Card Components** (compose shared `StepCard` layout):

- **StepCard**: Shared layout — card chrome (`rounded-2xl shadow-xl`), header zone (title + description inside card), content zone, footer zone (border-t separator + CTAs).
- **QuestionCard** (from FFP-219): Question sub-progress in header, `QuestionRenderer` as content, `AssessmentNavigation` as footer.
- **TransitionCard** (from FFP-220): Centre-aligned title, "What's Next" + Safety Notes as flat inner sections (no individual shadows), `AssessmentNavigation` as footer.
- **VideoQuestionCard** (scaffold): Instructions list + `QuestionRenderer` (routes to `VideoResponseQuestion`) as content, `AssessmentNavigation` as footer.

**Orchestrator**:

- **AssessmentStepRenderer** (FFP-222): Switch on `step.type` → renders correct card/screen component. Renders `AssessmentProgress` for all types except intro and programme-overview. Uses `useAssessment()` for state/dispatch.

#### Key Decisions (from FFP-218 implementation)

- **Colour hierarchy**: Headings use `text-ffp-navy`, descriptions use `text-muted-foreground`, body uses default foreground. All existing theme colours.
- **Gradients** (from Figma, diagonal `to-br`): Checklist card `from-secondary/40 to-primary/10`. IconBadge secondary `from-secondary to-primary/20`.
- **IconBadge**: New reusable component at `@web/components/Icon`. Variants: secondary (gradient), success, primary, muted. Sizes: sm/md/lg.
- **Shadows**: `shadow-xl` on card sections (matching Figma prototype).
- **Dev showcase**: Page at `/components/assessment-screens` (7xl width). Tab per screen, variant tabs per component. Update as each sub-task completes.
- **Screen props**: Screens are presentational — `config: FlowStepConfig` + callbacks. No `useAssessment` dependency; orchestrator (FFP-222) handles state.

#### Tests

Deferred to post-MVP (tests moratorium).

---

### Deferred to Backlog

| Key     | Story                  | Reason                                                                           |
| ------- | ---------------------- | -------------------------------------------------------------------------------- |
| FFP-231 | Job Status Polling     | `GET /assessments/:id/results` already supports polling (scores null → complete) |
| FFP-252 | Scoring E2E Validation | Waiting on co-founder's question/scoring config spreadsheet (post-sprint 6)      |
| FFP-141 | Video Player Component | Defer to FFP-3 (Video Management) to avoid premature implementation              |

**Note on FFP-141**: Consider a simple placeholder component (`VideoPlayer.tsx` with "Video not available" message) to unblock FFP-140's video-assessment step type. Full implementation deferred to FFP-3 epic.

---

## Completed: Sprint 4 - APIs & FE Foundation (23 pts) ✅

**Status**: ✅ Complete (merged)

| Key     | Story                           | Pts | Summary                                       |
| ------- | ------------------------------- | --- | --------------------------------------------- |
| FFP-130 | Submit Assessment API           | 5   | POST /assessments/:id/submit, job enqueue     |
| FFP-133 | Scoring Service Implementation  | 8   | Multi-dimensional scoring, flow-level config  |
| FFP-126 | Assessment Template Admin API   | 5   | CRUD endpoints for system admins              |
| FFP-135 | Assessment Context & State Mgmt | 5   | React Context + useReducer, branching support |

### Key Patterns Established

| Area               | Decision                                                         |
| ------------------ | ---------------------------------------------------------------- |
| **Scoring**        | Multi-dimensional with weighted dimensions, flow-level config    |
| **Branching**      | `goto_step`, `show_warning` actions with condition evaluators    |
| **Frontend State** | React Context + useReducer pattern, typed actions                |
| **Admin API**      | Thin service layer, repository handles logic                     |
| **Type Imports**   | `@ffp/web` imports from `@ffp/core` only (never `@ffp/database`) |

---

## Completed: Sprint 3 - Backend Foundation (24 pts) ✅

**Status**: ✅ Complete (merged)

| Key     | Story                                      | Pts |
| ------- | ------------------------------------------ | --- |
| FFP-124 | Assessment Template Schema & Repository    | 5   |
| FFP-132 | Process Jobs Schema & Queue Infrastructure | 8   |
| FFP-125 | Assessment Flow Schema & Configuration     | 3   |
| FFP-127 | User Assessment Schema & State Machine     | 5   |
| FFP-128 | Start Assessment API                       | 3   |
| FFP-129 | Save Assessment Progress API               | 3   |

### Key Patterns Established

| Area               | Decision                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| **State Machine**  | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`) |
| **Job Queue**      | Database-driven polling with `FOR UPDATE SKIP LOCKED`, exponential backoff   |
| **Flow Steps**     | `intro`, `questions`, `transition`, `video-assessment`, `results`            |
| **RLS Pattern**    | Tenant isolation via `app.tenant_id` session variable                        |
| **User Ownership** | Service-layer `userId` check (RLS enforces tenant, not user isolation)       |

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)

### Critical Path

```
FFP-124 → FFP-125 → FFP-127 → FFP-128 → FFP-129 → FFP-130 → FFP-133 → FFP-131
(Template)  (Flow)   (User)   (Start)   (Save)   (Submit)  (Score)  (Results)
   ✅         ✅        ✅        ✅        ✅        ✅        ✅      (next)
```

### Sprint Overview

| Sprint | Focus                | Pts | Status                       |
| ------ | -------------------- | --- | ---------------------------- |
| 3      | Backend Foundation   | 24  | ✅ Complete                  |
| 4      | APIs & FE Foundation | 23  | ✅ Complete                  |
| 5      | Results & FE Core    | 23  | ✅ Complete                  |
| 6      | FE Completion        | 26  | 🚀 In Progress (Early Start) |

---

## Key Architectural Decisions

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Repository → Schema`

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});
```

**JWT Claims**: `custom:tenantId`, `custom:customerId`, `custom:role`

### Frontend Architecture

- React 18 with arrow function components
- Zod schemas as single source of truth
- TanStack Query for server state
- React Context + useReducer for form state

---

## Working Infrastructure

**Deployed**: SST v3 Ion, Cognito, S3 + CloudFront, API Gateway, PostgreSQL (local) with RLS

**Packages**: `@ffp/web`, `@ffp/functions`, `@ffp/core`, `@ffp/database`

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 504 tests passing

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Sprint**: 6 of 6 (Assessment Engine - Final, early start)
**Velocity**: ~25 pts/sprint
**Capacity**: 8 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- 🚀 FFP-2: Assessment Engine (Sprints 3-6)
- ⏳ FFP-3: Programme Generation
- ⏳ FFP-4: Video Management

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
