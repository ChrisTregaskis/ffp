# Epic Planning Pattern

**Version**: 1.0
**Last updated**: 2026-03-02
**Worked examples**: FFP-3 (Video Management), FFP-4 (Programme Execution)

---

## Overview

Every FFP epic follows a **three-phase workflow** before implementation begins:

```
Phase 1: Research  →  Phase 2: Epic Plan  →  Phase 3: Jira Generation
```

Each phase produces a specific artefact. Later phases depend on earlier ones — never skip ahead.

| Phase              | Output                         | Location            | Tracked in Git? |
| ------------------ | ------------------------------ | ------------------- | --------------- |
| 1. Research        | One or more research documents | `.claude/research/` | No (gitignored) |
| 2. Epic Plan       | Single epic plan document      | `.claude/research/` | No (gitignored) |
| 3. Jira Generation | Tickets created in Jira        | Jira (FFP project)  | N/A             |

> **Why gitignored?** Research and epic plans are working documents for Claude Code sessions. The Jira tickets and committed code are the durable artefacts. The research files persist locally for cross-reference during implementation.

---

## Phase 1: Research

### Purpose

Investigate the problem domain, audit existing code, confirm technical decisions, and document everything needed for the epic plan.

### When to Use Multiple Research Documents

- **Single domain** (e.g., FFP-3 video management): one research doc is sufficient
- **Multiple domains** (e.g., FFP-4 spans database, API, and frontend): split into focused documents — one per domain area, plus companion documents for prototype breakdowns or user flow analysis

### File Naming Convention

```
.claude/research/{epic-key-lowercase}-{topic}.md
```

**Examples:**

| Epic  | Files                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------- |
| FFP-3 | `video-management-research.md`                                                                                          |
| FFP-4 | `programme-data-model-research.md`, `ffp-4-frontend-api-research.md`, `patient-portal-prototype-user-flow-breakdown.md` |

### Research Document Template

```markdown
# [Domain] Research: [Title]

**Date**: [YYYY-MM-DD]
**Status**: Decisions confirmed | In progress
**Purpose**: [Single-sentence purpose]
**Depends on**: [Upstream research docs, if any]
**Consumed by**: [Downstream epic plan / story references]

---

## 1. What We Already Have

[Inventory tables organised by layer: Infrastructure, Backend, Frontend, Database]
[Each row: component / status / details]

**What's NOT Yet Built:**

- [Explicit scope boundary — what does NOT exist yet]

## 2. Research Findings

### 2.x [Topic Area]

[Comparison tables: approach / best practice / MVP recommendation]
[Key insight callouts explaining WHY a choice was made]

## 3. [Domain-Specific Technical Detail]

[Deep schema/architecture detail — field-level column tables, H4 per entity if needed]
[FK behaviour, RLS policy details, index recommendations]

## 4. Confirmed Decisions

| #   | Decision        | Confirmed Choice | Rationale |
| --- | --------------- | ---------------- | --------- |
| 1   | [Decision name] | [Choice]         | [Why]     |

[Each decision may also include an "Alternative Considered" note]

## 5. Risk / Impact Analysis

[Risk table: risk / likelihood / impact / mitigation]
[Or: impact assessment mapping changes to existing files]
[Or: scalability migration path — MVP vs future]

## Sources

### [Topic Group]

- [URL with description]
```

### Phase 1 Checklist

- [ ] Audit existing codebase — what's already built, what's missing
- [ ] Research best practices for each technical domain
- [ ] Document comparison tables for key decisions (approach vs MVP recommendation)
- [ ] Confirm all architectural decisions with rationale
- [ ] Assess impact on existing code (which files change, which are new)
- [ ] Identify risks and mitigations
- [ ] List external sources consulted
- [ ] Cross-reference upstream research docs if this epic depends on earlier work
- [ ] Review with user before proceeding to Phase 2

---

## Phase 2: Epic Plan

### Purpose

Translate confirmed research decisions into a sprint-by-sprint delivery plan with stories, acceptance criteria, and subtask breakdowns.

### File Naming Convention

