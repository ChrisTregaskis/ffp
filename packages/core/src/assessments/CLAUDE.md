# Assessment domain (`@ffp/core`)

Local map for the assessment domain. High-level engine design: `project-documentation/assessment-engine.md`. Standards: the `backend` and `database` skills, and `.claude/rules/rls.md`. Read this before editing here, and update it when the domain's structure or contracts change.

## What this domain is

Two distinct halves living side by side:

1. **User-facing lifecycle** (per-member, RLS-enforced) — starting/resuming an assessment, saving progress with branching, submitting, scoring, results.
2. **System catalogue** (cross-organisation, RLS-excluded) — the flows, steps, templates and question bank that define _what_ an assessment is. Authored by system admins.

The wider domain spans three packages: business logic here (`@ffp/core`), handlers in `packages/functions/src/assessments/` (+ admin handlers in `packages/functions/src/admin/`), and the UI in `packages/web` (`components/assessment/`, `hooks/assessments/`, `contexts/assessments/`, consumer pages under `pages/protected/programme-user/`).

## Data model (catalogue)

```
assessment_flows (scoring_config: jsonb, is_active)
  └─ flow_steps (order, type, config: jsonb, next_step_rules: jsonb, default_next_step_id)
       └─ assessment_templates (version auto-increments)   ← optional per step (templateId)
            └─ template_questions (display_order, config_overrides)
                 └─ questions (slug, type, options: jsonb, validation: jsonb, score_dimension)
```

- `scoring_config` is **flow-level jsonb** (`dimensions[]` + `programmeMappings[]`), not per template. A question's score comes from `QuestionOption.score`.
- Branching lives in `flow_steps.next_step_rules` (`NextStepRule[]`: priority → conditions → action). Actions: `goto_step`, `show_warning`, `end_assessment`. Linear fallback is `default_next_step_id`.
- Schemas: `packages/database/src/schema/{assessment-flows,flow-steps,assessment-templates,template-questions,questions}.ts`. Types/constants under `packages/database/src/{types,constants}/`.

## Files here

| File                                                               | Purpose                                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assessment.service.ts`                                            | User lifecycle: `startAssessment`, `saveProgress` (runs branching), `submitAssessment`, `getAssessmentResults`, `getUserAssessmentStatus`               |
| `template.service.ts` / `template.repository.ts`                   | Admin CRUD for **templates**, plus the `template_questions` join lifecycle (assign / unassign / reorder / list-assignable)                              |
| `flow.repository.ts`                                               | Read queries for `assessment_flows` + `flow_steps`                                                                                                      |
| `flow.service.ts` / `flow-step.service.ts`                         | Admin CRUD for **flows** and their **steps** (publicId-keyed, `system_admin`-gated)                                                                     |
| `user-assessment.repository.ts` / `answer.repository.ts`           | **RLS-enforced** user-layer data                                                                                                                        |
| `branching/branch-evaluator.service.ts` / `condition-evaluator.ts` | Evaluate `next_step_rules` → next step + warnings + terminate                                                                                           |
| `scoring/scoring.service.ts` (+ `helpers/`)                        | Pure: responses + questions + `ScoringConfig` → scores, risk level, recommended programme                                                               |
| `index.ts`                                                         | Namespaced re-exports: `assessmentService`, `templateService`, `flowService`, `flowStepService`, `flowRepository`, `scoringService`, `branchingService` |

## Local contracts

- **RLS:** user-layer tables (`user_assessments`, `user_assessment_answers`) are RLS-enforced — always set context in a transaction (see `.claude/rules/rls.md`). Catalogue tables (flows, steps, templates, template_questions, questions) are **RLS-excluded by design**; protect catalogue **writes** with a `system_admin` role check in the handler, not RLS.
- **Scoring and branching are pure functions** — no side effects, no DB. Keep them that way; they're reusable for preview/dry-run. Persisting belongs in services/repositories.
- **Extend, don't fork:** new catalogue admin work should mirror the template-CRUD layering here (schema → repository → service → handler) and, on the web side, the programme-template patterns (`SessionCard`, `InlineFormPanel`, `swapAdjacentItem`, mutation hooks).
- **Wellness positioning:** prefer wellness-neutral language in new copy; avoid introducing clinical/medical framing. (The existing `show_warning` `seek_medical` type predates this — don't rely on or extend clinical phrasing in new work.)

## Gotchas

- `flow_steps.order` is **not unique** per flow (parallel branches share a value) — reorder logic must account for that; it's not a `sort_order` swap like programme templates.
- `template_questions` is the mirror image: **`UNIQUE(template_id, display_order)` is enforced**, so a reorder cannot write final positions directly. `reorderTemplateQuestions` parks every row on a temporary negative order first, then writes the positives (the same idiom as `programme-templates/template-session.repository.ts`). Don't copy the flow-step reorder here, or the other way round.
- `aggregate` branching condition is a **stub** (`condition-evaluator.ts` always returns false) — don't depend on it.
- `scoring_config.programmeMappings[].programmeTemplateId` holds a **slug** in seed data, not a UUID — confirm the lookup contract before building a picker.
- No referential integrity between `scoring_config.dimensions[].questionIds` and the questions table — deleting/deactivating a question silently drops it from scoring. Validate on write if you add scoring-config editing.

## Authoring & testing

- The catalogue ships with seed data — `packages/database/seed/seed{Questions,AssessmentTemplates,AssessmentFlows,FlowSteps}.ts` (idempotent, deterministic UUIDs) — and is also authored through the admin API under `packages/functions/src/admin/` (`assessment-flows/`, `questions/`, `templates/`). Those routes are keyed on `publicId` and gated on `system_admin`; the pre-existing template CRUD routes are still UUID-keyed.
- Tests: `pnpm --filter=@ffp/core test`. Scoring/branching are pure and unit-test cleanly; user-lifecycle tests need RLS context.
