# FFP - Assessment Engine Documentation

## Overview

The assessment engine is the core value proposition of FFP. It uses a **database-driven chained assessment flow** to evaluate users through pre-assessment questions and video-guided physical tests, then generates personalised workout programmes based on multi-dimensional scoring.

---

## Design Principles

1. **Database-driven**: Templates and flows stored in PostgreSQL; questions in normalised tables with JSONB for complex config
2. **Type-safe**: Zod schemas in `@ffp/core` validate structure at runtime
3. **Linear flow (MVP)**: Sequential questions without conditional branching
4. **Multi-dimensional scoring**: Separate scores for Strength, Balance, and Risk Level
5. **Chained assessments**: Database-driven flow linking pre-assessment → physical → results
6. **Async processing**: Scoring and programme generation via database job queue
7. **Audit trail**: Immutable history of all assessment attempts
8. **Resume capability**: Save progress on navigation (Continue/Back), continue later
9. **Video-guided**: Physical assessments include video demonstrations from S3 + CloudFront
10. **Normalised questions**: Questions stored in dedicated table, linked to templates via join table

### Post-MVP Enhancements

- Conditional logic (dynamic question trees based on previous answers)
- Visual template builder (drag-and-drop)
- A/B testing for assessment templates
- Advanced analytics (dropout points, question difficulty)

---

## User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [Introduction]                                                         │
│        │  Welcome screen, what to expect (15-20 mins)                   │
│        │  Before you begin checklist                                    │
│        ▼                                                                 │
│   [Pre-Assessment Questions]  ─────────────────────────────────────┐    │
│        │  Quick questions about goals, pain, history                │    │
│        │  Progress: 29% → 43%                                       │    │
│        │  Previous/Next navigation                                  │    │
│        ▼                                                           │    │
│   [Transition Screen]                                               │    │
│        │  "Ready for Physical Assessment?"                          │    │
│        │  Safety notes (stop if pain, use support)                  │    │
│        ▼                                                           │    │
│   [Video-Guided Physical Tests]                                     │    │
│        │  Strength Assessment (video demo + response)               │    │
│        │  Balance Assessment (video demo + response)                │    │
│        │  Progress: 57% → 71%                                       │    │
│        ▼                                                           │    │
│   [Results Screen]                                                  │    │
│        │  Assessment Complete!                                      │    │
│        │  Strength: X/10, Balance: X/10, Risk Level               │    │
│        │  Programme recommendation                                  │    │
│        ▼                                                           │    │
│   [Programme Overview]                                              │    │
│        │  Personalised programme details                            │    │
│        └──────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### How It All Fits Together

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ASSESSMENT SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│  │   TEMPLATES  │────▶│   QUESTIONS  │     │    FLOWS     │             │
│  │  (what to    │     │ (reusable    │     │ (journey     │             │
│  │   assess)    │     │  question    │     │  steps)      │             │
│  └──────────────┘     │  bank)       │     └──────────────┘             │
│         │             └──────────────┘            │                      │
│         │                    │                    │                      │
│         └────────────────────┼────────────────────┘                      │
│                              ▼                                           │
│                    ┌──────────────────┐                                  │
│                    │  USER STARTS     │                                  │
│                    │  ASSESSMENT      │                                  │
│                    └────────┬─────────┘                                  │
│                             ▼                                            │
│                    ┌──────────────────┐                                  │
│                    │ USER ASSESSMENT  │  ◀── Tracks progress, answers   │
│                    │    INSTANCE      │      status, timestamps          │
│                    └────────┬─────────┘                                  │
│                             │                                            │
│         ┌──────────────────┼──────────────────┐                         │
│         ▼                  ▼                  ▼                          │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐                     │
│  │  ANSWERS   │    │  PROGRESS  │    │   SUBMIT   │                     │
│  │  (stored   │    │  (saved on │    │   (async   │                     │
│  │   per Q)   │    │   nav)     │    │   scoring) │                     │
│  └────────────┘    └────────────┘    └─────┬──────┘                     │
│                                            ▼                             │
│                                   ┌────────────────┐                     │
│                                   │   JOB QUEUE    │                     │
│                                   │ (score_assess- │                     │
│                                   │   ment job)    │                     │
│                                   └────────┬───────┘                     │
│                                            ▼                             │
│                                   ┌────────────────┐                     │
│                                   │    SCORING     │                     │
│                                   │    ENGINE      │                     │
│                                   └────────┬───────┘                     │
│                                            ▼                             │
│                                   ┌────────────────┐                     │
│                                   │   PROGRAMME    │                     │
│                                   │ RECOMMENDATION │                     │
│                                   └────────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA MODEL (ERD)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SYSTEM CONTENT (No RLS - shared across tenants)                        │
│  ═══════════════════════════════════════════════                        │
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────────┐                        │
│  │ assessment_     │     │ template_questions  │                        │
│  │ templates       │────▶│ (join table)        │                        │
│  │─────────────────│     │─────────────────────│                        │
│  │ id              │     │ template_id         │                        │
│  │ name            │     │ question_id         │                        │
│  │ scoring_config  │     │ display_order       │                        │
│  │ is_active       │     │ config_overrides    │                        │
│  └─────────────────┘     └──────────┬──────────┘                        │
│                                     │                                    │
│  ┌─────────────────┐               │                                    │
│  │ assessment_     │               │                                    │
│  │ flows           │               ▼                                    │
│  │─────────────────│     ┌─────────────────────┐                        │
│  │ id              │     │ questions           │                        │
│  │ name            │     │─────────────────────│                        │
│  │ steps (JSONB)   │     │ id                  │                        │
│  │ is_active       │     │ slug                │                        │
│  └─────────────────┘     │ type                │                        │
│                          │ question_text       │                        │
│                          │ options (JSONB)     │                        │
│                          │ score_dimension     │                        │
│                          └─────────────────────┘                        │
│                                                                          │
│  TENANT DATA (RLS enforced)                                             │
│  ═══════════════════════════                                            │
│                                                                          │
│  ┌─────────────────────┐     ┌─────────────────────┐                    │
│  │ user_assessments    │────▶│ user_assessment_    │                    │
│  │─────────────────────│     │ answers             │                    │
│  │ id                  │     │─────────────────────│                    │
│  │ tenant_id     ◀─ RLS│     │ tenant_id     ◀─ RLS│                    │
│  │ user_id             │     │ user_assessment_id  │                    │
│  │ flow_id             │     │ question_id         │                    │
│  │ current_step        │     │ answer_value        │                    │
│  │ status              │     │ answered_at         │                    │
│  │ scores (JSONB)      │     └─────────────────────┘                    │
│  │ programme_id        │                                                 │
│  └─────────────────────┘                                                 │
│                                                                          │
│  ┌─────────────────────┐                                                 │
│  │ process_jobs        │                                                 │
│  │─────────────────────│                                                 │
│  │ tenant_id     ◀─ RLS│                                                 │
│  │ type                │                                                 │
│  │ status              │                                                 │
│  │ payload (JSONB)     │                                                 │
│  │ result (JSONB)      │                                                 │
│  └─────────────────────┘                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Assessment State Machine

