# Pick Up Story — Scope & Draft Kickoff

You are acting as the **track principal**. Take one story, reconcile it against current reality, finalise its scope, and draft the **kickoff prompt** that a fresh implementation session will run. **Orchestrate, don't implement** — no feature code here.

**Arguments**: $ARGUMENTS — a story ID (e.g. `T1-2`) or slug. If a matching story file doesn't exist yet, create one from the epic plan.

---

## Phase 1 — Load context

1. Read `.claude/local/plans/project-state.md` (snapshot) and `.claude/local/plans/roadmap.md` (active threads).
2. Read the parent epic plan in `.claude/local/plans/epics/<slug>.md` for this story's track and dependencies.
3. Read the story file `.claude/local/plans/user-stories/<track-slug>/us-*.md` if it exists. If not, draft it now using the story shape in `CLAUDE.local.md`.
4. Read the relevant `project-documentation/` and any `notes/spikes/` findings for the domain.

## Phase 2 — Reconcile & finalise scope

5. Reconcile the story against current reality: identify anything already done, approaches that have changed, new dependencies, or blockers. Amend the story's scope where it's out of date. **Supersede rather than delete** if scope changed materially — leave a pointer.
6. Read 2–3 existing implementations in the same pattern so the kickoff can point at them (e.g. the FFP-439 template-CRUD pages when scoping assessment-flow CRUD).
7. Confirm the branch name (one story, one branch). Note structural dependencies that must land first.
8. Ask clarifying questions on any genuine ambiguity before drafting — use `AskUserQuestion` for real forks.

## Phase 3 — Draft the kickoff

9. Write **one** kickoff prompt to `.claude/local/plans/prompts/<story-id>-kickoff.md` using the kickoff shape from `CLAUDE.local.md`:
   - intent (2–4 lines); read-first order; numbered in-scope items with gotchas inline; out-of-scope (and which story owns it); constraints (British English, no `.claude/local`/phase-gate jargon in shipped files, package boundaries, RLS); definition of done incl. gates (typecheck/lint/test/build); the "when done" block (write completion summary + reviewer brief, tell the principal, don't open the PR, STOP for review before wrap-up).
   - The kickoff must tell the impl session which skill(s) to load: `/database`, `/backend`, `/frontend`, `/infrastructure`.
10. Update the story file's status to "in progress" and `roadmap.md`'s working notes (dated entry). Refresh `project-state.md` active threads if the headline changed.

Draft **one kickoff at a time** — do not pre-draft the next story.

## Output

Summarise (brief): story intent, final scope (in/out), branch, dependencies, any amendments made. Then give me the kickoff to paste into the implementation pane:

```
Kickoff saved to .claude/local/plans/prompts/<story-id>-kickoff.md

In the implementation pane (bottom-right), start a fresh session and run:
  /work-on <story-id>
```

## Constraints

- British English throughout.
- **Do not implement** — planning only.
- **Do not run git mutations** — I control git. Reads + branch creation are fine.
- Defer tests unless critical for the feature to function (Phase 1 philosophy).
- `.claude/local/` is the source of truth — Jira is dormant, don't fetch from it.
