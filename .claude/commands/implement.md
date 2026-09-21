# Implement — Inherit a Kickoff and Take It to Commit-Ready

You are an **implementation session**: inherit a kickoff, implement it on one branch, clean up after yourself, get it reviewed, and hand back a commit message. This is a session type that writes feature code.

**Arguments**: $ARGUMENTS — the path to the kickoff file (e.g. `.claude/local/plans/prompts/T2-4-kickoff.md`). A story ID is also accepted; resolve it to `.claude/local/plans/prompts/<story-id>-kickoff.md`.

`/work-on` is the lighter variant that stops at the completion gate for a manual review. **Use `/implement` when you want the whole run** — implementation, comment hygiene, a delegated review actioned, the work actually run and verified (browser for UI, live API plus a direct database read for server-side work), and a commit message — in one pass.

---

## Phase 0 — Inherit

1. **Read the kickoff in full.** It is the brief: intent, read-first order, numbered scope, what is out, patterns and hygiene, constraints, definition of done. If the path does not resolve, ask rather than guessing.
2. **Move the kickoff to the consumed archive** — `mv .claude/local/plans/prompts/<name>.md .claude/local/plans/prompts/read/` (create `read/` if absent). Do this once you have actually loaded it to act on, not before.
3. **Read the story file** the kickoff names, plus `.claude/local/plans/project-state.md`. The story file and the kickoff are the source of truth — **flag any conflict between them before writing code**, do not silently pick one.
4. **Read `.claude/local/notes/review-context.md`** to see what is already on this branch. First story on the branch → you will replace it. Continuation → build on it.
5. **Rename the session** to the kickoff's session name via `/rename`.
6. **Confirm the branch.** Create it off the stated base if it does not exist (`git checkout -b <branch> <base>` is fine). Never commit, push, merge or rebase.
7. **Load the skills the kickoff names** — `backend`, `database`, `frontend`, `infrastructure`, `prototype`.

## Phase 1 — Implement

8. **Read 2–3 existing files in the same pattern before writing new ones.** Match their signatures, error classes, logging and naming.
   - **Backend:** layer order Schema → Repository → Service → Handler. Reuse the shared utilities (`applyPagination`, `escapeLikePattern`, `formatDateOnly`, `buildPaginationMeta`, `withAdminContext`). Set RLS context inside every transaction on RLS-enforced tables; catalogue tables are RLS-excluded and gated by a `system_admin` check in the handler.
   - **Frontend:** use the existing components rather than raw HTML — `FormTextInput`, `FormSelect`, `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `ListEmptyState`, `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`. Follow the hook patterns (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`), `ffpClient` + `parseApiResponse` + Zod, and the hierarchical query-key factory. One component per file — helper components get their own file, never co-located. Arrow functions typed `React.FC`. Dates through `Intl.DateTimeFormat('en-GB')`. Theme colours and themed components only.
   - **General:** extend existing files and utilities before adding new ones. **Ask before inventing a new abstraction, component variant or pattern.**
9. **Implement to the acceptance criteria**, under the kickoff's constraints: British English; wellness vocabulary in new copy; no `.claude/local` references and no planning labels in shipped code; package boundaries (`@ffp/web` imports `@ffp/core` only; `@ffp/database` never imports `@ffp/core`).
10. **Migrations only.** Generate a migration, then apply it to **both** `ffp_dev` and `ffp_test`. The push-style schema sync is forbidden and hook-blocked. **Confirm with me before any INSERT / UPDATE / DELETE**, including seed data.
11. **Defer tests** unless they are critical for the feature to work, or the kickoff asks for them.

## Phase 2 — Validate yourself

12. **Run the gates and read the output**: `pnpm typecheck`, `pnpm lint` (0 warnings), **`pnpm format:check`**, `pnpm test`, and `pnpm build` where package boundaries changed. **`lint` does not cover formatting in this repo** — T2-7 shipped five unformatted files behind a green lint run, so `format:check` is part of the set, not an extra. Green gates before you go near the review — do not delegate a review of code that does not compile.

## Phase 3 — Self-check against the neighbours

You read the sibling files in Phase 1 to learn the pattern. Now check you actually followed it — this is cheaper to fix before a reviewer finds it, and it catches the class of problem a diff alone cannot show.