```
.claude/research/ffp-{N}-epic-plan.md
```

**Examples:** `ffp-3-epic-plan.md`, `ffp-4-epic-plan.md`

### Epic Plan Template

```markdown
# FFP-N Epic Plan: [Title]

**Date**: [YYYY-MM-DD]
**Status**: v1.0 — Ready for Jira generation
**Epic**: FFP-N ([Epic name])
**Velocity**: ~25 pts/sprint | **Capacity**: 8 hrs/week
**References**: [Research doc paths]

---

## Epic Summary

[One paragraph describing what this epic delivers]

**Scope boundary:**

- **This epic covers**: [bullet list]
- **Next epic picks up**: [bullet list]

**Key architectural decisions (confirmed):**

| #   | Decision   | Choice   | Reference               |
| --- | ---------- | -------- | ----------------------- |
| 1   | [Decision] | [Choice] | [Research doc §section] |

---

## Sprint Overview

| Sprint | Focus  | Points | Risk Level      |
| ------ | ------ | ------ | --------------- |
| N      | [Name] | ~XX    | Low/Medium/High |

---

## Sprint N: [Name] (~XX pts)

### Story N: [Title] (N pts)

**As a** [user type],
**I want** [action],
**So that** [benefit].

**Acceptance Criteria:**

_AC1: [Title]_
Given [precondition],
When [action],
Then [outcome].

_AC2: [Title]_
Given [precondition],
When [action],
Then [outcome].

**Technical Notes:**

- [Implementation approach, file paths, patterns]
- **Schema reference**: [research doc §section] (if applicable)
- **Response shape reference**: [research doc §section] (if applicable)

**Subtasks:**

1. [Action verb]: [Specific outcome]
2. [Action verb]: [Specific outcome]

---

### Task N: [Title] (N pts)

**Type**: Task (not a user story)

**Acceptance Criteria:**

_AC1: [Title]_
Given [precondition],
When [action],
Then [outcome].

**Technical Notes:**

- [Implementation details]

**Subtasks:**

1. [Action verb]: [Specific outcome]

---

## Summary

### Story Point Allocation

| Sprint | Stories                         | Total Pts |
| ------ | ------------------------------- | --------- |
| N      | Story 1 (Xpts) + Story 2 (Xpts) | XX        |

### FFP-N Boundary

**FFP-N delivers:**

- [What users/system gains from this epic]

**FFP-N+1 picks up:**

- [What's deferred to the next epic]

### Dependencies

[ASCII arrow diagram showing which stories block others]

### What This Delivers

[Narrative paragraph summarising the user-facing value]

### Next Steps

1. [ ] Review epic plan with user
2. [ ] Create Jira tickets (Phase 3)
3. [ ] Begin Sprint N implementation
```

### Writing Guidelines

- **Stories** use "As a / I want / So that" format with Given-When-Then acceptance criteria
- **Tasks** (technical work without user-facing value) use objective + AC checklist format
- **Subtask summaries** use imperative form: `[Action verb]: [Specific outcome]`
- **Technical Notes** cross-reference research documents by section (e.g., `§2.3`) — don't duplicate content
- **Story points** use Fibonacci scale: 1, 2, 3, 5, 8, 13 (Stories), 1–8 (Tasks)
- **Velocity target**: ~25 points per sprint at 8 hrs/week capacity

### Phase 2 Checklist

- [ ] All research decisions are reflected in the plan (no orphaned decisions)
- [ ] Each story has acceptance criteria in Given-When-Then format
- [ ] Each story has subtasks with imperative action verbs
- [ ] Technical Notes reference research docs, not duplicate them
- [ ] Sprint totals respect velocity (~25 pts/sprint)
- [ ] Story dependencies are identified and documented
- [ ] Scope boundary is explicit — what this epic covers vs what the next epic picks up
- [ ] Sprint Overview table summarises the full epic at a glance
- [ ] Review with user before proceeding to Phase 3

---

## Phase 3: Jira Generation

### Purpose

Create all Jira tickets from the epic plan — parent stories/tasks first, then subtasks as children, with blocking links between dependent stories.