User assessments follow a defined state machine to track progress:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ASSESSMENT STATUS FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     ┌─────────────┐                                                      │
│     │ not_started │  ◀── Initial state when assessment created          │
│     └──────┬──────┘                                                      │
│            │ User answers first question                                 │
│            ▼                                                             │
│     ┌─────────────┐                                                      │
│     │ in_progress │  ◀── Progress saved on Continue/Back                │
│     └──────┬──────┘      Can resume later                               │
│            │ User clicks Submit                                          │
│            ▼                                                             │
│     ┌─────────────┐                                                      │
│     │  submitted  │  ◀── Waiting for scoring job                        │
│     └──────┬──────┘                                                      │
│            │ Scoring job completes                                       │
│            ▼                                                             │
│     ┌─────────────┐                                                      │
│     │   scored    │  ◀── Scores calculated, programme assigned          │
│     └──────┬──────┘                                                      │
│            │ User views programme                                        │
│            ▼                                                             │
│     ┌─────────────┐                                                      │
│     │  completed  │  ◀── Full journey finished                          │
│     └─────────────┘                                                      │
│                                                                          │
│     ┌─────────────┐                                                      │
│     │  abandoned  │  ◀── User explicitly abandons (optional)            │
│     └─────────────┘                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Scoring System

### Multi-Dimensional Scoring

FFP uses multi-dimensional scoring rather than a single total score. The prototype shows three dimensions:

- **Strength Score**: 0-10 scale
- **Balance Score**: 0-10 scale
- **Risk Level**: Low / Moderate / High

