# Plan Sprint — Execution Order & Worktree Analysis

Analyse the upcoming sprint and produce an execution plan with recommended story order and worktree candidates.

**Arguments**: $ARGUMENTS

## Argument Parsing

The argument should be the sprint number (e.g., `8`) or sprint name (e.g., `Sprint 8`). If no argument is provided, infer the next sprint from `project-documentation/project-state.md`.

---

## Phase 1: Gather Sprint Context

1. **Read project state** from `project-documentation/project-state.md` to understand:
   - What sprint just completed and its key deliverables
   - What the next sprint's goal and scope are
   - Prerequisites and dependencies from prior sprints

2. **Fetch sprint issues from Jira** using the Atlassian MCP tools:
   - Search for all issues in the sprint: `project = FFP AND sprint = "Sprint <N>"`
   - If that fails, try: `project = FFP AND sprint in openSprints()` or `project = FFP AND sprint in futureSprints()`
   - For each issue found, fetch the full details including:
     - Issue key, summary, type (Epic/Story/Task), status, priority
     - Story points
     - Description and acceptance criteria
     - All child sub-tasks (fetch each individually for full details)
     - Issue links and dependencies (blocks/is blocked by)

3. **Read the epic plan** if one exists:
   - Check `.claude/research/` for any epic plan files related to this sprint's epic
   - These contain detailed subtask breakdowns, ACs, and technical notes that may be more current than Jira

---

## Phase 2: Dependency Analysis

4. **Map dependencies** between user stories by analysing:

   **Hard dependencies** (blocking):
   - Explicit Jira links (blocks/is-blocked-by)
   - Schema/migration ordering (story A creates tables that story B queries)
   - API dependencies (story A creates endpoints that story B's UI consumes)
   - Shared service/entity changes (story A modifies a service that story B extends)

   **Soft dependencies** (recommended ordering):
   - Logical flow (backend before frontend for same feature)
   - Component reuse (story A creates a component that story B could reuse)
   - Knowledge dependencies (story A establishes patterns that story B follows)

5. **Build a dependency graph** showing the relationships between all stories.

---

## Phase 3: Worktree Assessment

6. **Assess each pair of independent stories** for worktree suitability using these criteria:

   | Criterion            | Suitable for Worktree                                                          | Not Suitable                                      |
   | -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
   | **Size**             | ≥5 story points or ≥4 subtasks                                                 | Small stories (<3 pts) — overhead exceeds benefit |
   | **Domain isolation** | Different packages/domains (e.g., one is backend-only, other is frontend-only) | Same domain, same files                           |
   | **Database**         | No overlapping migrations or schema changes                                    | Both add migrations (ordering conflicts)          |
   | **Shared files**     | Minimal shared file changes                                                    | Heavy overlap in shared utilities, config, types  |
   | **Merge complexity** | Clean merge expected                                                           | Complex merge conflicts likely                    |

   Rate each pair: **✓ Good candidate** / **⚠ Possible but risky** / **✗ Not worth it**

   **Key principle**: A worktree should only be recommended when the parallelism benefit clearly outweighs the merge/coordination overhead. Two small independent stories are better done sequentially than juggling worktrees.

---

## Phase 4: Recommend Execution Order

7. **Determine the recommended execution order** considering:
   - Hard dependencies must be respected
   - Soft dependencies influence ordering but don't block
   - Stories with the most dependents should be done first (unblock others)
   - High-priority stories take precedence when dependencies are equal
   - Worktree candidates are called out explicitly with timing

8. **Group into phases** for clarity:
   - Each phase contains stories that can be worked on in that period
   - Indicate which track each story belongs to (Main / Worktree)
   - Independent stories that don't warrant a worktree are simply sequenced

---

## Phase 5: Create Execution Plan

9. **Write the execution plan** to `.claude/plans/sprint-<N>-execution-plan.md` using this structure:

   ```markdown
   # Sprint <N> — Execution Plan

   **Sprint**: <N> — <Sprint Name> (~<total> pts)
   **Dates**: <start> – <end>
   **Epic**: <parent epic>
   **Sprint Goal**: <goal from Jira>

   ---

   ## Execution Order

   ### Phase 1 — <Phase Name>

   | Track        | Key     | Summary | Pts | Branch                 |
   | ------------ | ------- | ------- | --- | ---------------------- |
   | **Main**     | FFP-XXX | ...     | X   | `feature/sprintN`      |
   | **Worktree** | FFP-YYY | ...     | X   | `feature/ffp-yyy-slug` |

   **Why parallel?** <justification or "Sequential — worktree not warranted because...">

   **FFP-XXX subtasks** (N):

   - FFP-...: Description
   - FFP-...: Description

   ### Phase 2 — <Phase Name>

   ...

   ---

   ## Dependency Graph
   ```

   <ASCII dependency graph>
   ```

   ## Worktree Assessment

   | Story Pair         | Domain Overlap | DB Overlap            | Shared Files | Size       | Verdict          |
   | ------------------ | -------------- | --------------------- | ------------ | ---------- | ---------------- |
   | FFP-XXX vs FFP-YYY | ✓ Low          | ✓ None                | ✓ Minimal    | Both ≥5pts | ✓ Good candidate |
   | FFP-XXX vs FFP-ZZZ | ✗ High         | ✗ Both add migrations | ⚠ Some      | ...        | ✗ Not worth it   |

   ## Prerequisites
   - ✅ FFP-...: <completed prerequisite>
   - ✅ FFP-...: <completed prerequisite>

   ## Key Reference Documents
   - `path/to/doc` — description

   ```

   ```

---

## Output

After creating the execution plan file, provide a summary to the user:

1. **Sprint overview** — goal, total points, date range
2. **Execution order** — numbered list with story keys, names, and points
3. **Worktree recommendation** — which stories (if any) suit parallel work, with brief justification
4. **Dependency highlights** — any critical ordering constraints
5. **Questions or risks** — anything that needs clarification before starting

End with:

```
✅ Sprint <N> execution plan saved to .claude/plans/sprint-<N>-execution-plan.md

Ready to start? Pick up the first user story:
  /pick-up <first-story-key>

Or start the worktree story in parallel:
  /worktree --pick-up=<worktree-story-key> --current=<main-story-key> --sprint=feature/sprint<N>
```

---

## Constraints

- Use **British English** throughout
- Do not run `git add`, `git commit`, or `git push`
- Do not start implementation — this is analysis and planning only
- Do not load entire epic plan files into the main context if they're very large — use sub-agents for heavy reading
- If the sprint has no clear worktree candidates, say so plainly — don't force it
- Keep the execution plan file concise but complete
