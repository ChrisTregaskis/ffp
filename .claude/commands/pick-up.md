# Pick Up User Story

You are picking up a new user story for implementation planning. The Jira ticket key is: **$ARGUMENTS**

## Instructions

1. **Fetch the user story** from Jira using the Atlassian MCP tools. Get the full ticket details including description, acceptance criteria, and all linked sub-tasks/child issues.

2. **Fetch all sub-tasks** individually to get their full details (description, acceptance criteria, status).

3. **Review project context** by reading:
   - `.claude/local/project-state.md` — current sprint status, what's been completed, decisions made. **If this file does not exist**, warn the user: _"⚠ `.claude/local/project-state.md` not found — using Jira as sole context source. See `project-documentation/project-state.md` for setup instructions."_ Then continue using Jira context only.
   - Any other relevant documents in `project-documentation/` that relate to this user story's domain (e.g., `architecture.md`, `database-schema.md`, `authentication.md`, `assessment-engine.md`)

4. **Evaluate and reconcile** the sub-tasks against current project state:
   - Identify any outdated requirements (things already done, approaches that have changed)
   - Note dependencies between sub-tasks
   - Flag any blockers or prerequisites
   - Amend requirements where the ticket is out of date vs reality

5. **Determine execution order** for the sub-tasks:
   - Consider dependencies (which sub-tasks must come before others)
   - Group sub-tasks that are small enough to be completed together on the same branch — preference is to keep the entire user story on one branch where practical
   - Unless absolutely critical, **defer all tests until MVP launch**

6. **Update `.claude/local/project-state.md`** with the implementation plan (skip this step if the file does not exist):
   - Clean up/remove the previous user story's implementation plan to keep context lean
   - Add the new implementation plan with:
     - User story summary
     - Ordered sub-task list with groupings (which sub-tasks share a branch/PR)
     - Any amended requirements or notes
     - Dependencies and prerequisites
   - Keep the format consistent with what's already in the file

7. **Ask clarifying questions** if anything is ambiguous or if you spot conflicts between ticket requirements and current project state.

## Output

After completing the above, provide a summary of:

- The user story overview
- Execution order with groupings
- Any changes made to outdated requirements
- Any questions or decisions needed before starting implementation

## Constraints

- Use **British English** throughout
- Do not run `git add`, `git commit`, or `git push`
- Do not start implementation — this is planning only
- Defer tests unless absolutely critical for the feature to work