### Tooling

Use the Atlassian MCP tools:

- **Create issues**: `mcp__atlassian__jira_create_issue`
- **Link issues**: `mcp__atlassian__jira_create_issue_link` (type: `Blocks`)
- **Add to epic**: Set `Epic Link` field on creation

### Creation Order

Dependencies dictate creation order. Always create parent tickets that are **blocked by nothing** first, then work forward through the dependency chain.

**Example from FFP-4:**

```
1. Story 1 (no dependencies — create first)
2. Story 2 (blocked by Story 1)
3. Story 3 (blocked by Story 1)
4. Story 4 (blocked by Stories 2 & 3)
5–7. Stories 5–7 (blocked by Sprint 9 stories)
...
```

After each parent ticket is created, immediately create its subtasks as children.

### Field Mappings

| Field         | Stories (10010)                               | Tasks (10008)                                           | Subtasks (10012)                    |
| ------------- | --------------------------------------------- | ------------------------------------------------------- | ----------------------------------- |
| Issue Type ID | 10010                                         | 10008                                                   | 10012                               |
| Summary       | Descriptive title                             | `[Action]: [Outcome]`                                   | `[Action verb]: [Specific outcome]` |
| Story Points  | Fibonacci 1–13                                | Fibonacci 1–8                                           | Not estimated                       |
| Epic Link     | Set to parent epic                            | Set to parent epic                                      | Inherited from parent               |
| Sprint        | Not assigned                                  | Not assigned                                            | Inherited from parent               |
| Labels        | `backend`, `database`, `frontend`, `security` | `infrastructure`, `refactor`, `devops`, `documentation` | None (inherited)                    |
| Parent        | N/A                                           | N/A                                                     | Parent story/task key               |

### Description Content

- **Stories**: User story format + Background + Acceptance Criteria (Given-When-Then) + Technical Notes + Dependencies + Out of Scope
- **Tasks**: Objective + Technical Details (Steps + Files) + AC (checklist) + Verification
- **Subtasks**: Objective + Technical Details + AC (checklist) + Verification

Reference the Jira standards for full templates:

- `.claude/sprint-planning/jira-standards/story-standards.md`
- `.claude/sprint-planning/jira-standards/task-standards.md`
- `.claude/sprint-planning/jira-standards/subtask-standards.md`

### Phase 3 Checklist

- [ ] Read the epic plan document fully before creating any tickets
- [ ] Load the Jira standards files for reference
- [ ] Create parent tickets in dependency order (unblocked first)
- [ ] Create subtasks immediately after each parent ticket
- [ ] Add `Blocks` links between dependent stories
- [ ] Use domain-appropriate labels (`backend`, `database`, `frontend`, etc.)
- [ ] Do NOT assign sprints — leave for sprint planning
- [ ] Reference research docs in descriptions rather than duplicating content
- [ ] Use British English throughout all ticket content
- [ ] Log all created ticket keys as you go (for the creation registry)
- [ ] Verify ticket count matches the epic plan

### Creation Prompt Template

When starting a Jira generation session, create a prompt file at `.claude/prompts/` with:

```markdown
# FFP-NNN Phase 3: Create Jira Tickets for FFP-N

## Context

[Phase description, what's complete, stop behaviour]

## Source Document

- `.claude/research/ffp-{N}-epic-plan.md`

## Jira Standards

- `.claude/sprint-planning/jira-standards/story-standards.md`
- `.claude/sprint-planning/jira-standards/subtask-standards.md`
- `.claude/sprint-planning/jira-standards/task-standards.md`

## What to Create

[Sprint-by-sprint table: # / type / summary / points]

## Creation Instructions

1. Read the epic plan first
2. Use MCP tool: mcp**atlassian**jira_create_issue
3. Create subtasks as children of their parent
4. Labels: backend / database / frontend (per domain)
5. No sprint assignment
6. Reference research docs, don't duplicate
7. British English throughout

## Ticket Creation Order

[Numbered dependency order with blocked-by relationships]

## Notes

[Rate limit guidance, logging instructions]
```