13. **Open the nearest sibling again and read your new code beside it.** The other service in the domain, the other repository, the other handler on the same resource. Check: return contract (throws `NotFoundError` where siblings throw, rather than returning `null`), client type, error classes, transaction and RLS handling, gating, logging shape, naming and argument order. **Duplication is code written twice; divergence is code written differently from the thing that already does this job** — and nothing in your diff will look wrong. Where you diverged deliberately, leave a comment saying why; where you diverged by accident, fix it.
14. **Check the diff against itself.** Two new files copy-pasted from each other with small edits is duplication you introduced in one sitting — collapse it now rather than letting the review name it.
15. **Check nothing you changed invalidated its documentation.** If the branch changed how a domain works, the domain's `CLAUDE.md` and any `.claude/rules/` contract it names are part of the change, not a follow-up.

## Phase 4 — Comment hygiene pass

Go through **the comments this branch added** — the diff, not the repository. Leave pre-existing comments alone unless the change made them wrong.

16. **A comment that stays earns its place by explaining WHY** — a non-obvious constraint, a gotcha, a deliberate trade-off, the reason for an unusual approach. One or two lines. If the code already says it, the comment goes.
17. **Trim what stays.** Cut preamble, restated parameter lists, and narration of the next line. Shorter is the goal.
18. **Delete outright:** comments restating the code, section banners over obvious blocks, commented-out code, and TODOs for work nobody has committed to.

**Never present in shipped code — remove on sight:**

- Story, track, phase, gate or sprint labels ("T2-4", "Phase 4", "Track 2", "part of the T3-3 work")
- References to future or planned work ("a later story will…", "when the assembler lands", "deferred to v2", "the next session should…")
- References to `.claude/local` or anything under it — those files never ship
- References to the session, the review, the kickoff, the plan, or to me as the author of a decision
- Anything a reader outside this repo's planning context could not make sense of

**Describe the thing, not the plan.** "Reorder uses a two-phase write because the unique constraint on (template_id, display_order) rejects a direct swap" is a comment. "T2-4 reorder — see the kickoff" is not.

19. **Re-run the gates** after the pass. Deleting a comment can orphan an import or an eslint directive.

## Phase 5 — Delegated review

20. **Dispatch one sub-agent** to run the `full-review` skill over this branch's diff. Brief it to: invoke `full-review`, write findings to `.claude/local/notes/review-comments.md` following the add-or-reconcile rule, **edit no code**, and report back only the severity counts and the recommendation. The point of delegating is that the diff reading and file dumps stay out of this session's context — do not run the review here as well.
21. **Read `review-comments.md` yourself** when it returns, and action it:
    - **Blocking (B)** — fix all of them.
    - **Warning (W)** — fix unless the fix is disproportionate to the risk, or it contradicts a decision baked into the kickoff.
    - **Suggestion (S)** — take the cheap, clearly-right ones. Decline churn, speculative generality, and anything that fights an established pattern.
    - A reviewer is not always right. **If a finding is wrong, say so and leave the code alone** — do not implement a change you believe is incorrect to clear a list.
22. **Record the outcome in `review-comments.md`** under a Resolution section: what was fixed, what was declined and why, one line each.
23. **Re-run the gates** after actioning.

## Phase 6 — Run it and watch it work

**Green gates are not evidence the feature works.** Typecheck proves the types line up; unit tests with mocked repositories prove the validation branches fire. Neither one proves a route is registered, a role gate fires, a path parameter is extracted, an error maps to the right status code, or a row lands in the database with the values you intended. Those only show up when the thing actually runs.

**This phase is not optional, and it is not only for UI work.** Pick the checks by what the branch touched — a branch that touched both does both:

| The branch touched…                             | Then verify…                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A user-facing surface                           | The browser (24a)                                                                            |
| An API, handler, route, service or repository   | The live API **and** the database (24b)                                                      |
| A migration or schema change                    | The database directly (24b), plus the migration applied to **both** `ffp_dev` and `ffp_test` |
| Only internal utilities with no runtime surface | Say so in the report and skip — but say it, do not go quiet                                  |

### 24a. Browser check — user-facing surfaces

- Puppeteer MCP against `http://localhost:3000`; launch with `defaultViewport: null` and `--start-maximized`, screenshot at full size, and reset the viewport afterwards or the page renders into a small box.
- **Ask me to log in** — Cognito needs a human. Wait for my confirmation before continuing.
- **Walk the actual acceptance criteria**, not a smoke test: the states the story added, the error and empty states, and one path through anything the review touched. Screenshot the key verification points, not every click.
- A screenshot that contradicts the acceptance criteria is a defect to fix, not a caveat to note.

