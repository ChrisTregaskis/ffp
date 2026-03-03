# FFP Jira Standards

Modular ticket templates for the FFP project. Load only the modules needed for the current task.

## Jira Project Details

- **Site**: `https://ctregaskis.atlassian.net`
- **Project Key**: `FFP`
- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`

**Issue Types:**

| Type    | ID    | Usage                      |
| ------- | ----- | -------------------------- |
| Epic    | 10011 | Sprint-level container     |
| Story   | 10010 | User-facing functionality  |
| Task    | 10008 | Technical work             |
| Subtask | 10012 | Breakdown of Stories/Tasks |
| Bug     | 10006 | Defects and issues         |

## Module Loading Guide

| Task                  | Load These Files                                               | Est. Tokens |
| --------------------- | -------------------------------------------------------------- | ----------- |
| **Epic Planning**     | `epic-standards.md`                                            | ~2,500      |
| **Story Planning**    | `story-standards.md` + `story-points.md`                       | ~3,500      |
| **Task Creation**     | `task-standards.md`                                            | ~2,000      |
| **Subtask Breakdown** | `subtask-standards.md`                                         | ~1,500      |
| **Bug Triage**        | `bug-standards.md`                                             | ~2,500      |
| **Full Planning**     | `epic-standards.md` + `story-standards.md` + `story-points.md` | ~6,000      |
| **Field Reference**   | `jira-fields.md`                                               | ~1,500      |
| **DoD Checklist**     | `definition-of-done.md`                                        | ~1,000      |

**Do NOT load all modules at once** — total is ~16k tokens. Only load what the current task requires.

## File Descriptions

**Core Standards (by ticket type):**

- `epic-standards.md` — Epic template, examples, guidelines
- `story-standards.md` — User Story template, AC format, examples
- `task-standards.md` — Task template, technical work examples
- `subtask-standards.md` — Subtask template, breakdown examples
- `bug-standards.md` — Bug template, severity guidelines, examples

**Shared References:**

- `story-points.md` — Fibonacci scale, estimation guidelines, examples by point value
- `definition-of-done.md` — DoD checklists per ticket type
- `jira-fields.md` — Labels, components, API examples, field IDs
