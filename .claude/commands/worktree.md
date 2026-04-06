# Worktree — Parallel User Story

Work on a second user story in parallel using a git worktree.

**Arguments**: $ARGUMENTS

## Argument Parsing

Extract the following flags from the arguments:

- `--pick-up=<JIRA-KEY>` — the user story to pick up and work on in the worktree
- `--current=<JIRA-KEY>` — the user story currently being worked on (for conflict assessment)
- `--sprint=<BRANCH-NAME>` — the sprint branch to base the worktree on (e.g., `feature/sprint7`)

If any flag is missing, ask the user for the missing values before proceeding.

## Session Setup

**Rename the session** to `FFP-{pick-up key number} {Jira story title} (Worktree)` (e.g., `FFP-282 Video Catalogue Schema (Worktree)`). Use the `/rename` command after fetching the story details.

## Phase 1: Conflict Assessment

1. **Fetch both user stories** from Jira using the Atlassian MCP tools. Get full ticket details including description, acceptance criteria, and all linked sub-tasks/child issues for both stories.

2. **Fetch all sub-tasks** for both stories individually to get their full details (description, acceptance criteria, status).

3. **Analyse conflict risk** between the two stories by assessing overlap across these dimensions:
   - **Database schemas**: Both adding/modifying tables? Which tables? Do they touch the same migration files?
   - **Domain directories**: Which `packages/core/<domain>/`, `packages/functions/<domain>/` directories does each story touch?
   - **Shared infrastructure**: SST stacks, package dependencies, configuration files
   - **Shared utilities**: `packages/core/lib/`, shared types, error classes
   - **`.claude/local/project-state.md`**: If it exists, will always conflict between worktrees — this is trivially resolvable, note it but don't block on it

   Rate each dimension: ✓ Low / ⚠ Medium / ✗ High

4. **Output the conflict assessment** in this format:

   ```
   Conflict Assessment: <PICK-UP-KEY> vs <CURRENT-KEY>
   ────────────────────────────────────────────────────
   <PICK-UP-KEY>: <story summary>
   <CURRENT-KEY>: <story summary>

   Overlap:
     Database schemas:  <detail>                    <rating>
     Domain dirs:       <detail>                    <rating>
     Shared infra:      <detail>                    <rating>
     Shared utilities:  <detail>                    <rating>
     project-state.md:  Will conflict if exists      ⚠ Expected

   Overall Risk: <LOW|MEDIUM|HIGH> — <recommendation>
   ```

5. **If HIGH risk**: Warn the user clearly and ask whether to proceed. Do NOT continue without explicit confirmation.
   **If LOW or MEDIUM risk**: Proceed automatically to Phase 2.

## Phase 2: Create Worktree

6. **Derive the branch name** from the pick-up story's Jira title:
   - Format: `feature/<jira-key-lowercase>-<slugified-title>`
   - Example: Story "FFP-282: Video Catalogue Database Schema" → branch `feature/ffp-282-video-catalogue-database-schema`
   - Use lowercase, hyphens for spaces, strip special characters

7. **Create the git worktree** branching from the sprint branch:

   ```bash
   git worktree add .claude/worktrees/<jira-key-lowercase> -b <derived-branch-name> <sprint-branch>
   ```

   For example:

   ```bash
   git worktree add .claude/worktrees/ffp-282 -b feature/ffp-282-video-catalogue-database-schema feature/sprint7
   ```

8. **Verify** the worktree was created successfully:
   - Confirm the directory exists
   - Confirm the branch name and base are correct (`git -C <worktree-path> branch --show-current`)

## Phase 3: Pick Up (in Worktree)

**CRITICAL**: All file read and write operations in this phase MUST target the **worktree path**, NOT the main repository. Use absolute paths to the worktree for every file operation.

The worktree absolute path is: `<repo-root>/.claude/worktrees/<jira-key-lowercase>`

9. **Read project context** from the **worktree** copy:
   - `<worktree-path>/.claude/local/project-state.md` — current sprint status, what's been completed, decisions made. **If this file does not exist**, warn the user: _"⚠ `.claude/local/project-state.md` not found — using Jira as sole context source. See `project-documentation/project-state.md` for setup instructions."_ Then continue using Jira context only.
   - Any other relevant documents in `<worktree-path>/project-documentation/` that relate to this user story's domain (e.g., `architecture.md`, `database-schema.md`, `authentication.md`)

10. **Evaluate and reconcile** the pick-up story's sub-tasks against current project state:
    - Identify any outdated requirements (things already done, approaches that have changed)
    - Note dependencies between sub-tasks
    - Flag any blockers or prerequisites
    - Amend requirements where the ticket is out of date vs reality

11. **Determine execution order** for the sub-tasks:
    - Consider dependencies (which sub-tasks must come before others)
    - Group sub-tasks that are small enough to be completed together — preference is to keep the entire user story on one branch where practical
    - Unless absolutely critical, **defer all tests until MVP launch**

12. **Update the worktree copy of `project-state.md`** with the implementation plan (skip this step if the file does not exist):
    - File path: `<worktree-path>/.claude/local/project-state.md`
    - Clean up/remove the previous user story's implementation plan to keep context lean
    - Add the new implementation plan with:
      - User story summary
      - Ordered sub-task list with groupings
      - Any amended requirements or notes
      - Dependencies and prerequisites
    - Keep the format consistent with what's already in the file

13. **Ask clarifying questions** if anything is ambiguous or if you spot conflicts between ticket requirements and current project state.

## Output

After completing all phases, provide:

1. **Conflict assessment summary** (from Phase 1)
2. **User story overview** and execution plan (from Phase 3)
3. **Any changes made** to outdated requirements
4. **Any questions or decisions** needed before starting implementation
5. **Next steps** — always end with this section, clearly formatted:

   ```
   ✅ Pick-up complete — implementation plan is in .claude/local/project-state.md

   ┌─────────────────────────────────────────────────────────┐
   │  NEXT STEPS                                             │
   │                                                         │
   │  1. Open a new terminal and start a Claude session:     │
   │                                                         │
   │     cd <worktree-absolute-path>                         │
   │     claude                                              │
   │                                                         │
   │  2. Begin implementation with the first sub-task:       │
   │                                                         │
   │     /work-on <first-subtask-key>                        │
   │                                                         │
   │  3. Continue with each sub-task in order:               │
   │     /work-on <second-subtask-key>                       │
   │     /work-on <third-subtask-key>                        │
   │     ...                                                 │
   │                                                         │
   └─────────────────────────────────────────────────────────┘

   Worktree Details
   ────────────────
   Path:     <worktree-absolute-path>
   Branch:   <derived-branch-name>
   Based on: <sprint-branch>

   When all sub-tasks are complete:
     1. Commit and push the worktree branch
     2. Merge into the sprint branch (or create PR)
     3. Clean up: git worktree remove .claude/worktrees/<jira-key-lowercase>
   ```

## Constraints

- Use **British English** throughout
- Do not run `git add`, `git commit`, or `git push`
- Do not start implementation — this is planning only
- **All file reads/writes in Phase 3 MUST use absolute worktree paths**, not main repo paths
- Defer tests unless absolutely critical