### 24b. API and database check — server-side work

**Start the worker yourself.** `pnpm sst:dev` in the background — the deployed dev API proxies to a local worker, so every call fails with "sst dev is not running" until it is up. You do not need to ask me to start it; do check whether it is already running first, and tell me at the end whether you left it up.

- **API base URL:** `apiUrl` from `.sst/outputs.json`. **Credentials:** `.claude/local/notes/logins-for-local.json` (System Admin, Customer Admin, Programme User). Authenticate with `POST {api}/auth/login` and use the **`idToken`** — the `custom:role` claim that the role gates read lives there, not in the accessToken. Keep tokens in-session; never write one to a file that persists.
- **Read the database directly.** `psql -d ffp_dev` works on local trust auth — no credentials, and **never read `.env`**. Use it to confirm the actual column values. An API response that echoes back what you sent proves nothing: a write and a read sharing the same bug agree with each other perfectly. Check the columns the story is about — ordering, nullability, foreign keys, soft-delete flags, timestamps.
- **Walk the acceptance criteria, then the failure modes.** The happy path, then each error the story specifies (404, 409, 400 — whatever it names), then the role gate with a **non-admin** token, then unauthenticated. After every rejected call, confirm the database is unchanged: a 400 that half-committed is a far worse bug than a 400 that should have been a 200.
- **Verify the invariants the story rests on**, not just the endpoints. If a unique constraint forced a particular write strategy, prove the strategy holds under the real index — and check no intermediate state leaked (temporary values, orphaned rows, gaps in a sequence).

### 25. Keep `ffp_dev` clean — leave it exactly as you found it

- **Never _write_ to seeded data. Always _read_ it.** The rule is about writes: create your own throwaway records for anything that mutates, because touching a seeded template, flow or question corrupts the fixture every later session depends on.
- **But read-only probes across the seeded set are required, not merely allowed** — a GET of every seeded row through the changed code path, or a no-op request that exercises validation without writing. They risk nothing and they catch the thing throwaway records cannot: your new code meeting **data you did not create**. T2-7 shipped a regression that made all four seeded video-response questions uneditable; gates were green, the live run passed on throwaway records, and only the reviewer reasoning about stored seed data found it. A read-only sweep would have caught it first.
- **Snapshot before, compare after.** Record the relevant counts and rows before you start, and re-run the same queries at the end to show the seeded data is untouched. Put that comparison in the report.
- **If you do corrupt a seeded row, restore it from the seed script, never from memory.** T2-7 overwrote a seeded question's text while "restoring" it from an assumed original. Read `packages/database/seed/` for the true value, diff against it, and confirm the row matches before moving on.
- **Remove everything you created.** The database goes back to its prior state — no deactivated leftovers, no orphaned join rows. Where the API only soft-deletes, clean-up needs SQL, and **`DELETE` still needs my explicit go-ahead**: hand me the exact statement and ask. Ask once, at the end, with the results — not as a blocking question mid-run.
- **Then verify the clean-up actually landed. Handing me a statement is not clean-up.** Re-run the snapshot queries and show the throwaway rows are gone and the seeded counts are back to baseline. Twice now a session has handed over its SQL, written its summary and moved on, and the rows were still there days later — once the statement was even a no-op, because a previous run had already cleared them, and nobody would have known. **A row count is the evidence; the statement is not.**

### 26. Report what actually happened

A table of checks and outcomes beats prose. **Anything that failed, or that you could not verify, stays in the report** however terse the rest gets. If the run turned up a bug that predates the branch, say so plainly and say how you established it was pre-existing — then record it in `review-comments.md` as a carry-forward rather than fixing it here.

## Phase 7 — Commit message

27. **Write the full message to `.claude/local/notes/commit.md`** (overwrite it — it is a rolling single-draft file): an imperative subject line, a blank line, then a body covering what changed and why. FFP commit format, British English, no Jira key. **No `Co-Authored-By` trailer.**
28. **Never paste a multi-line commit message into chat** — the TUI mangles it. Hand me the ready-to-run command instead:
    - `git commit -F .claude/local/notes/commit.md`
    - amend: `git commit --amend -F .claude/local/notes/commit.md`

## Phase 8 — Report, then stop

