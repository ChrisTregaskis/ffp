# FFP — Project State

This file is an **optional personal working file** used to track sprint progress, decisions, and context between Claude Code sessions.

## Setup

Each developer can maintain their own copy at:

```
.claude/local/project-state.md
```

This path is gitignored and personal to each developer. It is **not required** — commands and skills that reference it will fall back to Jira context when the file is absent.

## What to track

If you choose to use it, a project-state file typically includes:

- Current sprint and epic context
- In-progress and completed stories with key decisions
- Reference file paths for active work
- Design decisions and trade-offs made during implementation

## How it's used

Several Claude Code commands (`/pick-up`, `/work-on`, `/worktree`, `/smoke-test`, `/plan-sprint`) and skills will read from and write to `.claude/local/project-state.md` if it exists. When absent, they rely on Jira as the source of truth.
