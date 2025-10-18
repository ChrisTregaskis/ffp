# FFP Sprint Planning - Chat Flow Guide

**Last Updated**: October 17, 2025

---

## Overview

Structured approach to sprint planning using Claude with **direct Jira integration**.

**Key Change**: We create Jira issues directly via API, NOT markdown files.

**Jira Project**: FFP at `https://ctregaskis.atlassian.net`

---

## Chat Sequence

### ✅ Chat 1: Define Ticket Standards

**Prompt**: `sprint-planning/chat-1-prompt.md`  
**Output**: `outputs/jira-ticket-standards.md` (reference doc in repo)  
**Status**: Ready to start  
**Objective**: Define Epic, User Story, Task, Sub-task, and Bug templates with Jira field mappings

---

### ⏸️ Chat 2: Create Epics in Jira

**Prompt**: `sprint-planning/chat-2-prompt.md`  
**Output**:

- 6 Epics created in Jira (FFP-1 through FFP-6)
- `outputs/epics-created-summary.md` (reference doc)  
  **Status**: Pending Chat 1 completion  
  **Objective**: Create 6 Epics directly in Jira using API

---

### ⏸️ Chat [E1]: Sprint 1 - User Stories

**Prompt**: TBD after Chat 2  
**Output**:

- User Stories created in Jira linked to Sprint 1 Epic
- `outputs/sprint-1-stories-created.md` (reference doc)  
  **Status**: Pending  
  **Objective**: Create User Stories in Jira for Sprint 1 Epic

---

### ⏸️ Chat [E2-E6]: Remaining Sprints - User Stories

**Prompt**: TBD  
**Output**: Stories created in Jira + summary docs
**Status**: Pending  
**Objective**: Create User Stories in Jira for Sprints 2-6 Epics

---

### ⏸️ Chat [US-Sprint1-Batch1]: Add Story Details

**Prompt**: TBD  
**Output**: Updated Jira stories with detailed acceptance criteria
**Status**: Pending  
**Objective**: Update existing Sprint 1 stories with detailed descriptions, acceptance criteria, tasks/subtasks

---

## How to Use

1. **Start New Chat**: Use the prompt file content
2. **Copy Prompt**: From `sprint-planning/chat-X-prompt.md`
3. **Paste in New Claude Chat**: Maximize token availability
4. **Claude Creates Jira Issues**: Via Atlassian API
5. **Review in Jira**: Verify created issues
6. **Save Summary Doc**: Claude generates reference markdown
7. **Update This Guide**: Mark chat as complete

---

## Prompt Locations

All prompts stored in:

```
/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/
```

Files:

- `chat-1-prompt.md` ✅ Ready
- `chat-2-prompt.md` ✅ Ready
- `chat-[E1-6]-prompt.md` ⏸️ Create after Chat 2
- `chat-[US]-prompt.md` ⏸️ Create after Epic breakdown

---

## Output Locations

**Jira Issues**: Created directly at `https://ctregaskis.atlassian.net`

**Reference Docs** saved to:

```
/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/outputs/
```

Expected reference docs:

- `jira-ticket-standards.md` - Template definitions
- `epics-created-summary.md` - Links to 6 Epics
- `sprint-[1-6]-stories-created.md` - Links to created Stories
- `sprint-[1-6]-stories-updated-batch-[n].md` - Update logs

---

## Tips for Success

1. **Copy Full Prompt**: Don't modify, paste as-is
2. **Start Fresh Chat**: Each prompt in new chat for max tokens
3. **Verify Jira Creation**: Check issues were created successfully
4. **Save Reference Docs**: Claude generates summary markdown files
5. **Copy Jira URLs**: Keep links to created Epics/Stories
6. **Update project-state.md**: After each major milestone

---

## Quick Reference

**Current Phase**: Sprint Planning  
**Next Action**: Copy `chat-1-prompt.md` → Start new Claude chat  
**Goal**: Define ticket standards before creating Epics

---

## Sprint 1 Confirmed Scope

Quick reference for Chat 1 context:

- Turborepo, linting, TypeScript, pre-commit/pre-push hooks
- SST, Cognito, RDS, API Gateway, Web scaffold
- Testing patterns (Vitest, Playwright, MSW)
- Environment config, CI/CD, CloudWatch logging
- Error handling, GitHub Copilot PR reviews