---

## Worked Examples

### FFP-3: Video Management & Streaming

| Phase     | Artefact                       | Key Characteristics                                                                                                  |
| --------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Research  | `video-management-research.md` | Single document covering S3 storage, CloudFront delivery, video encoding, signed URLs, security, and cost projection |
| Epic Plan | `ffp-3-epic-plan.md`           | 2 sprints (7–8), 10 items, 55 story points. Decisions listed as bullets                                              |
| Jira      | Created under epic FFP-3       | Stories + subtasks with blocking links                                                                               |

### FFP-4: Programme Execution & Progress Tracking

| Phase     | Artefact                                                                                                                                                       | Key Characteristics                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Research  | `programme-data-model-research.md` (database), `ffp-4-frontend-api-research.md` (API + frontend), `patient-portal-prototype-user-flow-breakdown.md` (UX flows) | Three documents — one per domain. Deepest technical doc (data model) goes to H4 level with field-level column tables  |
| Epic Plan | `ffp-4-epic-plan.md`                                                                                                                                           | 3 sprints (9–11), 10 items, 63 story points. Decisions in a numbered table with research cross-references             |
| Jira      | Created under epic FFP-4                                                                                                                                       | 10 parent tickets, 71 subtasks, 17 blocking links. Creation prompt: `.claude/prompts/ffp-348-phase3-jira-creation.md` |

### Evolution Between FFP-3 and FFP-4

The pattern matured between the two epics:

| Aspect             | FFP-3                           | FFP-4                                                      | Recommendation                         |
| ------------------ | ------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Research docs      | 1 document                      | 3 documents (split by domain)                              | Split when epic spans multiple domains |
| Decisions format   | Bullet list                     | Numbered table with research cross-references              | Use the table format                   |
| Technical Notes    | Inline details                  | Cross-references to research doc sections (e.g., `§2.3`)   | Cross-reference, don't duplicate       |
| Prototype analysis | N/A                             | Separate companion document with production notes per page | Include when UI design exists          |
| Epic boundary      | Two-way (this epic / next epic) | Three-way (previous / this / next)                         | Use three-way for continuity           |

---

## Quick-Start Guide

Starting a new epic? Follow these steps:

### 1. Create a planning ticket

Create a Jira ticket (type: Task) for the epic planning work itself:

```
FFP-NNN: Plan FFP-N [Epic Name]
```

With phases as subtasks or acceptance criteria.

### 2. Phase 1 — Research

```bash
# Create research file(s)
touch .claude/research/{topic}-research.md
```

Use the research template above. Focus on:

- What exists today (audit)
- Best practices (comparison tables)
- Technical detail (schema/architecture)
- Confirmed decisions (numbered table)
- Risk analysis

### 3. Phase 2 — Epic Plan

```bash
# Create epic plan
touch .claude/research/ffp-{N}-epic-plan.md
```

Use the epic plan template above. Focus on:

- Sprint-by-sprint breakdown
- Stories with Given-When-Then ACs
- Subtask lists with imperative verbs
- Cross-references to research (not duplication)
- Dependency mapping

### 4. Phase 3 — Jira Generation

```bash
# Create creation prompt (optional but recommended for complex epics)
touch .claude/prompts/ffp-NNN-phase3-jira-creation.md
```

Use the creation prompt template above, then execute via Atlassian MCP tools.

---

## References

- **Jira standards**: `.claude/sprint-planning/jira-standards/`
- **FFP-3 research**: `.claude/research/video-management-research.md`
- **FFP-3 epic plan**: `.claude/research/ffp-3-epic-plan.md`
- **FFP-4 research**: `.claude/research/programme-data-model-research.md`, `.claude/research/ffp-4-frontend-api-research.md`, `.claude/research/patient-portal-prototype-user-flow-breakdown.md`
- **FFP-4 epic plan**: `.claude/research/ffp-4-epic-plan.md`
- **FFP-4 Jira creation prompt**: `.claude/prompts/ffp-348-phase3-jira-creation.md`
