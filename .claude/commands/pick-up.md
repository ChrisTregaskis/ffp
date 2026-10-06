# Pick Up Story — Scope & Draft Kickoff

You are acting as the **track principal**. Take one story, reconcile it against current reality, finalise its scope, and draft the **kickoff prompt** that a fresh implementation session will run. **Orchestrate, don't implement** — no feature code here.

**Arguments**: $ARGUMENTS — a story ID (e.g. `T1-2`) or slug. If a matching story file doesn't exist yet, create one from the epic plan.

---

## Phase 1 — Load context

1. Read `.claude/local/plans/project-state.md` (snapshot) and `.claude/local/plans/roadmap.md` (active threads).
2. Read the parent epic plan in `.claude/local/plans/epics/<slug>.md` for this story's track and dependencies.
3. Read the story file `.claude/local/plans/epics/<epic-family>/<epic>/user-stories/<grouping>/us-*.md` if it exists. If not, draft it now using the story shape in `CLAUDE.local.md`.
4. Read the relevant `project-documentation/` and any `notes/spikes/` findings for the domain.

## Phase 2 — Reconcile & finalise scope

5. Reconcile the story against current reality: identify anything already done, approaches that have changed, new dependencies, or blockers. Amend the story's scope where it's out of date. **Supersede rather than delete** if scope changed materially — leave a pointer.
6. Read 2–3 existing implementations in the same pattern so the kickoff can point at them (e.g. the FFP-439 template-CRUD pages when scoping assessment-flow CRUD).
7. **Verify every factual premise you are about to write into the kickoff — especially the ones that narrow scope.**

   A claim in a kickoff is not context. It is a **constraint the session obeys.** "X is already consistent, so migrating it is out of scope" reads to an implementation session as settled, and a well-behaved one will not go looking. T3-7 was scoped as "two small bugs" on my claim that locations, organisations and users were internally consistent — **all three returned a 500 on every Save**, and three shipped admin edit screens could not save at all. The session found it only because it probed the live API before writing code, which its kickoff never asked it to do.

   **Verify by the strongest means available, in this order:**

   | Means                                                                 | Use when                                                                   |
   | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
   | **A live probe** — call the endpoint, read the row                    | Anything about runtime behaviour. Strongest, and usually minutes.          |
   | **Reading the code path end to end** — handler → service → repository | Structure and contracts. Follow it to the query, not to the next function. |
   | **`grep`**                                                            | Locating things. **Never for concluding something does not exist.**        |

   **An empty `grep` is not evidence of absence.** Confirm the path exists first — `ls` it — because a search against a directory that is not there returns exactly what a clean result returns. **Never run an exploratory search with `2>/dev/null`:** it swallows "No such file or directory", which is the one message that would have told you the search was meaningless. That is precisely how the T3-7 premise was manufactured, stated in a table, and believed.

8. Confirm the branch name (one story, one branch). Note structural dependencies that must land first.
9. Ask clarifying questions on any genuine ambiguity before drafting — use `AskUserQuestion` for real forks.

## Phase 3 — Draft the kickoff

10. Write **one** kickoff prompt to `.claude/local/plans/prompts/<story-id>-kickoff.md` using the kickoff shape from `CLAUDE.local.md`:

- intent (2–4 lines); read-first order; numbered in-scope items with gotchas inline; out-of-scope (and which story owns it); constraints (British English, no `.claude/local`/phase-gate jargon in shipped files, package boundaries, RLS); definition of done incl. gates (typecheck/lint/test/build); the "when done" block (write completion summary + reviewer brief, tell the principal, don't open the PR, STOP for review before wrap-up).
- **A "Patterns & hygiene (acceptance criteria)" section** (per the kickoff shape): name the specific reference files to mirror; no duplicate surface; keep files focused; abstract only to remove real duplication and ask before inventing one; reuse existing utilities/error classes/logging. Make these first-class DoD items (applied as the impl writes, not deferred to the review pass), and reflect them in the Definition of done.
- The kickoff must tell the impl session which skill(s) to load: `/database`, `/backend`, `/frontend`, `/infrastructure`.
- **Say how each load-bearing premise was established, and licence the session to overturn it.** Where the kickoff asserts a fact that narrows scope, state the evidence in the same breath — "probed live on <date>: PUT with a publicId returns 500" carries weight that "these are consistent" does not, and it tells the session what to re-check versus trust. Then add, explicitly: **if a premise turns out to be wrong, the evidence wins — say so and stop rather than building on it.** Without that line a session treats an out-of-scope item as final, which is the whole failure mode.

11. Update the story file's status to "in progress" and `roadmap.md`'s working notes (dated entry). Refresh `project-state.md` active threads if the headline changed.

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