### How Scoring Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SCORING PROCESS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. COLLECT ANSWERS                                                      │
│     ─────────────────                                                    │
│     User completes all questions → Answers stored per question          │
│                                                                          │
│  2. CALCULATE DIMENSION SCORES                                           │
│     ───────────────────────────                                          │
│     Each question belongs to a dimension (strength, balance, etc.)      │
│     Each answer option has a score value                                │
│                                                                          │
│     Example:                                                             │
│     ┌────────────────────────────────────────────────────┐              │
│     │ Question: "How many squats can you do?"            │              │
│     │ Dimension: strength                                 │              │
│     │ Answer: "5-10 reps" → Score: 5                     │              │
│     └────────────────────────────────────────────────────┘              │
│                                                                          │
│  3. AGGREGATE PER DIMENSION                                              │
│     ─────────────────────────                                            │
│     Sum scores for all questions in each dimension                      │
│     Calculate percentage: (actual / max) × 100                          │
│                                                                          │
│  4. DETERMINE RISK LEVEL                                                 │
│     ─────────────────────                                                │
│     Based on lowest dimension percentage:                               │
│     • ≥70% → Low risk                                                   │
│     • ≥40% → Moderate risk                                              │
│     • <40% → High risk                                                  │
│                                                                          │
│  5. MATCH PROGRAMME                                                      │
│     ─────────────────                                                    │
│     Scoring config contains rules like:                                 │
│     "If strength < 4 OR balance < 4 → Gentle Rehabilitation"           │
│     "If strength ≥ 7 AND balance ≥ 7 → Advanced Conditioning"          │
│     Rules checked by priority, first match wins                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Async Job Processing

Assessment scoring runs asynchronously via a **database-driven job queue**.

### Why Database Queue (Not SQS)?

| Factor          | Database Queue              | SQS                     |
| --------------- | --------------------------- | ----------------------- |
| Simplicity      | No additional AWS service   | Extra service to manage |
| Visibility      | Jobs queryable via SQL      | Requires CloudWatch     |
| Tenant context  | RLS applies to job records  | Must embed in message   |
| Cost            | No additional charges       | Per-message costs       |
| MVP appropriate | Can migrate later if needed | Over-engineering        |

### Job Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       JOB PROCESSING                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────┐    ┌──────────────────┐    ┌───────────────────┐     │
│  │  EventBridge  │───▶│  Job Processor   │───▶│  process_jobs     │     │
│  │  (1 min poll) │    │  Lambda          │    │  table            │     │
│  └───────────────┘    └────────┬─────────┘    └───────────────────┘     │
│                                │                                         │
│                                ▼                                         │
│                       ┌────────────────┐                                 │
│                       │ Claim jobs     │  SELECT ... FOR UPDATE          │
│                       │ atomically     │  SKIP LOCKED                    │
│                       └────────┬───────┘                                 │
│                                │                                         │
│            ┌───────────────────┼───────────────────┐                    │
│            ▼                                       ▼                    │
│   ┌─────────────────┐                    ┌─────────────────┐            │
│   │ score_assessment│                    │ generate_program│            │
│   │ handler         │                    │ handler         │            │
│   └─────────┬───────┘                    └─────────────────┘            │
│             │                                                            │
│             ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ Update job with │                                                   │
│   │ result/status   │                                                   │
│   └─────────────────┘                                                   │
│                                                                          │
│  Job Status: queued → processing → completed/failed                     │
│  Retries: Exponential backoff (2^attempts seconds)                      │
│  Max attempts: 3 (configurable)                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Question Types

| Type           | Description               | Example Use           |
| -------------- | ------------------------- | --------------------- |
| single-choice  | Pick one option from list | Goal selection        |
| multi-choice   | Pick multiple options     | Pain areas            |
| numeric        | Enter a number            | Age, repetitions      |
| text           | Free text input           | Medical conditions    |
| scale          | Slider 1-10               | Pain intensity        |
| video-response | Watch video, then respond | Physical test results |

---

## Video-Guided Assessments

Physical assessments use video demonstrations to guide users through exercises.

### How It Works

1. **Video displays** from CloudFront CDN (signed URLs for security)
2. **User watches** the demonstration
3. **User performs** the exercise
4. **User records** their result (reps completed, time held, etc.)

### Video Hosting

- Videos stored in **S3** bucket
- Delivered via **CloudFront** CDN
- **Signed URLs** expire after 1 hour
- Categories: assessment demos, exercise library, instructions

---

## Save Behaviour

