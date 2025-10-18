# FFP - Project State

**Last Updated**: October 18, 2025  
**Current Phase**: Sprint Planning  
**Solo Developer**: Christopher Tregaskis

---

## Current Phase: Sprint Planning

### Status

✅ **Complete**: Chat 1 - Jira ticket standards defined (modular structure)  
✅ **Complete**: Chat 2 - Created all 6 Epics in Jira (FFP-1 to FFP-6)  
✅ **Complete**: Chat E1 - Created 10 User Stories for Sprint 1 (FFP-7 to FFP-16)  
🔄 **In Progress**: Ready for Chat S1 - Create Subtasks for Sprint 1 stories  
⏸️ **Not Started**: User Stories for Sprints 2-6, Sprint 1 execution

### Focus Areas

- ✅ Jira ticket standards (Epic, Story, Task, Sub-task, Bug) - Modular & token-optimised
- ✅ Created all 6 Epics in Jira with full descriptions and realistic timeline
- ✅ Created 10 User Stories for Sprint 1 (FFP-7 to FFP-16) with comprehensive details
- ✅ Migrated from SCRUM to FFP project key (clean FFP-X issue keys)
- 🔄 Create Subtasks for Sprint 1 stories (starting with FFP-7)
- ⏸️ Create User Stories for Sprints 2-6 (FFP-2 to FFP-6)
- ⏸️ Sprint 1 execution (8-10 weeks)

### Sprint Planning Approach

**Structured conversation flow:**

1. ✅ **Chat 1**: Define ticket standards (COMPLETE - modular structure created)
2. ✅ **Chat 2**: Create all 6 Epics in Jira (COMPLETE - FFP-1 to FFP-6)
3. ✅ **Chat E1**: Create User Stories for Sprint 1 (COMPLETE - FFP-7 to FFP-16)
4. 🔄 **Chat S1**: Create Subtasks for Sprint 1 stories (Next - starting with FFP-7)
5. ⏸️ **Chat E2-E6**: Create User Stories for Sprints 2-6
6. ⏸️ **Sprint 1 Execution**: Start coding!

**Sprint Structure:**

- **Sprint 1**: Application setup (Turborepo, SST, Auth, RDS, API, Web, Testing) - **50 story points**
- **Sprint 2**: Assessment engine core
- **Sprint 3**: Video management & streaming
- **Sprint 4**: User dashboards & progress tracking
- **Sprint 5**: Business portal
- **Sprint 6**: Company management portal

---

## Phase Instructions

### Prototype Phase ✅ COMPLETE

- All core flows prototyped in Figma
- No code implementation required

### Planning Phase ✅ COMPLETE

- Architecture decisions finalised
- ERDs and schemas defined
- Patterns and standards established
- Tech stack confirmed (React, TypeScript, SST, PostgreSQL, Cognito, Drizzle, Turborepo)
- Testing strategy documented (hybrid approach: mocked DB + real RLS tests)

### Sprint Planning Phase 🔄 CURRENT

**What to do:**

- ✅ Define Jira ticket structure and standards (COMPLETE)
- ✅ Create Epics for all sprints in Jira (COMPLETE)
- ✅ Break down Sprint 1 Epic into User Stories (COMPLETE)
- 🔄 Create Subtasks for complex stories (5+ points)
- ⏸️ Break down Sprints 2-6 Epics into User Stories
- ⏸️ Set up Jira board for Sprint 1

**What NOT to do:**

- Write production code yet
- Create database migrations
- Set up infrastructure
- Deploy anything

### Sprint Execution Phases ⏸️ FUTURE

Will begin after sprint planning complete. Each sprint will have its own phase tracking.

---

## Sprint Planning Progress

### ✅ Chat 1: Ticket Standards (COMPLETE)

**Created modular Jira standards** (token-optimised):

- `jira-standards/LOAD-THIS-FIRST.md` - Loading guide
- `jira-standards/epic-standards.md` - Epic template + 2 examples
- `jira-standards/story-standards.md` - Story template + 2 examples
- `jira-standards/task-standards.md` - Task template + 2 examples
- `jira-standards/subtask-standards.md` - Subtask template + 2 examples
- `jira-standards/bug-standards.md` - Bug template + 2 examples
- `jira-standards/story-points.md` - Fibonacci estimation guide
- `jira-standards/definition-of-done.md` - DoD checklists
- `jira-standards/jira-fields.md` - Labels, components, API examples

**Token optimisation achieved:**

