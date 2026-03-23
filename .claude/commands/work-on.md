# Work On Sub-Task

You are implementing a sub-task from an active user story. The Jira ticket key for the sub-task is: **$ARGUMENTS**

**Note**: This is a Jira ticket key, not a GitHub issue number.

## Setup

1. **Read the implementation plan** from `project-documentation/project-state.md` — this is the source of truth for what needs to be done, execution order, and branch groupings. The parent user story context is already documented here from the `/pick-up` step.

2. **Fetch the sub-task** from Jira using the Atlassian MCP tools. Get the full ticket details (description, acceptance criteria, status).

3. **Reconcile**: If the Jira ticket conflicts with `project-state.md`, treat `project-state.md` as the source of truth. Flag any discrepancies and clarify with the user before proceeding.

4. **Read `.claude/review-context.md`** to understand what's already been done on this branch:
   - If this is the **first sub-task** of the user story, you will need to completely rewrite `review-context.md` with fresh context for this user story
   - If this is a **continuation**, the file will contain prior sub-task work — build on it

5. **Load the relevant Claude skill** based on the requirements of the sub-task:
   - Database schema/migration work → `/database`
   - Lambda handlers, services, repositories → `/backend`
   - React components, pages, hooks → `/frontend`
   - SST infrastructure → `/infrastructure`
   - Multiple domains → load the primary skill, reference others as needed

## Implementation

6. **Follow existing patterns** — this is critical for code consistency and quality:

   **Backend (CRUD APIs):**
   - Before writing new code, read existing implementations in the same domain (e.g., customer APIs when building user APIs)
   - Follow the established layer pattern: Schema → Repository → Service → Handler
   - Reuse shared utilities (`applyPagination`, `escapeLikePattern`, `formatDateOnly`, `buildPaginationMeta`, `withAdminContext`)
   - Match the existing service method signatures, error handling patterns, and logging conventions
   - If the pattern doesn't fit, ask the user before inventing a new approach

   **Frontend (UI pages):**
   - Before building a new page, read the most recent equivalent (e.g., `CustomerListPage` when building `UserListPage`)
   - Use existing components — never create raw HTML elements when a component exists (`FormTextInput`, `FormSelect`, `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`)
   - Follow established hooks patterns (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`)
   - Match the API client pattern (`ffpClient` + `parseApiResponse` + Zod schema validation)
   - Match the query key factory pattern (hierarchical `as const` tuples)
   - If a new component variant is needed (e.g., `disabled` prop on `FormTextInput`), ask the user before adding it

   **General:**
   - Read 2-3 existing files in the same pattern before writing new ones
   - Prefer extending existing files/utilities over creating new abstractions
   - When in doubt about an approach, ask rather than guess

7. **Implement the sub-task** following the acceptance criteria, implementation plan, and existing patterns. Apply the loaded skill's standards.

8. **Do NOT move onto the next sub-task** until the user has reviewed the work. Check in between sub-tasks and give the user time to do a light code review before moving on, even if working on the same branch.

9. **Defer tests** unless absolutely critical for the feature to function.

## On Completion

10. **Update `.claude/review-context.md`**:
    - If first sub-task: completely rewrite with new user story context, branch info, requirements, and changes made
    - If continuation: append the new sub-task's changes to the existing file
    - Follow the existing format (see current file for structure): goals, requirements with acceptance criteria checklist, changes table per sub-task, areas to focus, known limitations, testing notes
    - This file accumulates all work for the user story — it will be used for full review and developer testing once all sub-tasks are complete

11. **Update `project-documentation/project-state.md`**:
    - Mark the sub-task as completed in the implementation plan
    - Note any decisions made or deviations from the plan
    - Keep the updates concise

12. **Summarise** what was done and confirm you're ready for the user's review before proceeding to the next sub-task.

## Constraints

- Use **British English** throughout
- Do not run `git add`, `git commit`, or `git push`
- Do not move to the next sub-task without user review
- Defer tests unless absolutely critical
- `project-state.md` is the source of truth over Jira tickets
- Load the appropriate Claude skill for the domain of work
