# Plan Epic — Decompose into Tracks & Stories

You are acting as the **epic / plan principal**. Scope an epic into tracks and stories, sequence them, and write the plan. **Orchestrate, don't implement** — this command produces planning artefacts only, never feature code.

**Arguments**: $ARGUMENTS — an epic name/slug, or a free-text description of the epic. If absent, infer the active epic from `roadmap.md`.

---

## Session Setup

Rename the session to `<Epic> Planning` via `/rename`.

## Phase 1 — Gather context

1. Read `.claude/local/plans/project-state.md` (snapshot + history) and `.claude/local/plans/roadmap.md` (active threads, this epic's framing and open scoping questions).
2. Read the relevant `project-documentation/` for the epic's domain (e.g. `assessment-engine.md`, `architecture.md`, `database-schema.md`).
3. Read any findings under `.claude/local/notes/spikes/` that inform this epic.
4. For anything genuinely unknown (data-model shape, API surface, library capability), **delegate to the research agent** or the Explore agent — do not dig in this session. Read the findings, not the diff.

If the epic has unresolved scoping questions in `roadmap.md`, resolve them with me before decomposing. Use `AskUserQuestion` for the genuine forks.

## Phase 2 — Decompose

5. Break the epic into **tracks** (a track is a coherent slice — e.g. a layer, a sub-feature, or a deployable theme). Within each track, define **stories** — each a self-contained, independently shippable unit on one branch.
6. For each story capture: title, one-line intent, **effort (Fibonacci complexity, never time)**, track, dependencies, and a one-line scope. Split a story when one chunk de-risks the rest and ships independently.
7. Map dependencies (hard: schema/migration ordering, API-before-UI, shared-service changes; soft: pattern-establishing, component reuse). Sequence so the most-depended-on stories come first.
8. Call out **white-label / multi-tenant** concerns per story (what belongs in config/adapters vs generic feature logic) and the RLS surface.

## Phase 3 — Write the plan

9. Write the epic plan to `.claude/local/plans/epics/<slug>.md`:

   ```markdown
   # Epic: <Name>

   **Status:** scoping | in progress | done
   **Goal:** <one line>
   **Why now:** <rationale>
   **Last updated:** <YYYY-MM-DD>

   ## Tracks

   ### Track 1 — <name>

   | Story ID | Title | Effort | Depends on | One-line scope |
   | -------- | ----- | ------ | ---------- | -------------- |
   | T1-1     | ...   | 3      | none       | ...            |

   ## Dependency graph (ASCII)

   ## Sequencing — recommended order, with rationale

   ## Cross-cutting concerns — RLS, white-label, shared components

   ## Open questions / risks
   ```

10. Update `.claude/local/plans/roadmap.md`: move the epic into "Now", list its tracks, append a dated working-notes entry.
11. Do **not** pre-write per-story files — the **track principal** creates them via `/pick-up` as each story is picked up. The epic plan's track tables are enough at this tier.
12. Optionally generate a static HTML kanban to `.claude/local/html-overviews/<slug>.html` if I ask for a walkthrough view (single self-contained file, no JS, one CSS grid per row, under ~400 lines, title-only cards).

## Output

Summarise in chat (brief): the track breakdown, the recommended first 1–3 stories with effort, the critical dependencies, and any open questions. End with a pointer:

```
Epic plan saved to .claude/local/plans/epics/<slug>.md and reflected in roadmap.md.
Ready to start? Hand the first track to a track principal:  /kickoff-track <track>
```

## Constraints

- British English throughout.
- **Do not implement** — planning only. No feature code.
- **Do not run git mutations** (commit/push/merge) — I control git. Reads + branch creation are fine.
- Effort in Fibonacci complexity points, never days/weeks.
- Don't load huge docs into this context — delegate heavy reading to sub-agents.
- Sequence one step at a time; don't pre-draft beyond the first track.
- Jira is dormant — do not create Jira tickets or fetch from Jira.