- Old approach: 17,000 tokens per chat (monolithic file)
- New approach: 2,000-6,000 tokens per chat (load only what's needed)
- **Savings: 65-88% per conversation** ✨

### ✅ Chat 2: All 6 Epics Created (COMPLETE)

- Noted in progress-log

### 🔄 Chat S1: Sprint 1 Subtasks (NEXT)

**Ready to create subtasks for:**

- FFP-7: Turborepo Monorepo Setup (3 points) - Starting with this
- FFP-8: SST Infrastructure Foundation (5 points)
- FFP-9: Cognito Authentication (8 points)
- FFP-10: PostgreSQL Schema with RLS (8 points)
- FFP-11: Drizzle ORM Setup (5 points)
- FFP-12: Testing Framework Configuration (5 points)
- FFP-13: CI/CD Pipeline (5 points)
- FFP-16: Web Login/Logout Flow (5 points)

**Stories NOT needing subtasks** (3 points, simple enough):

- FFP-14: CloudWatch Logging
- FFP-15: Error Handling Patterns

---

## Sprint 1: Application Setup Scope

**Total Story Points**: 50 (8-10 weeks estimated)

**Confirmed scope:**

- Turborepo setup (monorepo structure, build caching)
- SST infrastructure foundation (AuthStack, DatabaseStack, ApiStack, MonitoringStack)
- Cognito authentication (custom attributes: tenantId, role)
- RDS PostgreSQL setup with Row-Level Security (RLS)
- Drizzle ORM configuration
- API Gateway structure with JWT authorisers
- Web application scaffold (React + Vite + TailwindCSS)
- Testing framework (Vitest, Playwright, MSW)
- CI/CD foundation (GitHub Actions)
- CloudWatch logging (structured JSON)
- Error handling patterns (custom error classes)
- Web login/logout flow (Amplify integration)

**Critical success criteria:**

- RLS integration tests pass (multi-tenant isolation verified)
- JWT contains tenantId and role
- E2E login test passes
- All TypeScript strict mode, no errors

---

## Jira Project Details (Updated)

### Current FFP Project

- **Site**: `https://ctregaskis.atlassian.net`
- **Project Key**: `FFP` ✅
- **Project Name**: `Fit For Purpose`
- **Project ID**: `10033`
- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`

### Issue Types Available

- Epic (10011)
- Story (10010)
- Task (10008)
- Subtask (10012)
- Bug (10009)

### Current Issues

**Epics (FFP-1 to FFP-6)**:

- FFP-1: Application Setup & Foundation
- FFP-2: Assessment Engine Core
- FFP-3: Video Management & Streaming
- FFP-4: User Dashboards & Progress Tracking
- FFP-5: Business Portal
- FFP-6: Company Management Portal

**Sprint 1 Stories (FFP-7 to FFP-16)**:

- All 10 stories created with full descriptions
- Linked to Epic FFP-1
- Ready for subtask breakdown

---

## Key Decisions Made

### Documentation & Token Optimisation

1. **Modular Jira standards** - 65-88% token reduction per chat
2. **Custom instructions** - Embedded file ignore list in Project settings
3. **project-state.md always loaded** - Current phase context (~800 tokens)
4. **Domain docs on-demand** - Load only when query needs them
5. **Meta-docs excluded** - Workflow guides, prompts not in Claude Knowledge
6. **Progress log separated** - Detailed history in process-log.md (not always loaded)

### Sprint Planning

1. **Direct Jira integration** - Create issues via API, not markdown files
2. **One chat per sprint** - Create Epic + Stories together
3. **Incremental detail** - High-level first, add details as needed
4. **Token-conscious** - Load only necessary standards per chat type
5. **Project migration** - Moved from SCRUM to FFP keys for consistency

---

## Quick Context

- **MVP Goal**: Ship functional product as solo developer
- **Users**: Individual users + Business accounts (sub-users) + Company admin
- **Core Value**: Dynamic assessments → Personalised programs → Video workouts
- **Critical**: Multi-tenant isolation, healthcare security, OWASP compliance
- **Timeline**: Aiming for functional MVP (solo build, 8 hours/week)
- **Sprint 1**: 50 story points, 8-10 weeks estimated

---

## Progress Summary

**Recent Work** (Oct 18, 2025):

- ✅ Created 10 User Stories for Sprint 1 (FFP-7 to FFP-16)
- ✅ Generated comprehensive sprint planning documentation
- ✅ Migrated from SCRUM to FFP project key (clean FFP-X issues)
- ✅ Archived old SCRUM project after migration
- ✅ Updated all documentation to reference new FFP project
- 🔄 Ready for Chat S1: Create Subtasks for Sprint 1 stories

**See `process-log.md` for detailed session history.**

---

**Next Action**: Start new Claude chat with `prompts/2025-10-17_2230_chat-s1-template-subtasks` template to create subtasks for FFP-7 (Turborepo Monorepo Setup)
