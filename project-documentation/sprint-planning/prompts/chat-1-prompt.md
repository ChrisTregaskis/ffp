# Chat 1 Prompt: Define Jira Ticket Standards

**Context**: I'm planning sprints for FFP (Fit For Purpose), a multi-tenant physiotherapy SaaS platform. This is Chat 1 of a structured sprint planning process.

**Project**: Solo developer building healthcare SaaS with React + TypeScript + SST + PostgreSQL + Cognito + Turborepo

**Documentation Location**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/`

**Jira Details**:

- **Site**: `https://ctregaskis.atlassian.net`
- **Project**: FFP (Fit For Purpose)
- **Project Key**: `FFP`
- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- **Issue Types Available**:
  - Epic (10011)
  - Story (10010)
  - Task (10008)
  - Subtask (10012)
  - Bug (10006)

---

## Objective

Define comprehensive Jira ticket structure and standards for:

1. **Epic** template
2. **User Story** template
3. **Task** template
4. **Sub-task** template
5. **Bug** template

**Note**: Standards will be saved as markdown reference doc in repo, NOT created in Confluence.

---

## Requirements

### What I Need

For each ticket type, define:

1. **Purpose**: When to use this ticket type
2. **Required Fields**: Standard Jira fields (Summary, Description, etc.)
3. **Custom Fields** (if any): Specific to FFP project
4. **Description Template**: Markdown structure with sections
5. **Acceptance Criteria Format**: How to write testable criteria
6. **Story Point Guidelines** (for Stories): Fibonacci scale rationale
7. **Examples**: 2 realistic examples per ticket type

### Key Considerations

**For FFP Project:**

- Multi-tenant architecture (RLS critical)
- Healthcare security (OWASP compliance)
- Solo developer (automated testing, CI/CD focus)
- Testing requirement: Minimum 2 functional tests per User Story
- Tech stack: React, TypeScript, SST, PostgreSQL, Drizzle, Turborepo

**Standards from project-documentation:**

- TypeScript strict mode, no `any`
- Zod validation everywhere
- Service layer + Repository pattern
- 30% test coverage Phase 1 target, 80%+ on critical paths

---

## Deliverables

Create markdown file: `jira-ticket-standards.md` in `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/outputs/`

Include:

1. **Ticket Type Standards**: Covering all 5 types with Jira field mappings
2. **Template Examples**: Real FFP scenarios (e.g., "Epic: Application Setup", "Story: Implement Cognito Authentication")
3. **Story Point Reference**: Quick guide for estimation
4. **Definition of Done Checklist**: Per ticket type
5. **Jira Creation Examples**: Sample API calls or format for creating each type

---

## Sprint Context

Planning 6 sprints:

- Sprint 1: Application setup (Turborepo, SST, Auth, RDS, CI/CD, Testing)
- Sprint 2: Assessment engine core
- Sprint 3: Video management & streaming
- Sprint 4: User dashboards & progress
- Sprint 5: Business portal
- Sprint 6: Company management portal

---

## Output Format

Create a single comprehensive markdown document.

Structure:

- Table of contents
- Each ticket type as a major section with:
  - Purpose & when to use
  - Required Jira fields
  - Description template (markdown format for Jira)
  - Acceptance criteria format
  - Definition of Done
  - 2 realistic FFP examples
- Story point reference table
- Jira-specific notes (field IDs, hierarchy, linking)

---

## Next Steps

After Chat 1 completes:

1. Review and refine standards
2. Save output to `sprint-planning/outputs/jira-ticket-standards.md`
3. Move to Chat 2: **Create 6 Epics directly in Jira** (not markdown)
4. Use standards consistently for all Jira ticket creation

---

**Question**: Ready to define the Jira ticket standards for FFP?