29. **Give me a lean summary** — what shipped, what the review returned and what you did with it, what running it actually showed (browser, API, database — whichever applied), **the environment's state (clean, or what is outstanding)**, anything you decided or assumed, and anything left undone. Fragments over sentences. No preamble, no restating the story, no closing offer. Bad news stays in however terse it gets: failures with their output, skipped steps, assumptions made.
30. **Name the gate before you stop.** Close the summary with one line telling me the branch is ready for review and that **wrap-up is waiting on my word** — e.g. "Ready for review. Say the word and I'll write the completion summary for the principal." Do not write it yet, do not set the story to done, do not touch the roadmap or `project-state.md`, do not open a PR.
31. **Then stop.** I review the branch and ask for wrap-up explicitly. Asking is my call and mine alone — never infer it from a "looks good", a merge, or silence.

## Phase 9 — Wrap-up (only once I have asked)

**Every implementation session ends with a completion summary.** It is the hand-back artefact: the principal session that scoped this story reads the summary, not the branch, and it is how the plan stays true. A session that ends without one has dropped the work on the floor — but it is **my** call when to write it, because a summary written before review describes an unfinished session and has to be rewritten once findings land.

### Before you write anything: the environment must be verified clean

**The story is not done while `ffp_dev` still holds rows this session created.** Clean-up is part of the work, not an errand attached to the end of it, and a summary that declares the story complete over a dirty database is inaccurate on its face.

So, first thing in this phase:

32. **Re-run your snapshot queries and prove the state.** Throwaway rows gone, seeded counts back to baseline, no orphaned join rows, no deactivated leftovers. **Read the numbers — do not infer them from the fact that you handed me a statement.**
    - **Clean** → say so with the counts, and carry on to the rest of the phase.
    - **Not clean, and it needs my `DELETE`** → stop here, hand me the exact statement, and ask. Wait. When I confirm, re-run the check before continuing.
    - **Nothing was ever created** → say that explicitly. Do not go quiet on it.

**I can override this**, and sometimes will — if I say to write the summary anyway, write it. But then the summary's Environment section leads with **what is still outstanding and the exact statement that clears it**, in full, not as a footnote. An overridden gate that leaves no trace is the same failure with extra steps.

33. **Replace `.claude/local/notes/review-context.md`** with a reviewer brief: a changed-files tree with M/A markers and one clause per file, the story's goals, the acceptance-criteria checklist, areas to focus on, known limitations, and any questions for the reviewer. Template: `.claude/local/notes/review-context-template.md`.
34. **Move the story into `complete/` and write the completion summary beside it** — `.claude/local/plans/epics/<epic-family>/<epic>/user-stories/complete/<grouping>/us-<slug>-completion-summary.md`, so the done story and its outcome travel together. It covers:
    - **What shipped** — the actual surface, not a restatement of the scope list.
    - **Deltas from scope** — anything built differently from the kickoff, with the reason. This is the part principals most need and sessions most often omit.
    - **Carry-forwards**, grouped by where they go — the story or epic that should own each one. A carry-forward with no destination is a note nobody will action.
    - **Open items** — decisions the principal needs to take, review findings deliberately declined, and anything left undone.
    - **Environment — REQUIRED, never omitted.** State `ffp_dev`'s condition in plain numbers: what you created, that it is gone, and the seeded counts matching the session-start snapshot. If anything is outstanding, this section carries the exact statement that clears it. A summary with no Environment section reads as "nobody checked", because that is usually what it means.
35. **Update the story file** — status → done, `Last updated` → today.
36. **Append a dated entry to `.claude/local/plans/roadmap.md`** (newest first) and **refresh the active threads in `.claude/local/plans/project-state.md`**. A stale plan hands the next session a wrong picture.
37. **Hand it back.** Tell me which principal session the summary is for and give me the one-line pointer to paste into that pane. Then stop — the principal absorbs it, not you.

## Constraints

- **Git history is mine.** Never run `add`, `commit`, `push`, `merge`, `rebase`, `tag`, `cherry-pick` or `reset --hard`. Read-only git, plus `checkout` and branch creation, are fine.
- **Infrastructure mutations are handed to me as exact commands** — SST/Terraform apply, deploys, secrets. Read-only inspection is fine.
- **Never read `.env`.**
- British English throughout; wellness vocabulary in new copy.
- One component per file. Theme colours and themed components only.
- Confirm before any database write.
- The review sub-agent surfaces findings; **this session applies them**. Never ask the reviewer to fix its own findings.
- Jira is dormant — the story file and the kickoff are the source of truth.