Progress is saved **only** when the user clicks Continue or Back, not on every answer change. This reduces API calls while ensuring no data loss during navigation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SAVE BEHAVIOUR                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User answers question ──▶ Answer stored in React state (local)         │
│                                                                          │
│  User clicks Continue ───▶ API call: save progress                      │
│                            (answers + current step)                      │
│                                                                          │
│  User clicks Back ───────▶ API call: save progress                      │
│                            (answers + current step)                      │
│                                                                          │
│  User closes browser ────▶ Can resume later from saved step             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint                    | Method | Purpose                       |
| --------------------------- | ------ | ----------------------------- |
| `/assessments/start`        | POST   | Start or resume an assessment |
| `/assessments/:id/progress` | PUT    | Save answers and current step |
| `/assessments/:id/submit`   | POST   | Submit for scoring            |
| `/assessments/:id/results`  | GET    | Poll for scoring results      |

---

## Admin Features (MVP)

System administrators can manage assessment templates via basic CRUD forms.

| Feature                  | MVP | Post-MVP |
| ------------------------ | --- | -------- |
| List templates           | Yes |          |
| Create template          | Yes |          |
| Edit template            | Yes |          |
| Deactivate template      | Yes |          |
| Duplicate template       | Yes |          |
| Version history          | Yes |          |
| Visual question builder  | No  | Yes      |
| Drag-and-drop reordering | No  | Yes      |
| Live preview mode        | No  | Yes      |

---

## Implementation Reference

### Database Schemas

| Component               | File Path                                                 |
| ----------------------- | --------------------------------------------------------- |
| Assessment Templates    | `packages/database/src/schema/assessment-templates.ts`    |
| Assessment Flows        | `packages/database/src/schema/assessment-flows.ts`        |
| Questions               | `packages/database/src/schema/questions.ts`               |
| Template Questions      | `packages/database/src/schema/template-questions.ts`      |
| User Assessments        | `packages/database/src/schema/user-assessments.ts`        |
| User Assessment Answers | `packages/database/src/schema/user-assessment-answers.ts` |
| Process Jobs            | `packages/database/src/schema/process-jobs.ts`            |

### Core Business Logic

| Component            | File Path                                                     |
| -------------------- | ------------------------------------------------------------- |
| Assessment Service   | `packages/core/src/assessments/assessment.service.ts`         |
| Template Repository  | `packages/core/src/assessments/template.repository.ts`        |
| Flow Repository      | `packages/core/src/assessments/flow.repository.ts`            |
| User Assessment Repo | `packages/core/src/assessments/user-assessment.repository.ts` |
| Answer Repository    | `packages/core/src/assessments/answer.repository.ts`          |
| Question Repository  | `packages/core/src/questions/question.repository.ts`          |
| Scoring Service      | `packages/core/src/assessments/scoring/scoring.service.ts`    |
| Scoring Helpers      | `packages/core/src/assessments/scoring/helpers/`              |
| Job Handler          | `packages/core/src/jobs/handlers/score-assessment.handler.ts` |

### Zod Validation Schemas

| Component           | File Path                                                 |
| ------------------- | --------------------------------------------------------- |
| User Assessment     | `packages/core/src/schemas/user-assessment.schema.ts`     |
| Assessment Template | `packages/core/src/schemas/assessment-template.schema.ts` |
| Assessment Flow     | `packages/core/src/schemas/assessment-flow.schema.ts`     |
| Assessment Question | `packages/core/src/schemas/assessment-question.schema.ts` |
| Scoring Config      | `packages/core/src/schemas/scoring-config.schema.ts`      |
| Job Schemas         | `packages/core/src/schemas/job.schema.ts`                 |

### Lambda Handlers

| Endpoint          | File Path                                                 |
| ----------------- | --------------------------------------------------------- |
| Start Assessment  | `packages/functions/src/assessments/start-assessment.ts`  |
| Save Progress     | `packages/functions/src/assessments/save-progress.ts`     |
| Submit Assessment | `packages/functions/src/assessments/submit-assessment.ts` |
| Process Jobs      | `packages/functions/src/jobs/process-jobs.ts`             |

---

## Future Enhancements

### Post-MVP Features

1. **Conditional Logic** - Dynamic question trees based on previous answers
2. **Visual Template Builder** - Drag-and-drop question ordering with preview
3. **A/B Testing** - Multiple template versions with random assignment
4. **Advanced Analytics** - Dropout points, question difficulty analysis
5. **Assessment Reminders** - Email notifications for abandoned assessments
6. **Offline Support** - Local storage sync when back online

---

## Related Documentation

- `architecture.md` - Overall system architecture and AWS services
- `database-schema.md` - Full database schema with RLS policies
- `video-management.md` - S3 and CloudFront configuration for videos
- `coding-standards.md` - Domain-organised architecture patterns
- `authentication.md` - JWT and context extraction patterns
